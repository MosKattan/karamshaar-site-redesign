// Drives the Chrome installed on this machine, headless, over its debugging port. Used by tools/ground.mjs.
//   await withChrome(async ({ send, ev, go, shot, pdf, size, sleep }) => { ... })
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function withChrome(fn) {
  const path = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && existsSync(p));
  if (!path) throw new Error('Chrome was not found. Set CHROME to its path and run again.');
  const profile = join(tmpdir(), 'ks-chrome-' + process.pid), port = 9300 + process.pid % 4000;
  const chrome = spawn(path, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--hide-scrollbars', '--window-size=1440,900',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
  let ws, id = 0; const pending = new Map(), errors = [];
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  try {
    let targets;
    for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(150); }
    ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));
    ws.addEventListener('message', e => { const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
      if (m.method === 'Runtime.exceptionThrown') { const t = m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text; errors.push(t); console.log('  PAGE ERROR', t); } });
    await send('Page.enable'); await send('Runtime.enable');
    const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
    const size = (width, height, scale = 1) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: width < 700 });
    const go = async (url, wait = 5200) => { await send('Page.navigate', { url }); await sleep(wait); };
    const save = (file, base64) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, Buffer.from(base64, 'base64')); };
    const shot = async (file, quality = 82) => save(file, (await send('Page.captureScreenshot', { format: 'jpeg', quality })).data);
    // a PDF comes back as a stream read in pieces: as one message it can be too large for the connection and never arrive
    const pdf = async file => { const job = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, transferMode: 'ReturnAsStream' });
      const parts = []; for (;;) { const r = await send('IO.read', { handle: job.stream, size: 1 << 20 }); parts.push(Buffer.from(r.data, r.base64Encoded ? 'base64' : 'utf8')); if (r.eof) break; }
      await send('IO.close', { handle: job.stream }); mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, Buffer.concat(parts)); };
    return await fn({ send, ev, go, shot, pdf, size, sleep, errors });
  } finally {
    try { ws && ws.close(); } catch {}
    chrome.kill(); await sleep(400);
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}
