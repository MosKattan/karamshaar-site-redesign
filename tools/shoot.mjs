// Headless Chrome screenshot loop over CDP. Usage:
//   node shoot.mjs <prefix> <width> <height> '<steps json>' [path, e.g. '?map=hover']
// steps: [{y:0,name:"hero",wait:1600}, {hover:[900,400]}, {click:[x,y]}, {eval:"js"}, {full:true,name:"full"}]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [prefix = 'shot', W = '1440', H = '900', stepsArg = 'auto', path = ''] = process.argv.slice(2);
const width = +W, height = +H;
const out = join(here, 'shots'); mkdirSync(out, { recursive: true });
const profile = join(here, 'chrome-profile-' + process.pid);
const port = 9300 + process.pid % 4000;   // from the process id, so two shoots running at once never share a port (a random one sometimes did)
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars',
  `--window-size=${width},${height}`, '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'
], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });

try {
  let targets;
  for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(150); }
  const page = targets.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
    if (m.method === 'Runtime.exceptionThrown') console.log('PAGE ERROR', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) console.log('PAGE ' + m.params.type, m.params.args.map(a => a.value ?? a.description).join(' ')); });
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: +(process.env.DPR || 1), mobile: width < 700 });   // env DPR=2 shoots as a high-resolution screen
  if (width < 700) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.enable'); await send('Runtime.enable');
  if (process.env.RM) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (process.env.BLOCK) { await send('Network.enable'); await send('Network.setBlockedURLs', { urls: [process.env.BLOCK] }); }
  await send('Page.navigate', { url: 'http://localhost:' + (process.env.PORT || 5179) + '/' + path });
  await sleep(4200);
  const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
  const docH = await ev('document.documentElement.scrollHeight');
  let steps;
  if (stepsArg === 'auto') { steps = []; const stride = Math.round(height * 0.86); for (let y = 0, n = 0; y < docH - 40; y += stride, n++) steps.push({ y, name: String(n).padStart(2, '0') }); }
  else steps = JSON.parse(stepsArg.endsWith('.json') ? readFileSync(join(here, stepsArg), 'utf8') : stepsArg);
  console.log('docH', docH, 'steps', steps.length);
  for (const s of steps) {
    if (s.eval) { console.log('eval ->', JSON.stringify(await ev(s.eval))); }
    if (s.hover) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: s.hover[0], y: s.hover[1] }); }
    if (s.path) { for (const [x, y] of s.path) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await sleep(40); } }
    if (s.reload) { await send('Page.reload'); }
    if (s.key) { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: s.key, code: s.key, windowsVirtualKeyCode: { ArrowRight: 39, ArrowLeft: 37, Tab: 9, Escape: 27 }[s.key] }); }
    if (s.click) { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: s.click[0], y: s.click[1], button: 'left', clickCount: 1 }); }
    if (s.sel) { s.y = await ev(`Math.max(0, Math.round(document.querySelector(${JSON.stringify(s.sel)}).getBoundingClientRect().top + scrollY + (${s.off ?? 0})))`); }
    if (s.y !== undefined) { await ev(`window.scrollTo(0, ${s.y})`); }
    if (s.wait !== undefined || s.y !== undefined) await sleep(s.wait ?? 1700);
    if (s.name) {
      const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82, captureBeyondViewport: false });
      const file = join(out, `${prefix}-${s.name}.jpg`);
      writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log(file);
    }
  }
} finally {
  try { ws && ws.close(); } catch {}
  chrome.kill();
  await sleep(400);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
