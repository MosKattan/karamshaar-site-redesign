// Packs site/index.html into ONE self-contained file that opens from a double-click, with no internet needed:
// images, fonts, the client logos, Lenis (smooth scroll) and Three.js (the 3D map) are all written into the page.
// Usage: node tools/export-single.mjs   ->   tools/export/karamshaar-services.html  (not synced to GitHub)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
let html = readFileSync(join(site, 'index.html'), 'utf8');

const MIME = { '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const b64 = buf => Buffer.from(buf).toString('base64');
const get = async (url, ua) => {
  const r = await fetch(url, ua ? { headers: { 'user-agent': ua } } : undefined);
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return Buffer.from(await r.arrayBuffer());
};
const replaceOnce = (needle, to) => { if (!html.includes(needle)) throw new Error('not found: ' + needle.slice(0, 60)); html = html.replace(needle, () => to); };

// 1. local pictures (src="assets/..." and url(assets/...))
html = html.replace(/(["(])assets\/([\w.-]+\.(?:webp|png|jpg|avif|svg))/g, (m, q, f) =>
  q + 'data:' + MIME[extname(f)] + ';base64,' + b64(readFileSync(join(site, 'assets', f))));

// 2. fonts: fetch Google's stylesheet as a modern browser sees it and keep the latin, latin-ext and arabic pieces
const fontLink = html.match(/<link href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)" rel="stylesheet">/);
if (!fontLink) throw new Error('font link not found');
const css = (await get(fontLink[1].replace(/&amp;/g, '&'), 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36')).toString();
let fontCss = '';
for (const [, subset, block] of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]+\})/g)) {
  if (!['latin', 'latin-ext', 'arabic'].includes(subset)) continue;
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)[1];
  fontCss += block.replace(url, 'data:font/woff2;base64,' + b64(await get(url))) + '\n';
}
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
html = html.replace(fontLink[0], () => '<style>\n' + fontCss + '</style>');

// 3. the client logos, which the page otherwise hotlinks from karamshaar.com
const U = 'https://karamshaar.com/wp-content/uploads/';
const paths = [...html.matchAll(/\['[^'\n]+',\s*'(\d{4}\/\d{2}\/[^']+)'/g)].map(m => m[1]);
const logos = {};
for (const p of paths) logos[p] = 'data:' + MIME[extname(p)] + ';base64,' + b64(await get(U + p));
replaceOnce('mono.src = full.src = U + path;', 'mono.src = full.src = LOGO_DATA[path] || U + path;');
replaceOnce("const U = 'https://karamshaar.com/wp-content/uploads/';", "const U = 'https://karamshaar.com/wp-content/uploads/';\n  const LOGO_DATA = " + JSON.stringify(logos) + ';');

// 4. Lenis: the library goes in as an ordinary script
const lenis = (await get('https://unpkg.com/lenis@1.3.26/dist/lenis.min.js')).toString();
replaceOnce('<script src="https://unpkg.com/lenis@1.3.26/dist/lenis.min.js" id="lenis-src" async></script>', '<script id="lenis-src">' + lenis.replace(/<\/script/gi, '<\\/script') + '</script>');

// 5. Three.js: kept as text and loaded through a blob address, which works from a file on disk
const three = (await get('https://unpkg.com/three@0.169.0/build/three.module.min.js')).toString();
if (/<\/script/i.test(three)) throw new Error('three contains a closing script tag');
replaceOnce("import('https://unpkg.com/three@0.169.0/build/three.module.min.js')", "import(URL.createObjectURL(new Blob([document.getElementById('three-src').textContent], { type: 'text/javascript' })))");
replaceOnce('<script type="module">', '<script type="text/plain" id="three-src">' + three + '</script>\n<script type="module">');

const left = html.match(/https:\/\/(?:unpkg|fonts\.g\w+)\.[^\s"')]*/g);
if (left) throw new Error('still external: ' + left.join(', '));
mkdirSync(join(root, 'tools', 'export'), { recursive: true });
const out = join(root, 'tools', 'export', 'karamshaar-services.html');
writeFileSync(out, html);
console.log(out, (html.length / 1048576).toFixed(2) + ' MB, ' + paths.length + ' logos');
