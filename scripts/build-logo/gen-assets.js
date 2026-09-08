const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// run from anywhere:  NODE_PATH=<repo>/node_modules node scripts/build-logo/gen-assets.js
process.chdir(__dirname); // build.py + Poppins-Black.ttf sit next to this file
const OUT = path.resolve(__dirname, '../../assets/logo');
fs.mkdirSync(OUT, { recursive: true });

const COLORS = {
  purple: '#9B72CC',
  ink:    '#2D2A2B',
  lime:   '#E2FF74',
  white:  '#FFFFFF',
};
const SIZES = [128, 256, 512, 1024, 2048];
const VB_W = 1482, VB_H = 1017;

// 1. SVG files
const svgCurrent = execFileSync('python3', ['build.py', 'currentColor']).toString().trim();
fs.writeFileSync(path.join(OUT, 'p2-logo.svg'), svgCurrent + '\n');
const svgFiles = { 'p2-logo.svg': svgCurrent };
for (const [name, hex] of Object.entries(COLORS)) {
  const s = execFileSync('python3', ['build.py', hex]).toString().trim();
  const f = `p2-logo-${name}.svg`;
  fs.writeFileSync(path.join(OUT, f), s + '\n');
  svgFiles[f] = s;
}

// square-padded variants (logo centred on a transparent square)
const S = 1900, TX = (S - VB_W) / 2, TY = (S - VB_H) / 2;
function bodyOf(svg) { return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''); }
const squareFiles = {};
for (const [name, hex] of Object.entries(COLORS)) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" fill="${hex}" role="img" aria-label="p.2">`
    + `<g transform="translate(${TX} ${TY})">${bodyOf(svgFiles['p2-logo.svg'])}</g></svg>`;
  const f = `p2-mark-square-${name}.svg`;
  fs.writeFileSync(path.join(OUT, f), s + '\n');
  squareFiles[name] = s;
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  // square PNGs
  for (const [name] of Object.entries(COLORS)) {
    for (const w of [128, 256, 512, 1024]) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: w, deviceScaleFactor: 1 });
      await page.setContent(
        `<!doctype html><meta charset=utf-8><style>*{margin:0;padding:0}html,body{background:transparent}
         svg{display:block;width:${w}px;height:${w}px}</style>${squareFiles[name]}`,
        { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 60));
      const buf = await page.screenshot({ type: 'png', omitBackground: true,
        clip: { x: 0, y: 0, width: w, height: w } });
      fs.writeFileSync(path.join(OUT, `p2-mark-square-${name}-${w}.png`), buf);
      await page.close();
    }
  }

  for (const [name, hex] of Object.entries(COLORS)) {
    const svg = svgFiles[`p2-logo-${name}.svg`];
    for (const w of SIZES) {
      const h = Math.round(w * VB_H / VB_W);
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      await page.setContent(
        `<!doctype html><meta charset=utf-8>
         <style>*{margin:0;padding:0}html,body{background:transparent}
         svg{display:block;width:${w}px;height:${h}px}</style>${svg}`,
        { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 60));
      const buf = await page.screenshot({ type: 'png', omitBackground: true,
        clip: { x: 0, y: 0, width: w, height: h } });
      fs.writeFileSync(path.join(OUT, `p2-logo-${name}-${w}.png`), buf);
      await page.close();
    }
  }
  await browser.close();

  const files = fs.readdirSync(OUT).sort();
  console.log(files.map(f => {
    const st = fs.statSync(path.join(OUT, f));
    return `  ${f}  (${(st.size/1024).toFixed(1)} KB)`;
  }).join('\n'));
})();
