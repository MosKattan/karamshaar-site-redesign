// Applies the design system. Usage (from the project folder):
//   node design-system/build.mjs            copy tokens.css into every page in site/, then rebuild the PDF
//   node design-system/build.mjs --no-pdf   copy the tokens only (fast: use this while trying values)
//   node design-system/build.mjs --check    change nothing; say whether the pages match tokens.css (exit 1 if not)
//   node design-system/build.mjs --no-shots rebuild the PDF with the page pictures taken last time
//   node design-system/build.mjs --serve    keep the book open at http://localhost:5180/design-system/src/book.html
// The PDF is printed by the Chrome installed on this machine (env CHROME overrides the path). No packages to install.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inject } from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const home = join(here, '..');
// tools/ground.mjs prints the book for a look of the testing ground by pointing DS_ROOT at a folder that holds that look's
// tokens.css and page. Everything that folder lacks (book source, images) is taken from the project itself.
const root = process.env.DS_ROOT || home, label = process.env.DS_LABEL || '';
const flags = new Set(process.argv.slice(2));
const PDF = process.env.DS_OUT || join(here, 'Karam-Shaar-Design-System.pdf');
const cache = join(root, 'design-system', '.cache');

/* ---------- 1. tokens into the pages ---------- */
const tokens = readFileSync(join(root, 'design-system', 'tokens.css'), 'utf8');
let stale = 0;
for (const name of readdirSync(join(root, 'site')).filter(f => f.endsWith('.html'))) {
  const file = join(root, 'site', name), raw = readFileSync(file, 'utf8'), next = inject(raw, tokens);
  if (next === null) { if (name !== 'test.html') console.log(`  ${name}: no token block, left alone`); continue; }
  if (next === raw) { console.log(`  site/${name}: already matches tokens.css`); continue; }
  stale++;
  if (flags.has('--check')) console.log(`  site/${name}: OUT OF STEP with tokens.css`);
  else { writeFileSync(file, next); console.log(`  site/${name}: tokens updated`); }
}
if (flags.has('--check')) process.exit(stale ? 1 : 0);
if (flags.has('--no-pdf')) process.exit(0);

