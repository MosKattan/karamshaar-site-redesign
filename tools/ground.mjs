// The testing ground: a full copy of the site and its design system in testing-ground/, for trying things freely
// without touching the real site. Usage (from the project folder):
//   node tools/ground.mjs status         what differs between the testing ground and the real site
//   node tools/ground.mjs reset          throw the experiments away: copy the real site over the testing ground
//   node tools/ground.mjs promote        make the experiments real: copy the testing ground over the real site, then rebuild
//   node tools/ground.mjs publish-copy   write testing-ground/.publish/index.html, the page as its own artifact shows it
// promote stops if the real site changed since the testing ground was last refreshed, because copying over it would undo
// that work (--force copies anyway). promote takes --no-pdf to skip reprinting the design system PDF.
// The copy is exact, so "what is different" is always a plain file comparison. Git history is the undo for both sides.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ground = join(root, 'testing-ground');
const [mode = 'status', ...flags] = process.argv.slice(2);

/* what is mirrored. Generated things (the PDF, page pictures) are rebuilt on each side, not copied */
const FILES = ['DESIGN.md', 'site/index.html', 'design-system/tokens.css', 'design-system/build.mjs', 'design-system/README.md'];
const DIRS = ['site/assets', 'design-system/src'];
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.md', '.svg', '.json']);

const walk = (base, rel) => existsSync(join(base, rel)) ? readdirSync(join(base, rel), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(base, rel + '/' + e.name) : [rel + '/' + e.name]) : [];
const list = base => [...FILES.filter(f => existsSync(join(base, f))), ...DIRS.flatMap(d => walk(base, d))].sort();
// text is compared without its line endings, which Git may rewrite from one machine to the next
const read = (base, rel) => { const b = readFileSync(join(base, rel)); return TEXT.has(extname(rel)) ? Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n')) : b; };
const hash = base => { const h = createHash('sha256'); for (const f of list(base)) h.update(f + '\0').update(read(base, f)); return h.digest('hex'); };
const copy = (from, to, rel) => { mkdirSync(dirname(join(to, rel)), { recursive: true }); copyFileSync(join(from, rel), join(to, rel)); };
const baseFile = join(ground, '.base.json');
const base = () => existsSync(baseFile) ? JSON.parse(readFileSync(baseFile, 'utf8')) : null;
const stamp = () => writeFileSync(baseFile, JSON.stringify({ main: hash(root), at: new Date().toISOString() }, null, 2) + '\n');
const diff = () => { const m = new Set(list(root)), g = new Set(list(ground)), out = { changed: [], onlyGround: [], onlyMain: [] };
  for (const f of new Set([...m, ...g])) { if (!m.has(f)) out.onlyGround.push(f); else if (!g.has(f)) out.onlyMain.push(f); else if (!read(root, f).equals(read(ground, f))) out.changed.push(f); }
  return out; };
const moved = () => { const b = base(); return !b || b.main !== hash(root); };
const say = d => { for (const f of d.changed) console.log('    changed   ' + f); for (const f of d.onlyGround) console.log('    new       ' + f); for (const f of d.onlyMain) console.log('    missing   ' + f + '  (in the real site, not in the testing ground)'); };

if (mode !== 'reset' && !existsSync(ground)) { console.log('  There is no testing ground yet. Make it with: node tools/ground.mjs reset'); process.exit(1); }

if (mode === 'status') {
  const d = diff(), n = d.changed.length + d.onlyGround.length + d.onlyMain.length;
  console.log(n ? `  The testing ground differs from the real site in ${n} file${n > 1 ? 's' : ''}:` : '  The testing ground is an exact copy of the real site.'); say(d);
  if (moved()) console.log('  Note: the real site has changed since the testing ground was last refreshed. Promoting now would undo those changes: reset first, or merge them by hand.');
}

else if (mode === 'reset') {
  const had = existsSync(ground) ? diff() : null;
  if (had && had.changed.length + had.onlyGround.length) { console.log('  Discarding these experiments (they stay in Git history):'); say({ ...had, onlyMain: [] }); }
  for (const f of existsSync(ground) ? list(ground) : []) if (!existsSync(join(root, f))) rmSync(join(ground, f));
  for (const f of list(root)) copy(root, ground, f);
  stamp();
  console.log('  The testing ground is now an exact copy of the real site.');
}

else if (mode === 'promote') {
  const d = diff();
  if (!d.changed.length && !d.onlyGround.length) { console.log('  Nothing to promote: the testing ground has no changes.'); process.exit(0); }
  if (moved() && !flags.includes('--force')) { console.log('  Stopped. The real site has changed since the testing ground was last refreshed, so copying the testing ground over it would undo that work.\n  Bring those changes into the testing ground first (or reset it), or run again with --force to copy anyway.'); process.exit(1); }
  console.log('  Copying to the real site:'); say({ ...d, onlyMain: [] });
  for (const f of [...d.changed, ...d.onlyGround]) copy(ground, root, f);
  if (d.onlyMain.length) console.log('  Left in place in the real site (remove by hand if they are no longer wanted): ' + d.onlyMain.join(', '));
  stamp();
  const r = spawnSync(process.execPath, [join(root, 'design-system', 'build.mjs'), ...(flags.includes('--no-pdf') ? ['--no-pdf'] : [])], { cwd: root, stdio: 'inherit' });
  console.log(r.status === 0 ? '  Promoted. Still to do, as for any change to the site: check the four states, commit, republish the artifact.' : '  The files were copied, but the design system build reported a problem (above). Fix it before publishing.');
  process.exit(r.status ?? 1);
}

else if (mode === 'publish-copy') {
  // the artifact of the testing ground must not be mistaken for the real one: its own title, and a small tag in the corner.
  // Both are added to this copy only, so the testing ground's own file stays an exact mirror
  let html = readFileSync(join(ground, 'site', 'index.html'), 'utf8');
  const once = (a, b) => { if (html.split(a).length !== 2) throw new Error('expected exactly one: ' + a); html = html.replace(a, () => b); };
  once('<title>Services | Karam Shaar Advisory</title>', '<title>Services (testing ground)</title>');
  once('<body id="top">', '<body id="top">\n<div aria-hidden="true" style="position:fixed;z-index:80;left:12px;bottom:12px;padding:7px 12px;border-radius:999px;background:#c8475a;color:#fff;font:500 12px/1 \'Fira Sans\',system-ui,sans-serif;letter-spacing:.04em;pointer-events:none;box-shadow:0 6px 16px -6px rgba(0,0,0,.5)">Testing ground</div>');
  mkdirSync(join(ground, '.publish'), { recursive: true });
  writeFileSync(join(ground, '.publish', 'index.html'), html);
  const assets = [...new Set([...html.matchAll(/assets\/([\w.-]+\.(?:webp|png|jpg|avif|svg))/g)].map(m => m[1]))];
  console.log('  Wrote testing-ground/.publish/index.html. Publish it with these files:');
  for (const a of assets) console.log(`    assets/${a}  <-  testing-ground/site/assets/${a}`);
}

else { console.log('  Unknown command. Use: status, reset, promote, publish-copy'); process.exit(1); }
