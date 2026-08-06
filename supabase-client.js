// Supabase client init for the browser app.
//
// This is a plain static site (no bundler), so it can't read a Node-style
// `.env` file at runtime. Instead it reads window.__ENV__, which is set by
// env-config.js — a small gitignored file (see env-config.example.js for the
// shape). This mirrors the same "real values stay out of git" pattern used
// for the Node migration script's .env, just adapted for a browser context.
//
// Load order required in index.html (before app.js):
//   1. Supabase UMD SDK (CDN)
//   2. env-config.js
//   3. supabase-client.js
//   4. app.js

(function () {
  const env = window.__ENV__ || {};
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      '[supabase-client] Missing SUPABASE_URL / SUPABASE_ANON_KEY. ' +
      'Copy env-config.example.js to env-config.js and fill in your project values.'
    );
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[supabase-client] Supabase SDK not loaded — check the CDN <script> tag in index.html.');
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