/* ---------- 2. a small web server over the project, so the book can read the live page and the tokens ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.includes('..') || rel.includes('/.git/')) { res.writeHead(403).end(); return; }
  let p = [root, home].map(r => normalize(join(r, rel))).find(f => existsSync(f) && !statSync(f).isDirectory());
  if (!p) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(readFileSync(p));
});
const port = await new Promise(r => server.listen(flags.has('--serve') ? 5180 : 0, '127.0.0.1', () => r(server.address().port)));
const base = `http://127.0.0.1:${port}`;
if (flags.has('--serve')) { console.log(`\n  The book is open at http://localhost:${port}/design-system/src/book.html  (Ctrl+C to stop)`); await new Promise(() => {}); }

/* ---------- 3. Chrome, driven over its debugging port ---------- */
const chromePath = [process.env.CHROME, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && existsSync(p));
if (!chromePath) { console.error('  Chrome was not found, so the PDF was not rebuilt. The tokens are in the pages. Set CHROME to its path and run again.'); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = join(cache, 'chrome-' + process.pid);
mkdirSync(join(cache, 'shots'), { recursive: true });
const dbg = 9300 + process.pid % 4000;
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${dbg}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--window-size=1440,900',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
let failed = false;
try {
  let targets;
  for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${dbg}/json`)).json(); if (targets.length) break; } catch {} await sleep(150); }
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', e => { const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
    if (m.method === 'Runtime.exceptionThrown') { failed = true; console.log('  PAGE ERROR', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); } });
  await send('Page.enable'); await send('Runtime.enable');

  /* ---------- 4. pictures of the real page, for the book ---------- */
  // every part that waits to be scrolled to is shown at once, so one tall picture holds the whole page
  const settle = `document.querySelectorAll('.rv,.stats,.wcol,.wall-grid').forEach(e => e.classList.add('in')); document.querySelectorAll('.statement p').forEach(p => p.classList.add('is-focus')); 1`;
  const SHOTS = [
    { name: 'hero-night-en', q: 'lang=en&theme=dark', w: 1440, h: 900 },
    { name: 'hero-day-en', q: 'lang=en&theme=light', w: 1440, h: 900 },
    { name: 'hero-night-ar', q: 'lang=ar&theme=dark', w: 1440, h: 900 },
    { name: 'hero-day-ar', q: 'lang=ar&theme=light', w: 1440, h: 900 },
    { name: 'phone-night-en', q: 'lang=en&theme=dark', w: 390, h: 844, dpr: 2 },
    { name: 'phone-day-ar', q: 'lang=ar&theme=light', w: 390, h: 844, dpr: 2 },
    { name: 'wall-night-en', q: 'lang=en&theme=dark', w: 1440, h: 980, sel: '.wall', off: -70 },
    { name: 'full-night-en', q: 'lang=en&theme=dark', w: 1440, h: 900, full: true },
    { name: 'full-day-en', q: 'lang=en&theme=light', w: 1440, h: 900, full: true },
  ];
  if (!flags.has('--no-shots')) for (const s of SHOTS) {
    await send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: s.dpr || (s.full ? 1 : 1.25), mobile: s.w < 700 });
    await send('Page.navigate', { url: `${base}/site/index.html?${s.q}` });
    await sleep(5200);
    let clip;
    if (s.sel) { await ev(`window.scrollTo(0, document.querySelector(${JSON.stringify(s.sel)}).getBoundingClientRect().top + scrollY + ${s.off || 0})`); await sleep(3600); }
    if (s.full) { await ev(settle); await sleep(2600); clip = { x: 0, y: 0, width: s.w, height: await ev('document.documentElement.scrollHeight'), scale: .5 }; }
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: s.full ? 80 : 84, captureBeyondViewport: !!s.full, ...(clip ? { clip } : {}) });
    writeFileSync(join(cache, 'shots', s.name + '.jpg'), Buffer.from(shot.data, 'base64'));
    console.log(`  picture: ${s.name}`);
  }

  /* ---------- 5. the book, printed ---------- */
  await send('Emulation.setDeviceMetricsOverride', { width: 1123, height: 794, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${base}/design-system/src/book.html${label ? '?ground=' + encodeURIComponent(label) : ''}` });
  let ready = false;
  for (let i = 0; i < 240 && !ready; i++) { await sleep(500); ready = await ev('window.__bookReady === true').catch(() => false); }
  if (!ready) throw new Error('the book did not finish loading (fonts or specimens): ' + await ev('window.__bookStatus || "no status"').catch(() => '?'));
  const pages = await ev('document.querySelectorAll(".pg").length');
  if (process.env.DS_PREVIEW) for (const n of process.env.DS_PREVIEW.split(',')) {   // DS_PREVIEW=3,7 also saves those pages as pictures in .cache, for checking the layout
    const y = await ev(`document.querySelectorAll('.pg')[${+n - 1}].getBoundingClientRect().top + scrollY`);
    await send('Emulation.setDeviceMetricsOverride', { width: 1123, height: 794, deviceScaleFactor: 1.5, mobile: false });
    await ev(`scrollTo(0, ${y})`); await sleep(350);
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
    writeFileSync(join(cache, `page-${String(n).padStart(2, '0')}.jpg`), Buffer.from(shot.data, 'base64'));
  }
  if (process.env.DS_PAGES) { const [a, b = a] = process.env.DS_PAGES.split('-').map(Number);   // DS_PAGES=5-9 prints only those sheets, to try something quickly
    await ev(`document.querySelectorAll('.pg').forEach((p, i) => { if (i + 1 < ${a} || i + 1 > ${b}) p.remove(); }); 1`); }
  await send('Emulation.setDeviceMetricsOverride', { width: 1123, height: 794, deviceScaleFactor: 1, mobile: false });
  const t0 = Date.now();
  // the PDF comes back as a stream read in pieces: as one message it is too large for the connection and never arrives
  const job = await Promise.race([send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, transferMode: 'ReturnAsStream' }),
    sleep(+(process.env.DS_TIMEOUT || 240) * 1000).then(() => { throw new Error('Chrome took too long to print the PDF and was stopped.'); })]);
  const parts = [];
  for (;;) { const r = await send('IO.read', { handle: job.stream, size: 1 << 20 }); parts.push(Buffer.from(r.data, r.base64Encoded ? 'base64' : 'utf8')); if (r.eof) break; }
  await send('IO.close', { handle: job.stream });
  const pdf = Buffer.concat(parts);
  console.log(`  printed in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  try { writeFileSync(PDF, pdf); }
  catch (e) { if (e.code === 'EBUSY' || e.code === 'EPERM') throw new Error('the PDF is open in another program. Close it and run again.'); throw e; }
  console.log(`  PDF: ${relative(home, PDF).replace(/\\/g, '/')}, ${pages} pages, ${(statSync(PDF).size / 1048576).toFixed(1)} MB`);
} catch (e) { failed = true; console.error('  ' + e.message);
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill(); server.close(); await sleep(400);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
process.exit(failed ? 1 : 0);
