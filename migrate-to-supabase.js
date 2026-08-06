#!/usr/bin/env node
'use strict';

/**
 * One-time migration: seed Supabase with the mock data that already lives in
 * app.js (MOCK_PROFILES, MOCK_MEETUPS, DUMMY_NOTIFICATIONS, MATCHED_USER_ANSWERS).
 *
 * app.js itself is a browser script (it touches `document`/`window` at module
 * scope), so it can't be `require()`d directly under Node. Instead, this pulls
 * the exact source text of each `const NAME = ...` literal out of app.js and
 * evaluates just that text — nothing else in app.js runs, and app.js is never
 * modified.
 *
 * Usage:
 *   cp .env.example .env   # fill in SUPABASE_URL / SUPABASE_SERVICE_KEY
 *   node migrate-to-supabase.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createClient } = require('@supabase/supabase-js');

// ── tiny .env loader (no extra dependency) ──────────────────────────
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnv(path.join(__dirname, '.env'));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_KEY.');
  console.error('Copy .env.example to .env and fill in your project values.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── extract a `const NAME = <literal>` value straight out of app.js ─
// Scans for the matching top-level closing bracket by hand, skipping
// over string/template contents so stray {}/[] inside e.g. emoji text
// or descriptions don't throw off the count.
function extractLiteralSource(source, varName) {
  const marker = `const ${varName} = `;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Could not find "${marker}" in app.js`);

  let i = start + marker.length;
  const openChar = source[i];
  if (openChar !== '[' && openChar !== '{') {
    throw new Error(`Expected [ or { right after "${marker}"`);
  }

  let depth = 0;
  let j = i;
  for (; j < source.length; j++) {
    const ch = source[j];
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      j++;
      while (j < source.length) {
        if (source[j] === '\\') { j += 2; continue; }
        if (source[j] === quote) break;
        j++;
      }
      continue;
    }
    if (ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) { j++; break; }
    }
  }
  return source.slice(i, j);
}

const appJsSource = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

const profilesSrc = extractLiteralSource(appJsSource, 'MOCK_PROFILES');
const meetupsSrc = extractLiteralSource(appJsSource, 'MOCK_MEETUPS');
const notificationsSrc = extractLiteralSource(appJsSource, 'DUMMY_NOTIFICATIONS');
const matchedAnswersSrc = extractLiteralSource(appJsSource, 'MATCHED_USER_ANSWERS');

// Evaluate in an isolated sandbox, not the real Node global scope.
// MOCK_MEETUPS references MOCK_PROFILES by identifier (e.g.
// `hostImage: MOCK_PROFILES[16].image`), so bind the already-extracted
// MOCK_PROFILES into the same sandbox before evaluating it. Literals are
// wrapped in parens so a leading `{` is parsed as an object expression,
// not a labeled statement block.
const sandbox = {};
vm.createContext(sandbox);

const MOCK_PROFILES = vm.runInContext(`(${profilesSrc})`, sandbox);
sandbox.MOCK_PROFILES = MOCK_PROFILES;
const MOCK_MEETUPS = vm.runInContext(`(${meetupsSrc})`, sandbox);
const DUMMY_NOTIFICATIONS = vm.runInContext(`(${notificationsSrc})`, sandbox);
const MATCHED_USER_ANSWERS = vm.runInContext(`(${matchedAnswersSrc})`, sandbox);

console.log(
  `Extracted from app.js: ${MOCK_PROFILES.length} profiles, ` +
  `${MOCK_MEETUPS.length} meetups, ${DUMMY_NOTIFICATIONS.length} notifications.`
);

// ── camelCase -> snake_case (shallow: only top-level keys) ──────────
// e.g. birthYear -> birth_year, photoPrivate -> photo_private,
// aboutMe -> about_me, chapterProgress -> chapter_progress.
// Nested objects (aboutMe, chapterProgress, answers, ...) are stored
// as-is inside their JSONB column — only the outer key is renamed.
function toSnakeCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function convertKeys(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[toSnakeCase(key)] = value;
  }
  return out;
}

// ── demo bucket / match-intro tagging ────────────────────────────────
const REVIEW_IDS = [6, 7, 8, 9, 10];   // 다시보기
const LIKED_IDS = [12, 11, 13, 4];     // 받은 ♥
const MATCHED_IDS = Object.keys(MATCHED_USER_ANSWERS).map(Number); // 4, 5, 6, 7

const profileRows = MOCK_PROFILES.map((p) => {
  const row = convertKeys(p);
  if (REVIEW_IDS.includes(p.id)) row.demo_bucket = ['review'];
  if (LIKED_IDS.includes(p.id)) row.demo_bucket = ['liked'];
  if (MATCHED_IDS.includes(p.id)) {
    row.match_intro_answers = MATCHED_USER_ANSWERS[p.id];
    row.is_new_match = true;
  }
  return row;
});

const meetupRows = MOCK_MEETUPS.map((m) => convertKeys(m));
const notificationRows = DUMMY_NOTIFICATIONS.map((n) => convertKeys(n));

// ── insert ────────────────────────────────────────────────────────
async function insertAll(table, rows) {
  if (!rows.length) {
    console.log(`- ${table}: nothing to insert`);
    return;
  }
  const { error } = await supabase.from(table).insert(rows);
  if (error) {
    console.error(`✗ ${table}: insert failed —`, error.message);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ ${table}: inserted ${rows.length} row(s)`);
}

async function main() {
  await insertAll('profiles', profileRows);
  await insertAll('meetups', meetupRows);
  await insertAll('notifications', notificationRows);
}

main();
