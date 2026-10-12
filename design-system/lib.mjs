// Shared by design-system/build.mjs and tools/ground.mjs: reading the token file and writing it into a page.
// tokens.css holds colours the way people write them (#f1ead7). A page also needs some of them as "r,g,b", so it can
// use one colour at several strengths: rgba(var(--cream-rgb),.3). Those companions are worked out here, for exactly the
// tokens a page asks for, and written into the page's token block after the tokens themselves. Nobody types them.
export const START = '/* DS:TOKENS:START', END = '/* DS:TOKENS:END */';
export const HEAD = START + ' - generated from design-system/tokens.css by `node design-system/build.mjs`. Edit that file, not this copy. */';

const decls = text => [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map(m => [m[1], m[2].trim()]);
/** tokens.css -> { night: Map(name -> value), day: Map(name -> value) }. Night is what :root sets; day is only what the day theme changes. */
export function blocks(css) {
  const i = css.indexOf('[data-theme="light"]'), sup = css.indexOf('@supports');
  const night = new Map(); for (const [k, v] of decls(css.slice(0, sup < 0 || sup > i ? i : sup))) if (!night.has(k)) night.set(k, v);
  return { night, day: new Map(decls(css.slice(i))) };
}
/** "#f1ead7" or "rgba(214,224,242,.68)" -> "241,234,215"; anything that is not a plain colour -> null */
export function rgbOf(value) {
  let m = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) { let x = m[1]; if (x.length === 3) x = [...x].map(c => c + c).join(''); return [0, 2, 4].map(j => parseInt(x.slice(j, j + 2), 16)).join(','); }
  m = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  return m ? `${m[1]},${m[2]},${m[3]}` : null;
}
/** the token names a page uses in "r,g,b" form: every --name-rgb it mentions, in its stylesheet or its scripts */
export const needed = (...texts) => new Set(texts.flatMap(t => [...t.matchAll(/(--[\w-]+)-rgb\b/g)].map(m => m[1])));
/** "--a-rgb:1,2,3;--b-rgb:4,5,6;" for the wanted names that have a colour in this map */
export const companions = (map, need) => [...need].filter(n => map.has(n) && rgbOf(map.get(n))).sort().map(n => `${n}-rgb:${rgbOf(map.get(n))};`).join('');
/** the whole generated block for one page: the token file, then the companions that page needs */
export function tokenBlock(tokensCss, pageHtml) {
  const css = tokensCss.replace(/\r\n/g, '\n').trim(), { night, day } = blocks(css);
  const a = pageHtml.indexOf(START), b = pageHtml.indexOf(END);
  const need = needed(a < 0 ? pageHtml : pageHtml.slice(0, a) + pageHtml.slice(b));
  return HEAD + '\n' + css + '\n/* the same colours as "r,g,b", for use at a chosen strength: rgba(var(--cream-rgb),.3). Worked out by the build */\n'
    + `:root{${companions(night, need)}}\n[data-theme="light"]{${companions(day, need)}}\n`;
}
/** a page with its token block brought up to date, or null when the page has no token marks */
export function inject(pageHtml, tokensCss) {
  const a = pageHtml.indexOf(START), b = pageHtml.indexOf(END);
  if (a < 0 || b < a) return null;
  const nl = pageHtml.includes('\r\n') ? '\r\n' : '\n';
  return pageHtml.slice(0, a) + tokenBlock(tokensCss, pageHtml).replace(/\n/g, nl) + pageHtml.slice(b);
}
