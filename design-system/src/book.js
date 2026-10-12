/* =========================================================
   The book's tools. Book.make() reads the token file and the live page, builds the pages
   listed in pages.js, numbers them, fills the specimen frames, and sets window.__bookReady
   when fonts, frames and pictures are in, which is what the build waits for before printing.
   ========================================================= */
const Book = (() => {
  const VERSION = '0.1', STATUS = 'Draft', DATE = 'October 2026';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const S = { tokens: { night: [], day: [] }, map: { night: {}, day: {} }, siteCss: '', fontLink: '', logo: '', bars: [], icons: [], phosphor: [], AR: {}, frames: [], chapters: [] };

  /* ---------- tokens.css -> lists. A trailing comment on a line is the note for the tokens on it ---------- */
  const parse = css => {
    const out = []; let group = '';
    for (const line of css.split('\n')) {
      const g = line.match(/^\s*\/\*\s*-{2,}\s*(.+?)\s*-{2,}\s*\*\/\s*$/);
      if (g) { group = g[1]; continue; }
      const note = (line.match(/\/\*\s*(.*?)\s*\*\/\s*$/) || [])[1] || '';
      for (const m of line.replace(/\/\*.*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.push({ name: m[1], value: m[2].trim(), note, group });
    }
    return out;
  };
  const loadTokens = text => {
    const i = text.indexOf('[data-theme="light"]'), sup = text.indexOf('@supports');
    S.raw = text; S.tokens.night = parse(text.slice(0, sup));
    S.tokens.day = parse(text.slice(i));
    S.spring = (text.slice(sup, i).match(/--spring:([^;]+);/) || [])[1] || '';
    for (const t of S.tokens.night) S.map.night[t.name] = t;
    for (const t of S.tokens.day) S.map.day[t.name] = t;
  };
  const tv = (name, theme = 'night') => (theme === 'day' && S.map.day[name] || S.map.night[name] || S.map.day[name] || { value: '?' }).value;
  const note = (name, theme = 'night') => (theme === 'day' && S.map.day[name] || S.map.night[name] || S.map.day[name] || { note: '' }).note;

  /* ---------- the live page: its stylesheet, font link, logo, icons and Arabic table ---------- */
  const loadSite = html => {
    S.siteCss = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
    S.fontLink = (html.match(/<link href="https:\/\/fonts\.googleapis\.com\/css2[^"]+" rel="stylesheet">/) || [''])[0];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const holder = doc.querySelector('#ks-logo').closest('svg');
    S.logo = holder.outerHTML;
    S.bars = [...doc.querySelectorAll('#ks-logo path.lb')].map(p => ({ d: p.getAttribute('d'), ink: /logo-ink/.test(p.getAttribute('style')) }));
    S.icons = [...doc.querySelectorAll('.pcard')].map(c => ({ svg: c.querySelector('svg.ico').outerHTML, name: c.querySelector('h3').textContent, bar: (c.getAttribute('style').match(/--bar:var\((--\w+)\)/) || [])[1] }));
    S.phosphor = [...S.siteCss.matchAll(/\.ph-([\w-]+)\{--ph:(url\("[^"]+"\))\}/g)].map(m => ({ name: m[1], url: m[2] }));
    const a = html.indexOf('const AR = {'), b = html.indexOf('\n  };', a);
    for (const m of html.slice(a, b).matchAll(/^\s*"((?:[^"\\]|\\.)*)":\s*"((?:[^"\\]|\\.)*)",?\s*$/gm)) S.AR[JSON.parse('"' + m[1] + '"')] = JSON.parse('"' + m[2] + '"');
    S.markup = doc;
  };
  /* a piece of the page's own markup, by selector, so a specimen is the component as it is on the page */
  const take = (sel, edit) => { const el = S.markup.querySelector(sel); if (!el) return `<p style="color:#f66">missing ${esc(sel)}</p>`; const c = el.cloneNode(true); c.querySelectorAll('.rv').forEach(e => e.classList.remove('rv')); c.classList.remove('rv'); if (edit) edit(c); return c.outerHTML; };

  /* ---------- colour arithmetic, for the contrast table ---------- */
  const probe = document.createElement('i'); probe.style.cssText = 'position:absolute;visibility:hidden';
  const rgba = (css, theme) => {
    const host = document.createElement('div'); if (theme === 'day') host.dataset.theme = 'light';
    host.style.cssText = 'position:absolute;visibility:hidden'; host.append(probe); document.body.append(host);
    probe.style.color = ''; probe.style.color = css; const c = getComputedStyle(probe).color; host.remove();
    const m = c.match(/[\d.]+/g).map(Number);
    return c.startsWith('color(') ? [m[0] * 255, m[1] * 255, m[2] * 255, m[3] ?? 1] : [m[0], m[1], m[2], m[3] ?? 1];
  };
  const hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const contrast = (fg, bg, theme) => {
    const B = rgba(bg, theme), F = rgba(fg, theme), a = F[3];
    const C = [0, 1, 2].map(i => F[i] * a + B[i] * (1 - a)), l1 = lum(C), l2 = lum(B);
    return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
  };
  /* clamp(a rem, b vw, c rem) -> "33 to 56 px"; plain rem and px too. 1rem is 16px on this site */
  const px = v => {
    const c = v.match(/^clamp\(([\d.]+)(rem|px),\s*[\d.]+vw,\s*([\d.]+)(rem|px)\)$/);
    const n = (x, u) => +(x * (u === 'rem' ? 16 : 1)).toFixed(1);
    if (c) return `${n(c[1], c[2])} to ${n(c[3], c[4])} px`;
    const r = v.match(/^([\d.]+)(rem|px)$/); return r ? `${n(r[1], r[2])} px` : v;
  };

  /* ---------- building blocks ---------- */
  const k = t => `<span class="k">${t}</span>`;
  const tok = n => `<code>${n}</code>`;
  const table = (head, rows, cls = '') => `<table class="${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const cells = (list, n = 3) => `<div class="cells" style="--n:${n}">${list.map(([a, b, c]) => `<div class="cell">${k(a)}<span class="v">${b}</span>${c ? `<span class="n">${c}</span>` : ''}</div>`).join('')}</div>`;
  const rules = (list, cls = '') => `<ul class="rules ${cls}">${list.map(r => `<li>${r}</li>`).join('')}</ul>`;
  const sw = (name, theme = 'night', o = {}) => {
    const v = tv(name, theme), plain = /^#|^rgb/.test(v);
    return `<div class="sw"><i style="background:var(${name});${o.h ? `--h:${o.h}px` : ''}"></i><div><code>${name}</code><span>${/^rgba/.test(v) ? v.replace(/^rgba\((\d+),(\d+),(\d+),\.?(\d+)\)$/, (m, r, g, bl, a) => `${r} ${g} ${bl} / ${a.padEnd(2, '0')}%`) : plain ? v : hex(rgba(`var(${name})`, theme))}</span>${o.note === false ? '' : `<p>${o.note || note(name, theme)}</p>`}</div></div>`;
  };
  const sws = (names, theme, o = {}) => `<div class="sws" style="--n:${o.n || names.length}">${names.map(n => sw(n, theme, o)).join('')}</div>`;
  const dot = (css) => `<i class="dot" style="background:${css}"></i>`;
  const logo = (style = '') => `<svg viewBox="0 0 1430 558" style="${style}" aria-hidden="true"><use href="#ks-logo"/></svg>`;
  const shot = (name, style = '') => `<div class="shot" style="${style}"><img src="../.cache/shots/${name}.jpg" alt=""></div>`;

  /* A specimen: markup drawn by the page's own stylesheet in a frame. w and h are the frame's own screen size in px
     (so the page's breakpoints and fluid sizes behave as on a screen that wide); s is how much it is scaled on the sheet. */
  const frame = o => {
    const { w = 800, h = 300, s = .5, theme = 'night', ar = false, pad = 32, bg = '', css = '', cap = '', html = '', cls = '' } = o;
    const id = S.frames.push({ ...o, w, h, theme, ar, pad, bg, css, html }) - 1;
    const box = `<div class="fr" style="width:${Math.round(w * s)}px;height:${Math.round(h * s)}px"><iframe data-f="${id}" width="${w}" height="${h}" style="transform:scale(${s})" title=""></iframe></div>`;
    return cap === false ? box : `<div class="fig ${cls}">${box}${cap ? `<span class="k"><span>${cap}</span><span>${theme}${ar ? ', arabic' : ''}</span></span>` : ''}</div>`;
  };
  const srcdoc = f => `<!doctype html><html lang="${f.ar ? 'ar' : 'en'}" dir="${f.ar ? 'rtl' : 'ltr'}"${f.theme === 'day' ? ' data-theme="light"' : ''}><head><meta charset="utf-8"><base href="${location.origin}/site/">${S.fontLink}<style>${S.siteCss}</style>
<style>html{background:none}body{min-height:100vh;padding:${f.pad}px;overflow:hidden;${f.bg ? 'background:' + f.bg + ';' : ''}}body::after,.grain{display:none!important}.nav{animation:none!important}${f.css}</style></head><body>${S.logo}${f.html}</body></html>`;
  const translate = doc => {
    const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT); const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) { const t = n.nodeValue.trim(); if (t && S.AR[t]) n.nodeValue = n.nodeValue.replace(t, S.AR[t]); }
    doc.querySelectorAll('[placeholder]').forEach(e => { const p = e.getAttribute('placeholder'); if (S.AR[p]) e.setAttribute('placeholder', S.AR[p]); });
  };

  /* ---------- sheets ---------- */
  const bar = ch => `<header class="bar"><span class="brand">${logo()}<i></i><span>Design system</span></span><span>${ch || ''}</span><span>${STATUS} ${VERSION}, ${DATE}</span><span class="no"></span></header>`;
  const foot = (l, r) => `<footer class="ft">${k('[ ' + l + ' ]')}${k('[ ' + r + ' ]')}</footer>`;
  let chapter = { n: '', name: '' };
  const opener = o => {
    chapter = { n: o.n, name: o.title }; S.chapters.push({ n: o.n, name: o.title, about: o.about });
    return `<section class="pg op" data-ch="${o.n}">${bar(o.n + ' ' + o.title)}
      <div class="op-title"><h1>${o.title}</h1><span class="pill">${o.n}</span></div>
      <div class="op-body"><ul class="op-list">${o.list.map(l => `<li>${l}</li>`).join('')}</ul><div class="op-panel">${o.panel || ''}</div><div class="op-stat"><b>${o.stat[0]}</b><p>${o.stat[1]}</p></div></div>
      ${foot(o.left || 'Karam Shaar Advisory', o.right || 'Chapter ' + o.n)}</section>`;
  };
  const page = o => `<section class="pg" ${o.night ? '' : 'data-theme="light"'}>${bar(chapter.n + ' ' + chapter.name)}
      <div class="hd"><h2>${o.title}</h2><p>${o.intro || ''}</p></div>
      <div class="bd ${o.cols || ''}" style="${o.z ? `zoom:${o.z};` : ''}${o.style || ''}">${o.body}</div>
      ${foot(o.left || chapter.name, (o.right || o.title).replace(/\.$/, ''))}</section>`;

  /* ---------- make ---------- */
  const make = async () => {
    window.__bookStatus = 'reading tokens and page';
    const [tokens, site] = await Promise.all([fetch('../tokens.css').then(r => r.text()), fetch('../../site/index.html').then(r => r.text())]);
    loadTokens(tokens.replace(/\r\n/g, '\n')); loadSite(site.replace(/\r\n/g, '\n'));
    const book = document.getElementById('book');
    document.body.insertAdjacentHTML('afterbegin', S.logo);
    book.innerHTML = PAGES(api).join('\n');
    const pgs = [...book.querySelectorAll('.pg')];
    pgs.forEach((p, i) => { const no = p.querySelector('.bar .no'); if (no) no.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(pgs.length).padStart(2, '0'); });
    book.querySelectorAll('[data-toc]').forEach(el => { const p = book.querySelector(`.pg.op[data-ch="${el.dataset.toc}"]`); el.textContent = p ? String(pgs.indexOf(p) + 1).padStart(2, '0') : ''; });
    window.__bookStatus = 'filling specimens';
    await Promise.all([...book.querySelectorAll('iframe[data-f]')].map(el => new Promise(done => {
      const f = S.frames[+el.dataset.f];
      el.addEventListener('load', async () => { try { const d = el.contentDocument; if (f.ar) translate(d); if (f.after) f.after(d); await d.fonts.ready; } catch (e) { console.error(e); } done(); }, { once: true });
      el.srcdoc = srcdoc(f);
    })));
    window.__bookStatus = 'pictures';
    await Promise.all([...document.images].map(im => im.decode().catch(() => { im.closest('.shot,.op-panel')?.insertAdjacentHTML('beforeend', '<span class="k" style="position:absolute;left:10px;top:10px">picture not built yet</span>'); im.remove(); })));
    for (const fn of S.late || []) await fn();
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 700));
    window.__bookStatus = 'ready'; window.__bookReady = true;
  };

  const api = { S, VERSION, STATUS, DATE, esc, k, tok, table, cells, rules, sw, sws, dot, logo, shot, frame, take, opener, page, bar, foot, tv, note, px, rgba, hex, contrast, late: fn => (S.late ||= []).push(fn) };
  return { make, ...api };
})();
