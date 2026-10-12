// The testing ground: experiments as switches on top of the real site, never a copy of it.
//
//   testing-ground/experiments/<id>.css   one experiment each: token values and extra rules (format below)
//   testing-ground/looks.json             named combinations of experiments
//   testing-ground/build/                 generated: the switchable page, the comparison sheet, books (not synced)
//
//   node tools/ground.mjs list                  the experiments, what each one changes, and the looks
//   node tools/ground.mjs build                 write testing-ground/build/index.html: the real page + every switch + the panel
//   node tools/ground.mjs serve                 the same page, live, at http://localhost:5181 (rebuilt on every load)
//   node tools/ground.mjs compare               picture every look side by side: testing-ground/build/Compare.pdf
//   node tools/ground.mjs book "<look>"         the design system PDF as it would be with that look
//   node tools/ground.mjs promote <id|look>...  make experiments real: into tokens.css and site/index.html, then rebuild
//                                               (--no-pdf skips reprinting the design system PDF)
//
// The page is always today's real site with the experiments layered on by attribute (html[data-x~="id"]), so the base
// cannot drift and any mix can be shown. An experiment file is plain CSS with three kinds of block:
//   & { --token:value; }                        night values, exactly as they would be written in tokens.css
//   &[data-theme="light"] { --token:value; }    day values
//   .selector { ... }  @media (...) { ... }     extra rules. Start a selector with & to mean the page root:
//                                               &[data-theme="light"] .inquiry { ... }   &[dir=rtl] .x { ... }
// Its first comment names it:  /* name: 8px corners \n about: one line for the panel */
// A typeface the real page does not load yet is named there too, as a Google Fonts stylesheet address on its own line:
//   fonts: https://fonts.googleapis.com/css2?family=Work+Sans:wght@400..600&display=swap
// A font file of our own goes in testing-ground/assets/fonts/ and is declared in the experiment as a plain block:
//   @font-face { font-family:"KS Hybrid"; src:url(assets/fonts/ks-hybrid.woff2) format("woff2"); font-display:swap }
// (the build lifts it out of the switch, since a font declaration cannot be switched; promote moves the file into site/assets/)
// In Arabic the page swaps its type tokens for Cairo; a switch that sets one of those tokens keeps that swap (see scoped).
// Anything else that must not reach Arabic (weights, line heights, italics) is written under &:not([dir=rtl]).
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks, companions, inject, needed } from '../design-system/lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const G = join(root, 'testing-ground'), OUT = join(G, 'build');
const [mode = 'list', ...args] = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--'))), words = args.filter(a => !a.startsWith('--'));
const read = f => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- reading experiments ---------- */
/** top-level blocks of a stylesheet: [{ sel, body }], comments removed */
const split = css => { const out = []; let depth = 0, start = 0, open = 0;
  for (let i = 0; i < css.length; i++) { const c = css[i];
    if (c === '{') { if (!depth) open = i; depth++; }
    else if (c === '}') { depth--; if (!depth) { out.push({ sel: css.slice(start, open).trim(), body: css.slice(open + 1, i).trim() }); start = i + 1; } } }
  return out; };
