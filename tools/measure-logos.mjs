// Measures where the visible mark sits inside each client logo file, for the BOX table of the clients wall in site/index.html.
// The logo files are small squares with the mark floating somewhere inside; the wall cuts each mark to its own outline.
// Usage, with the `site` preview running:  node tools/measure-logos.mjs        prints one BOX line per logo, in LOGOS order
//                                         node tools/measure-logos.mjs raw    only writes shots/sheet-raw.png, the files as they are
// It renders every logo with the dark-theme treatment on black, screenshots the sheet, then reads the pixels back in the page
// (the files are on another host, so the page cannot read them directly). A dark panel with white margins beside it, like the
// Dutch ministry one, has to be boxed by eye from shots/sheet-raw.png.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = readFileSync(join(here, '..', 'site', 'index.html'), 'utf8');
const block = site.match(/const LOGOS = \[([\s\S]*?)\n  \];/)[1];
const LOGOS = [...block.matchAll(/\['([^']+)', '([^']+)', '([^']*)', (\d)\]/g)].map(m => ({ name: m[1], path: m[2], kind: m[3] }));
console.log('logos', LOGOS.length);

const W = 1500, H = 1000, port = 9800 + Math.floor(Math.random() * 100), profile = join(here, 'chrome-profile-' + process.pid), out = join(here, 'shots');
mkdirSync(out, { recursive: true });
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', `--window-size=${W},${H}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
try {
  let targets;
  for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(150); }
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } });
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:' + (process.env.PORT || 5179) + '/assets/' });
  await sleep(800);
  const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  const mode = process.argv[2] || 'mono';   // mono: the dark-theme single-colour treatment; raw: the files as they are, on grey
  const rects = await ev(`(async () => {
    const L = ${JSON.stringify(LOGOS)}, U = 'https://karamshaar.com/wp-content/uploads/';
    document.head.innerHTML = '<style>*{margin:0}body{background:${mode === 'raw' ? '#808080' : '#000'}}div{position:absolute;width:240px;height:320px;background:${mode === 'raw' ? '#808080' : '#000'};outline:1px solid #300}img{position:absolute;left:10px;top:10px;max-width:220px;max-height:300px}' +
      '${mode === 'raw' ? '' : 'img{mix-blend-mode:screen;filter:grayscale(1) invert(1) contrast(1.2) brightness(1.9)}img.keep{filter:grayscale(1) contrast(4)}'}</style>';
    document.body.innerHTML = '';
    const out = [];
    await Promise.all(L.map((l, i) => new Promise(done => {
      const d = document.createElement('div'); d.style.left = (i % 6) * 250 + 'px'; d.style.top = Math.floor(i / 6) * 330 + 'px';
      const im = new Image(); if (/keep/.test(l.kind)) im.className = 'keep';
      im.onload = im.onerror = done; im.src = U + l.path; d.append(im); document.body.append(d); out[i] = im;
    })));
    await new Promise(r => setTimeout(r, 600));
    return out.map(im => { const r = im.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, nw: im.naturalWidth, nh: im.naturalHeight }; });
  })()`);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(out, `sheet-${mode}.png`), Buffer.from(shot.data, 'base64'));
  if (mode === 'mono') {
    const boxes = await ev(`(async () => {
      const im = new Image(); im.src = 'data:image/png;base64,' + ${JSON.stringify(shot.data)}; await im.decode();
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      return ${JSON.stringify(rects)}.map(r => {
        const x0 = Math.round(r.x), y0 = Math.round(r.y), w = Math.round(r.w), h = Math.round(r.h); if (!w || !h) return null;
        const d = g.getImageData(x0, y0, w, h).data; let a = w, b = h, e = -1, f = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11 > 46) { if (x < a) a = x; if (x > e) e = x; if (y < b) b = y; if (y > f) f = y; } }
        return [a / w, b / h, (e - a + 1) / w, (f - b + 1) / h].map(v => +v.toFixed(3));
      });
    })()`);
    LOGOS.forEach((l, i) => console.log(l.name.padEnd(46), 'natural', String(rects[i].nw).padStart(4) + 'x' + String(rects[i].nh).padEnd(4), 'box', JSON.stringify(boxes[i]), 'content aspect', boxes[i] ? (boxes[i][2] * rects[i].nw / (boxes[i][3] * rects[i].nh)).toFixed(2) : '-'));
  } else LOGOS.forEach((l, i) => console.log(l.name.padEnd(46), 'natural', rects[i].nw + 'x' + rects[i].nh));
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill(); await sleep(400);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