const DAY = /^&\[data-theme=["']?light["']?\]$/;
const experiment = id => {
  const text = read(join(G, 'experiments', id + '.css')), top = (text.match(/^\s*\/\*([\s\S]*?)\*\//) || [, ''])[1];
  const fonts = [...top.matchAll(/^\s*fonts:\s*(\S+)\s*$/gm)].map(m => m[1]), head = top.replace(/^\s*fonts:.*$/gm, '');
  const exp = { id, name: (head.match(/name:\s*(.+)/) || [, id])[1].trim(), about: (head.match(/about:\s*([\s\S]+)/) || [, ''])[1].replace(/\s+/g, ' ').trim(),
    night: new Map(), day: new Map(), nightOther: '', dayOther: '', rules: [], faces: [], fonts, text };
  for (const b of split(text.replace(/\/\*[\s\S]*?\*\//g, ''))) {
    if (b.sel === '@font-face') { exp.faces.push(b.body); continue; }
    const which = b.sel === '&' ? 'night' : DAY.test(b.sel) ? 'day' : null;
    if (!which) { if (b.sel.startsWith('@keyframes')) throw new Error(`${id}: @keyframes cannot be switched; put it in the page`); exp.rules.push(b); continue; }
    for (const d of b.body.split(';').map(s => s.trim()).filter(Boolean)) { const i = d.indexOf(':'), k = d.slice(0, i).trim(), v = d.slice(i + 1).trim();
      if (k.startsWith('--')) exp[which].set(k, v); else exp[which + 'Other'] += `${k}:${v};`; }
  }
  return exp;
};
const ids = () => existsSync(join(G, 'experiments')) ? readdirSync(join(G, 'experiments')).filter(f => f.endsWith('.css')).map(f => f.slice(0, -4)).sort() : [];
const looks = () => existsSync(join(G, 'looks.json')) ? JSON.parse(read(join(G, 'looks.json'))) : [];
const mapText = m => [...m].map(([k, v]) => `${k}:${v};`).join('');
const ruleText = rules => rules.map(r => `${r.sel}{${r.body}}`).join('\n');

/* ---------- the switchable page ---------- */
const fontLinks = exps => [...new Set(exps.flatMap(e => e.fonts))].map(u => `<link href="${esc(u)}" rel="stylesheet">\n`).join('');
const faceText = exps => exps.flatMap(e => e.faces).map(f => `@font-face{${f}}\n`).join('');
/** files of the testing ground's own (testing-ground/assets/...) that a piece of CSS asks for */
const ownFiles = text => [...new Set([...text.matchAll(/url\(["']?(assets\/[\w.\/-]+)["']?\)/g)].map(m => m[1]))].filter(f => existsSync(join(G, f)));
const scoped = (exp, base, need, rtl) => {
  const S = `html[data-x~="${exp.id}"]`;
  // likewise the tokens the page swaps in Arabic (its type faces): the swap is restated so the switch does not undo it
  const ar = [...rtl].filter(([k]) => exp.night.has(k) || exp.day.has(k));
  // a night value set here would outrank the real site's day value for the same token, so each day value is restated
  const day = new Map(); for (const k of new Set([...exp.night.keys(), ...exp.day.keys()])) { const v = exp.day.get(k) ?? base.day.get(k); if (v !== undefined) day.set(k, v); }
  return `/* experiment: ${exp.name} */\n${S}{${mapText(exp.night)}${companions(exp.night, need)}${exp.nightOther}}\n${S}[data-theme="light"]{${mapText(day)}${companions(day, need)}${exp.dayOther}}\n`
    + (ar.length ? `${S}[dir=rtl]{${ar.map(([k, v]) => `${k}:${v};`).join('')}}\n` : '') + (exp.rules.length ? `${S}{\n${ruleText(exp.rules)}\n}\n` : '');
};
const buildPage = () => {
  let html = read(join(root, 'site', 'index.html'));
  const tokens = read(join(root, 'design-system', 'tokens.css')), base = blocks(tokens), exps = ids().map(experiment);
  const rtl = new Map([...((html.match(/\nhtml\[dir=rtl\]\{([^}]*)\}/) || [, ''])[1]).matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)].map(m => [m[1], m[2].trim()]));
  const need = needed(html, ...exps.map(e => e.text)), extra = new Set([...need].filter(n => !needed(html).has(n)));
  const css = `\n/* =========================================================\n   TESTING GROUND. Everything above is the real site. Below: one block per experiment, switched on by html[data-x~="id"].\n   Generated by tools/ground.mjs from testing-ground/experiments/. Do not edit here.\n   ========================================================= */\n`
    + (extra.size ? `:root{${companions(base.night, extra)}}\n[data-theme="light"]{${companions(base.day, extra)}}\n` : '') + faceText(exps) + exps.map(e => scoped(e, base, need, rtl)).join('');
  const once = (a, b) => { if (html.split(a).length < 2) throw new Error('not found in the page: ' + a); html = html.replace(a, () => b); };
  once('<title>Services | Karam Shaar Advisory</title>', '<title>Services (testing ground)</title>');
  // before anything is drawn: which switches are on, from the link (?x=a,b) or from the last visit
  once('<style>', `${fontLinks(exps)}<script>try{var x=new URLSearchParams(location.search).get('x');if(x===null)x=localStorage.getItem('ks-ground-x')||'';document.documentElement.dataset.x=x.split(',').join(' ')}catch(e){}</script>\n<style>`);
  once('</style>', css + '</style>');
  const data = { experiments: exps.map(e => ({ id: e.id, name: e.name, about: e.about })), looks: looks() };
  const i = html.lastIndexOf('</body>');
  html = html.slice(0, i) + read(join(G, 'panel.html')).replace('__DATA__', () => JSON.stringify(data).replace(/</g, '\\u003c')) + '\n' + html.slice(i);
  return html;
};
const writePage = () => { mkdirSync(OUT, { recursive: true }); const html = buildPage(); writeFileSync(join(OUT, 'index.html'), html); return html; };

/* ---------- a small server: the built page at /, everything else from site/ ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };
const serve = port => new Promise(done => { const server = createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    try {
      if (rel === '/' || rel === '/index.html') { res.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': 'no-store' }).end(buildPage()); return; }
      const p = [OUT, join(root, 'site'), ...(rel.startsWith('/assets/') ? [G] : [])].map(r => normalize(join(r, rel))).find(f => !rel.includes('..') && existsSync(f) && !statSync(f).isDirectory());
      if (!p) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(readFileSync(p));
    } catch (e) { res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('The testing ground could not be built:\n' + e.message); }
  }); server.listen(port, '127.0.0.1', () => done(server)); });

/* ---------- making experiments real ---------- */
/** nested rules written flat, for the real stylesheet. In the testing ground a switch's rules outrank the page's own by the
    weight of html[data-x~="id"]; html:root weighs the same, so a promoted rule wins exactly where it won as a switch */
const flat = rules => rules.map(r => r.sel.startsWith('@') ? `${r.sel}{${flat(split(r.body))}}`
  : `${r.sel.split(',').map(s => s.trim()).map(s => s.startsWith('&') ? 'html:root' + s.slice(1) : 'html:root ' + s).join(',')}{${r.body}}`).join('\n');
const setToken = (css, day, name, value, from) => {
  const cut = css.indexOf('[data-theme="light"]'), a = day ? cut : 0, b = day ? css.length : cut;
  const re = new RegExp('(^|[\\s;{])(' + name.replace(/[-]/g, '\\-') + '\\s*:)([^;]+)(;)');
  const part = css.slice(a, b);
  if (re.test(part)) return css.slice(0, a) + part.replace(re, (m, pre, k, old, semi) => pre + k + value + semi) + css.slice(b);
  const end = day ? css.lastIndexOf('}') : css.lastIndexOf('}', css.indexOf('@supports'));
  return css.slice(0, end) + `  ${name}:${value};   /* from the testing ground: ${from} */\n` + css.slice(end);
};
/** tokens.css and the page as they would be with these experiments made real */
const applied = list => {
  let tokens = read(join(root, 'design-system', 'tokens.css')), html = read(join(root, 'site', 'index.html'));
  for (const e of list) {
    for (const [k, v] of e.night) tokens = setToken(tokens, false, k, v, e.name);
    for (const [k, v] of e.day) tokens = setToken(tokens, true, k, v, e.name);
    const extra = faceText([e]) + (e.nightOther ? `html:root{${e.nightOther}}\n` : '') + (e.dayOther ? `html:root[data-theme="light"]{${e.dayOther}}\n` : '') + flat(e.rules);
    // its typefaces join the page's own, on the line after the page's font stylesheet
    for (const u of e.fonts) if (!html.includes(u)) { const i = html.indexOf('\n', html.indexOf('fonts.googleapis.com/css2')) + 1; html = html.slice(0, i) + `<link href="${esc(u)}" rel="stylesheet">\n` + html.slice(i); }
    if (extra.trim()) { const i = html.indexOf('</style>'); html = html.slice(0, i) + `\n/* ---------- from the testing ground: ${e.name} (${new Date().toISOString().slice(0, 10)}) ---------- */\n${extra}\n` + html.slice(i); }
  }
  return { tokens, html: inject(html, tokens) };
};
const resolve = names => { const all = ids(), out = [];
  for (const n of names) { const look = looks().find(l => l.name.toLowerCase() === n.toLowerCase() || l.name.toLowerCase().startsWith(n.toLowerCase() + ' '));
    const add = all.includes(n) ? [n] : look ? look.on : null; if (!add) throw new Error(`"${n}" is neither an experiment (${all.join(', ')}) nor a look`);
    for (const id of add) if (!out.includes(id)) out.push(id); }
  return all.filter(id => out.includes(id)).map(experiment); };

/* ---------- commands ---------- */
try {
if (mode === 'list') {
  const exps = ids().map(experiment), seen = new Map();
  console.log(exps.length ? '  Experiments (switches):' : '  No experiments yet. Add one as testing-ground/experiments/<id>.css');
  for (const e of exps) { console.log(`    ${e.id.padEnd(16)} ${e.name}: ${e.night.size + e.day.size} token values, ${e.rules.length} extra rules${e.fonts.length ? ', loads its own typefaces' : ''}`);
    for (const k of new Set([...e.night.keys(), ...e.day.keys()])) seen.set(k, [...(seen.get(k) || []), e.id]); }
  const clash = [...seen].filter(([, v]) => v.length > 1);
  if (clash.length) console.log('  Set by more than one experiment (the later file wins when both are on): ' + clash.map(([k, v]) => `${k} (${v.join(', ')})`).join('; '));
  console.log('  Looks:'); for (const l of looks()) console.log(`    ${l.name}  =  ${l.on.join(' + ') || 'real site'}`);
}

else if (mode === 'build') { writePage(); console.log(`  Wrote testing-ground/build/index.html (${ids().length} switches, ${looks().length} looks).`);
  const used = [...new Set([...read(join(OUT, 'index.html')).matchAll(/assets\/([\w.-]+\.(?:webp|png|jpg|avif|svg))/g)].map(m => m[1]))];
  console.log('  To publish it, send these files with it: ' + [...used.map(a => `assets/${a} <- site/assets/${a}`), ...ownFiles(read(join(OUT, 'index.html'))).map(f => `${f} <- testing-ground/${f}`)].join(', ')); }

else if (mode === 'serve') { await serve(+(words[0] || 5181)); console.log(`  Testing ground at http://localhost:${words[0] || 5181}  (Ctrl+C to stop)`); await new Promise(() => {}); }

else if (mode === 'compare') {
  const { withChrome } = await import('./chrome.mjs');
  const cols = [{ name: 'Real site', on: [] }, ...looks()], themes = [['dark', 'Night'], ['light', 'Day']];
  const parts = [['Hero', null, 0], ['Formats', '.bento', -96], ['Rates', '.rates-grid', -200], ['Inquiry', '.panel', -120]];
  const server = await serve(0), base = `http://127.0.0.1:${server.address().port}`, shots = join(OUT, 'shots');
  rmSync(shots, { recursive: true, force: true });
  await withChrome(async ({ ev, go, shot, pdf, size, sleep }) => {
    for (const [theme] of themes) for (const [c, col] of cols.entries()) {
      await size(1440, 900); await go(`${base}/?x=${col.on.join(',')}&theme=${theme}&lang=en`);
      await ev(`document.getElementById('ks-ground')?.remove(); 1`);
      for (const [p, [, sel, off]] of parts.entries()) {
        await ev(sel ? `window.scrollTo(0, document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().top + scrollY + ${off})` : 'window.scrollTo(0, 0)'); await sleep(p ? 1900 : 300);
        await shot(join(shots, `${theme}-${c}-${p}.jpg`), 80);
      }
      console.log(`  pictured: ${col.name}, ${theme}`);
    }
    const W = 96 + cols.length * 452, name = id => (ids().includes(id) ? experiment(id).name : id);
    const sheet = `<!doctype html><meta charset="utf-8"><title>Testing ground: looks compared</title><style>
      @page{size:${W}px ${150 + parts.length * 300}px;margin:0} *{box-sizing:border-box;margin:0} body{font:13px/1.45 system-ui,"Segoe UI",sans-serif;color:#1d1d1d;background:#f4f1ea}
      section{width:${W}px;height:${150 + parts.length * 300}px;padding:36px 48px;break-after:page;overflow:hidden} h1{font:400 30px/1.1 Georgia,serif;margin-bottom:22px} h1 small{font:13px system-ui;color:#666;margin-left:14px}
      .grid{display:grid;grid-template-columns:repeat(${cols.length},436px);gap:16px} h2{font-size:15px;font-weight:600} p{color:#666;font-size:12px;min-height:34px;margin-bottom:8px}
      figure{position:relative} img{display:block;width:436px;height:272px;object-fit:cover;object-position:top;border:1px solid rgba(0,0,0,.14)} figcaption{position:absolute;left:8px;top:8px;padding:2px 8px;border-radius:4px;background:rgba(0,0,0,.6);color:#fff;font-size:10.5px;letter-spacing:.04em}
      .col{display:grid;gap:10px;align-content:start}</style>
      ${themes.map(([theme, label]) => `<section><h1>Testing ground: looks compared, ${label.toLowerCase()} <small>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</small></h1><div class="grid">
        ${cols.map((col, c) => `<div class="col"><div><h2>${esc(col.name)}</h2><p>${col.on.length ? col.on.map(name).map(esc).join(' + ') : 'Nothing switched on'}</p></div>${parts.map(([part], p) => `<figure><img src="shots/${theme}-${c}-${p}.jpg"><figcaption>${part}</figcaption></figure>`).join('')}</div>`).join('')}</div></section>`).join('')}`;
    writeFileSync(join(OUT, 'compare.html'), sheet);
    await size(W, 900); await go(`${base}/compare.html`, 1500);
    await ev('Promise.all([...document.images].map(i => i.decode().catch(() => 0))).then(() => 1)');
    await pdf(join(OUT, 'Compare.pdf'));
  });
  server.close();
  console.log(`  Wrote testing-ground/build/Compare.pdf: ${cols.length} looks, night and day.`);
}

else if (mode === 'book') {
  if (!words.length) throw new Error('Say which look or experiments: node tools/ground.mjs book "B"');
  const list = resolve(words), look = looks().find(l => l.on.length === list.length && l.on.every(id => list.some(e => e.id === id)));
  const label = look ? look.name : list.map(e => e.name).join(' + '), tmp = join(OUT, 'book-root'), { tokens, html } = applied(list);
  mkdirSync(join(tmp, 'design-system'), { recursive: true }); mkdirSync(join(tmp, 'site'), { recursive: true });
  writeFileSync(join(tmp, 'design-system', 'tokens.css'), tokens); writeFileSync(join(tmp, 'site', 'index.html'), html);
  const out = join(OUT, `Design-System (${label.replace(/[^\w ,.+-]/g, '').trim()}).pdf`);
  const r = spawnSync(process.execPath, [join(root, 'design-system', 'build.mjs')], { cwd: root, stdio: 'inherit', env: { ...process.env, DS_ROOT: tmp, DS_LABEL: label, DS_OUT: out } });
  process.exit(r.status ?? 1);
}

else if (mode === 'promote') {
  if (!words.length) throw new Error('Say what to promote: an experiment id or a look name. See: node tools/ground.mjs list');
  const list = resolve(words), { tokens, html } = applied(list);
  console.log('  Making real: ' + list.map(e => e.name).join(', '));
  writeFileSync(join(root, 'design-system', 'tokens.css'), tokens); writeFileSync(join(root, 'site', 'index.html'), html);
  for (const f of ownFiles(faceText(list))) { mkdirSync(dirname(join(root, 'site', f)), { recursive: true }); copyFileSync(join(G, f), join(root, 'site', f)); rmSync(join(G, f)); }
  for (const e of list) rmSync(join(G, 'experiments', e.id + '.css'));
  const gone = new Set(list.map(e => e.id)), left = looks().map(l => ({ ...l, on: l.on.filter(id => !gone.has(id)) })).filter((l, i, a) => l.on.length && a.findIndex(o => o.on.join() === l.on.join()) === i);
  writeFileSync(join(G, 'looks.json'), JSON.stringify(left, null, 2) + '\n');
  const r = spawnSync(process.execPath, [join(root, 'design-system', 'build.mjs'), ...(flags.has('--no-pdf') ? ['--no-pdf'] : [])], { cwd: root, stdio: 'inherit' });
  console.log(r.status === 0 ? '  Done. Those switches are now part of the real site and gone from the testing ground. Still to do, as for any change to the site:\n  check the four states, update the wording in DESIGN.md and the book if it is now untrue, commit, republish both artifacts.' : '  The files were changed, but the design system build reported a problem (above).');
  process.exit(r.status ?? 1);
}

else throw new Error('Unknown command. Use: list, build, serve, compare, book, promote');
} catch (e) { console.error('  ' + e.message); process.exit(1); }
