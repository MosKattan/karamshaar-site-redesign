/* =========================================================
   The pages of the book, in order. Each chapter is an opener() followed by page()s.
   Values are not typed here where they can be read: swatches, sizes and tables come from
   tokens.css, and specimens are pieces of site/index.html drawn by its own stylesheet.
   What is typed here is the reasoning and the component measurements, which were read
   from the page's stylesheet on 12 October 2026: when a component changes, change its lines here.
   ========================================================= */
const PAGES = B => {
  const { S, k, tok, table, cells, rules, sws, dot, logo, shot, frame, take, opener, page, bar, foot, tv, px, rgba, hex, contrast, late } = B;
  const N = n => tv(n, 'night'), D = n => tv(n, 'day');
  const nd = n => dot(N(n)) + tok(n), dd = n => dot(D(n)) + tok(n);
  const sz = n => px(N(n));
  const t = v => v.replace(/^\./, '0.').replace(/(\d)(px|s)$/, '$1 $2');   // .2s -> 0.2 s, 48px -> 48 px
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const pair = (html, o, capt) => ['night', 'day'].map(theme => frame({ ...o, html, theme, cap: capt })).join('');

  /* a tall picture of the whole page, cut into columns that read top to bottom, left to right */
  const strip = (name, cols) => { late(async () => { for (const el of document.querySelectorAll(`[data-strip="${name}"]`)) {
      const im = new Image(); im.src = `../.cache/shots/${name}.jpg`; try { await im.decode(); } catch { el.innerHTML = '<span class="k">picture not built yet</span>'; continue; }
      // with n columns each H tall, the picture fills them exactly when a column is n * u wide
      const H = el.clientHeight, u = H / (im.naturalHeight / im.naturalWidth); let n = +el.dataset.n || 1;
      if (!el.dataset.n) while (n < 6 && (n + 1) ** 2 * u + n * 6 <= el.clientWidth) n++;
      if (el.dataset.n) el.style.width = n * n * u + (n - 1) * 6 + 'px';
      el.style.gridTemplateColumns = `repeat(${n}, ${n * u}px)`; el.innerHTML = Array.from({ length: n }, (_, i) => `<div style="background-image:url(${im.src});background-position:0 ${-i * H}px"></div>`).join('');
    } }); return `<div class="strip" data-strip="${name}" ${cols ? `data-n="${cols}"` : ''}></div>`; };

  /* contents list and its page numbers, once every page exists */
  late(() => { const pgs = [...document.querySelectorAll('.pg')], no = n => String(pgs.indexOf(document.querySelector(`.pg[data-ch="${n}"]`)) + 1).padStart(2, '0');
    const el = document.querySelector('[data-toc-list]'); if (el) el.innerHTML = S.chapters.map(c => `<li><span class="num">${c.n}</span><span><b>${c.title || c.name}</b>&ensp;<span>${c.about}</span></span><span class="num">${no(c.n)}</span></li>`).join(''); });

  /* the spring, drawn from the token itself */
  const curve = () => { const pts = S.spring.replace(/^linear\(|\)$/g, '').split(',').map((s, i, a) => { const [y, x] = s.trim().split(/\s+/); return [x ? parseFloat(x) : i ? 100 : 0, +y]; });
    const X = x => 40 + x * 3.6, Y = y => 250 - y * 210;
    return `<svg class="curve" viewBox="0 0 440 290" style="width:94%"><g fill="none" stroke="${N('--line')}"><path d="M40 250H400M40 40H400M40 40V250M400 40V250M40 145H400M220 40V250" /></g>
      <path d="M40 250L400 40" fill="none" stroke="${N('--faint')}" stroke-dasharray="2 5"/>
      <polyline fill="none" stroke="${N('--cream')}" stroke-width="2.2" stroke-linejoin="round" points="${pts.map(p => X(p[0]) + ',' + Y(p[1])).join(' ')}"/>
      ${pts.map(p => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="2.6" fill="${N('--n900')}" stroke="${N('--cream')}" stroke-width="1.2"/>`).join('')}
      <g font-family="Fira Mono" font-size="8.4" fill="${N('--muted')}" letter-spacing=".9"><text x="40" y="272">START</text><text x="400" y="272" text-anchor="end">${t(N('--t-reveal')).toUpperCase()}</text><text x="40" y="30">ARRIVED</text><text x="400" y="30" text-anchor="end">--SPRING</text></g></svg>`; };

  const btns = `<div style="display:flex;flex-wrap:wrap;gap:16px 18px;align-items:center">
      <a class="btn btn-cream" href="#">Start an inquiry <i class="ph ph-arrow-right"></i></a>
      <a class="btn btn-ghost" href="#">Browse publications <i class="ph ph-arrow-up-right"></i></a>
      <a class="btn btn-cream btn-sm" href="#">Start an inquiry</a>
      <a class="link-arrow" href="#">Start an inquiry <i class="ph ph-arrow-right"></i></a></div>
    <div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;margin-top:26px;white-space:nowrap">
      <div style="display:inline-flex;gap:12px;padding:16px;border-radius:20px;background:var(--cream)"><button class="btn btn-navy">Send inquiry <i class="ph ph-arrow-right"></i></button><button class="btn btn-navy" disabled>Send inquiry</button></div>
      <div class="rates" data-tier="standard" style="padding:0">${take('.rates .seg')}</div>
      <div class="seg seg-sm" style="--n:2;--i:1"><span class="seg-thumb"></span><button aria-pressed="false">Population</button><button aria-pressed="true">Density</button></div></div>`;
  const formHtml = take('#form', f => { f.querySelector('.chip').setAttribute('aria-checked', 'true'); const e = f.querySelector('#email'); e.setAttribute('aria-invalid', 'true'); e.setAttribute('value', 'name@'); f.querySelector('#email-err').removeAttribute('hidden'); });
  const crs = [['Type on navy', '--text', '--n950', 'night'], ['Clear copy on navy', '--lit', '--n950', 'night'], ['Supporting copy on navy', '--muted', '--n950', 'night'], ['Faint copy on navy', '--faint', '--n950', 'night'],
    ['Supporting copy on a card', '--muted', '--n850', 'night'], ['Meta on a card', '--steel-2', '--n850', 'night'], ['Navy label on the cream button', '--n950', '--cream', 'night'], ['Meta on a cream card', '--ink-blue', '--cream', 'night'],
    ['Type on cream paper', '--text', '--c-bg', 'day'], ['Supporting copy on cream paper', '--muted', '--c-bg', 'day'], ['Faint copy on cream paper', '--faint', '--c-bg', 'day'], ['Label on the deep blue button', '--c-raise', '--c-blue', 'day'], ['Meta on a day card', '--steel-2', '--c-raise', 'day']];

  return [
/* ============ cover ============ */
`<section class="pg cover">${bar('Recorded from the Services page')}
  <svg class="cover-bars" viewBox="0 0 462 526" aria-hidden="true">${S.bars.map(b => `<path d="${b.d}" fill="${b.ink ? N('--logo-ink') : N('--logo-bar')}"/>`).join('')}</svg>
  <h1>Design<br><em>system.</em></h1>
  <div class="cover-foot"><p>The visual language of Karam Shaar Advisory, recorded from the redesigned Services page so that it can be kept, changed in one place, and carried to other pages and platforms.</p>
  ${cells([['Version', B.GROUND ? 'Testing <small>ground</small>' : B.VERSION + ' <small>draft</small>'], ['Printed', today.replace(/ \d{4}$/, '') + ' <small>' + today.slice(-4) + '</small>'], ['Themes', 'Night, day'], ['Languages', 'English, Arabic']], 4)}</div>
</section>`,

/* ============ contents ============ */
(() => { const html = `<section class="pg" data-theme="light">${bar('Contents')}
  <div class="hd"><h2>What this is, and how to read it.</h2><p>A record of the design built for the redesigned Services page, written down so the same language can be reused on other pages and other platforms. It is a draft. The system is still being settled, and the last chapter lists what is open.</p></div>
  <div class="bd c75">
    <ul class="toc" data-toc-list></ul>
    <div class="stack">
      <div class="card"><h3 class="t">For the team</h3><p class="s">Each chapter opens with the idea and follows with the exact values. Read the openers to know the design. Read the pages behind them to build with it.</p></div>
      <div class="card"><h3 class="t">For designers and developers</h3><p class="s">Colours, sizes and tables in this book are printed from the token file, and the specimens are drawn by the page's own stylesheet. The book and the site cannot disagree, because one is made from the other.</p></div>
      <div class="card"><h3 class="t">For AI assistants</h3><p class="s">Start from ${tok('DESIGN.md')} at the project root. Change values in ${tok('design-system/tokens.css')}, then run ${tok('node design-system/build.mjs')}. There is no need to read the whole page file to change a colour or a size.</p></div>
      ${cells([['Recorded from', '<small>site/index.html</small>'], ['Tokens', S.tokens.night.length + S.tokens.day.filter(t => !S.map.night[t.name]).length + ' <small>values</small>']], 2)}
    </div>
  </div>${foot('Karam Shaar Advisory', 'Contents')}</section>`; return html; })(),

/* ============ 01 principles ============ */
opener({ n: '01', title: 'Principles', about: 'What the design is for, and the order of emphasis', list: ['Evidence leads', 'One field, one accent', 'Editorial, not promotional', 'Motion that settles', 'Two scripts, two lights', 'Only what is true'],
  panel: `<img src="../.cache/shots/hero-night-en.jpg" alt="" style="object-position:72% 50%">`, stat: ['One voice', 'A research firm should look like its research: exact, calm, and easy to check. Every rule in this book follows from that.'] }),
page({ z: 1.24, title: 'Six principles.', intro: 'These are the reasons behind the values in the rest of the book. When a new page or platform raises a question the book does not answer, answer it from here.',
  body: `<div class="prin">${[
    ['Evidence leads.', 'The firm sells analysis, so data is the picture. The block map of Syria, the row of figures and the firm\'s own publication covers do the work that photography does elsewhere.', 'In practice: no stock photographs and no decorative illustration. A picture is a map, a number, a chart or a real cover.'],
    ['One field, one accent.', 'Deep navy carries the page. Cream is the only accent: it marks what can be pressed and what is selected. Rose appears once, as the line under the headline\'s key words.', 'In practice: if a second accent seems necessary, the layout is asking for hierarchy, not colour.'],
    ['Editorial, not promotional.', 'Serif headlines set like a publication, written as sentences that end in a full stop. Wide margins, a calm measure, hairlines instead of boxes.', 'In practice: no small label above a heading, no coloured stripe down the side of a card, no card inside a card.'],
    ['Motion that settles.', 'One spring with no bounce. Content rises once as it arrives and then stays still. Nothing loops to ask for attention.', 'In practice: every movement has a still form for visitors who ask for reduced motion, and the page reads the same without it.'],
    ['Two scripts, two lights.', 'English and Arabic, night and day, are four equal states of one design. None of them is a translation or an afterthought of another.', 'In practice: a change is finished when it is right in all four. New copy arrives with its Arabic. New colour arrives with its day value.'],
    ['Only what is true.', 'Rates, client names, counts and registration numbers come from the firm\'s own published record.', 'In practice: nothing is invented to fill a layout. A figure that is not yet confirmed is marked as a stand-in in the source until the real one arrives.'],
  ].map((p, i) => `<div><span class="num">0${i + 1}</span><h3>${p[0]}</h3><p>${p[1]}</p><p>${p[2]}</p></div>`).join('')}</div>` }),
page({ night: true, z: 1.2, title: 'Hierarchy.', intro: 'Four ladders decide what the eye meets first: the size of type, the strength of its ink, the lightness of the surface, and the weight of an action. Each has few steps, and a page uses them in order.', cols: 'cols-3',
  body: `<div class="stack">${k('Reading order')}
      <ol class="ladder">${[
        ['Headline', '<span class="x" style="font-size:33px;display:block">Clear answers on<br><em>Syria\'s economy.</em></span>', '--fs-hero, one per page'],
        ['Figure', '<span class="x" style="font-size:31px">1,400+</span>', '--fs-figure, --fs-price'],
        ['Section heading', '<span class="x" style="font-size:23px;display:block">Four practice areas.<br><span class="dim">One view of the economy.</span></span>', '--fs-h2, second sentence dimmed'],
        ['Card heading', '<span class="x" style="font-size:18px;font-weight:500">Research and studies</span>', '--fs-h3, --fs-card-title'],
        ['Body', '<span style="font-size:12.5px;color:var(--lit)">Market assessments, sector analysis and feasibility studies.</span>', '--fs-body, --fs-lede, --fs-sub'],
        ['Meta', '<span style="font-size:10.4px;color:var(--steel-2)">Cost and timeline follow scope</span>', 'small text, 11.5 to 15.2 px'],
      ].map((r, i) => `<li><span class="num">${i + 1}</span><div>${r[1]}<small>${r[0]}: ${r[2]}</small></div></li>`).join('')}</ol></div>
    <div class="stack lg"><div class="stack">${k('Strength of ink')}
      ${table(['Ink', 'Token', 'Used for'], [['<span style="color:var(--text)">Full</span>', tok('--text'), 'Headings, figures, the paragraph being read'], ['<span style="color:var(--lit)">Clear</span>', tok('--lit'), 'Copy inside cards, client names'], ['<span style="color:var(--muted)">Supporting</span>', tok('--muted'), 'Ledes, card copy, labels, nav links'], ['<span style="color:var(--faint)">Faint</span>', tok('--faint'), 'Second half of a heading, legal lines']], 'tight')}</div>
      <div class="stack">${k('Depth by lightness: nearer is lighter')}
      <div style="height:128px;display:flex;align-items:flex-end;border-bottom:1px solid var(--rule)">${['--ink', '--n950', '--n900', '--n850', '--n800', '--n600', '--cream'].map((n, i) => `<i style="flex:1;height:${28 + i * 12}%;background:var(${n});box-shadow:inset 0 0 0 1px var(--line)"></i>`).join('')}</div>
      <div style="display:flex">${['edge', 'page', 'band', 'card', 'card+', 'action band', 'cream card'].map(t => `<span class="k" style="flex:1;font-size:7px;letter-spacing:.04em">${t}</span>`).join('')}</div>
      <p class="s">Surfaces step from the page edge up to the cream card. Shadow is kept for the three places where one thing physically overlaps another.</p></div></div>
    <div class="stack">${k('Weight of an action')}
      ${frame({ w: 560, h: 330, s: .49, pad: 30, cap: false, html: `<div style="display:grid;gap:22px;justify-items:start"><a class="btn btn-cream" href="#">Start an inquiry <i class="ph ph-arrow-right"></i></a><a class="btn btn-ghost" href="#">Browse publications <i class="ph ph-arrow-up-right"></i></a><a class="link-arrow" href="#">Start an inquiry <i class="ph ph-arrow-right"></i></a><span style="font-size:.93rem;color:var(--muted)">Publications</span></div>` })}
      ${rules(['<b>Solid cream pill</b>: the one primary action in view.', '<b>Outlined pill</b>: a second action, or the primary repeated in the nav bar.', '<b>Arrow link</b>: an action inside a card or a row.', '<b>Plain link</b>: navigation.'])}</div>` }),

/* ============ 02 colour ============ */
opener({ n: '02', title: 'Colour', about: 'Night and day palettes, roles, contrast', list: ['Night palette', 'Day palette', 'Roles', 'Contrast'],
  panel: `<div class="bars" style="padding:0 0 0 0;align-self:stretch">${['--ink', '--n950', '--n900', '--n850', '--n800', '--n700', '--n600', '--n500', '--steel', '--steel-2', '--mist', '--cream'].map((n, i) => `<i style="height:${18 + i * 7.4}%;background:${N(n)}"></i>`).join('')}</div>`,
  stat: ['Cream', 'is the single accent on a navy field. If something is cream, it can be pressed or it is the thing selected.'] }),
page({ night: true, z: 1.22, title: 'Night palette.', intro: 'The default theme. A ramp of navy for surfaces, three cool tints for secondary type, and cream as the only accent. Rose and the four practice tints are small, fixed roles, not general-purpose colours.',
  body: `<div class="grp">${k('Navy ramp: surfaces, darkest to lightest')}${sws(['--ink', '--n950', '--n900', '--n850', '--n800', '--n700', '--n600', '--n500'], 'night', { h: 78 })}</div>
    <div style="display:grid;grid-template-columns:5fr 3fr;gap:26px"><div class="grp">${k('Cream: the accent')}${sws(['--cream', '--cream-hi', '--field', '--sand', '--cream-2'], 'night', { h: 54 })}</div><div class="grp">${k('Cool tints')}${sws(['--steel-2', '--mist', '--steel'], 'night', { h: 54, note: false })}<p class="s">Meta lines, column heads and tags. ${tok('--steel')} is reserved.</p></div></div>
    <div style="display:grid;grid-template-columns:5fr 5fr;gap:26px"><div class="grp">${k('Type and rules, as strengths of one pale blue')}${sws(['--text', '--lit', '--muted', '--faint', '--line'], 'night', { h: 54, note: false })}</div><div class="grp">${k('Underline, and one tint per practice area')}${sws(['--rose', '--lilac', '--peri', '--sage', '--ochre'], 'night', { h: 54, note: false })}</div></div>` }),
page({ z: 1.2, title: 'Day palette.', intro: 'The same world in daylight: cream paper in place of navy, deep blue as ink and action. Deep blue owns two regions outright, the featured rate and the inquiry band, so the page keeps one strong colour moment instead of scattering it.',
  body: `<div style="display:grid;grid-template-columns:5fr 3fr;gap:26px"><div class="grp">${k('Paper: grounds, lightest to deepest')}${sws(['--c-raise', '--c-tint', '--c-bg', '--c-deep', '--c-sand'], 'day', { h: 78 })}</div><div class="grp">${k('Deep blue: ink, action, owned regions')}${sws(['--c-blue-ink', '--c-blue', '--c-blue-2'], 'day', { h: 78, note: false })}<p class="s">Buttons, the selected state, links, the featured rate card and the inquiry band.</p></div></div>
    <div style="display:grid;grid-template-columns:5fr 5fr;gap:26px"><div class="grp">${k('Type and rules, as strengths of one navy ink')}${sws(['--text', '--lit', '--muted', '--faint', '--line'], 'day', { h: 54, note: false })}</div><div class="grp">${k('Accents, deepened to hold on cream')}${sws(['--rose', '--lilac', '--peri', '--sage', '--ochre'], 'day', { h: 54, note: false })}</div></div>
    <div style="display:grid;grid-template-columns:4fr 6fr;gap:26px"><div class="grp">${k('Practice cards: four creams, stepping warmer')}${sws(['--pcard-1', '--pcard-2', '--pcard-3', '--pcard-4'], 'day', { h: 40, note: false })}</div>
    ${rules(['Night values that the day theme does not list are unchanged: the navy ramp and the cream family are the same in both.', 'Cream surfaces (the form, the cream button) keep navy ink in both themes. They do not invert.', 'Inside the two deep blue regions, type and rules take their night values back.'])}</div>` }),
page({ z: 1.24, title: 'Roles and contrast.', intro: 'A colour is chosen by its job, not its look. The table gives each job its night and day value. The contrast figures are calculated from the token file each time this book is printed.', cols: 'c75',
  body: `${table(['Role', 'Night', 'Day'], [
      ['Page ground', nd('--n950'), dd('--c-bg')], ['Raised band (figures)', nd('--n900'), dd('--c-raise')], ['Alternate band (formats)', nd('--n900'), dd('--c-deep')], ['Card', nd('--n850'), dd('--c-raise')], ['Page edge and footer', nd('--ink'), dd('--c-deep')],
      ['Body type', nd('--text'), dd('--text')], ['Supporting type', nd('--muted'), dd('--muted')], ['Hairline', nd('--line'), dd('--line')],
      ['Primary action', nd('--cream') + ' with navy label', dd('--c-blue') + ' with cream label'], ['Selected state', nd('--cream'), dd('--c-blue')], ['Headline underline', nd('--rose'), dd('--rose')],
      ['Featured card (hourly rate)', nd('--cream'), dd('--c-blue-2') + ' to ' + tok('--c-blue')], ['Inquiry band', nd('--n600') + ' to ' + tok('--n800'), dd('--c-blue-2') + ' to <code>#182f50</code>'], ['Form card on that band', nd('--cream'), dot(N('--cream')) + 'the same cream'], ['Focus ring', nd('--cream'), dd('--c-blue')]], 'tight')}
    <div class="stack">${table(['Pair', 'Ratio', ''], crs.map(([label, f, b, th]) => { const r = contrast(tv(f, th), tv(b, th), th); return [dot(tv(b, th)) + label + ` <span class="mut">(${th})</span>`, r.toFixed(1) + ' : 1', `<span class="tag ${r >= 4.5 ? 'ok' : ''}">${r >= 4.5 ? 'AA' : r >= 3 ? 'large only' : 'below AA'}</span>`]; }), 'tight')}
      ${rules(['<b>Rose is a line</b>, never type and never a button.', 'A practice tint marks only its own practice area: its icon, its card gradient, its geometry.', 'A new colour goes into the token file with its day value in the same change.'])}</div>` }),

/* ============ 03 type ============ */
opener({ n: '03', title: 'Type', about: 'Three families, the scale, heading patterns, Arabic', list: ['Families', 'Scale', 'Patterns', 'Arabic'],
  panel: `<div style="display:grid;gap:8px;justify-items:center;text-align:center"><span style="font-family:var(--serif);font-size:250px;line-height:.9;letter-spacing:-.04em">Aa</span><div style="display:flex;gap:44px;align-items:baseline"><span style="font-size:74px;line-height:1;font-weight:500">Aa</span><span style="font-family:var(--arabic);font-size:74px;line-height:1.2;font-weight:600">أب</span></div></div>`,
  stat: ['3 families', 'Newsreader speaks. Fira Sans does the work. Cairo takes both roles in Arabic.'] }),
page({ z: 1.2, title: 'Families.', intro: 'A serif for the voice of the firm and a sans for everything functional. In the dry run all three load from Google Fonts. They are to be hosted with the site before launch.', cols: 'cols-3',
  body: [['Newsreader', 'var(--serif)', 'Headings, figures, prices, the reading passage, the sign-off', '--serif', [['400', 'Clear answers on Syria\'s economy.', 'font-weight:400'], ['400 italic', 'Syria\'s economy.', 'font-style:italic'], ['500', 'Research and studies', 'font-weight:500']], 'Weights in use: 400 for almost everything, 500 for small card headings, italic 400 for the emphasised words of a heading. Lining numerals. Optical sizing on.'],
    ['Fira Sans', 'var(--sans)', 'Body copy, buttons, labels, navigation, meta, forms', '--sans', [['400', 'We pair rigorous data analysis with deep local context.', 'font-weight:400;font-size:17px'], ['500', 'Start an inquiry', 'font-weight:500;font-size:17px'], ['600', 'Your email', 'font-weight:600;font-size:15px']], 'Weights in use: 400 for copy, 500 for anything pressable and for meta, 600 for form labels and footer headings. Tabular numerals in data readouts.'],
    ['Cairo', 'var(--arabic)', 'Everything in Arabic, headings and body alike', '--arabic', [['400', S.AR['We pair rigorous data analysis with deep local context and field access inside and outside the country.'], 'font-weight:400;font-size:16px'], ['500', S.AR['Start an inquiry'], 'font-weight:500;font-size:17px'], ['600', S.AR['Clear answers on'] + ' ' + S.AR["Syria's economy."], 'font-weight:600;font-size:22px']], 'Weights in use: 400 for copy, 500 for the reading passage and column heads, 600 for headings, figures and emphasis.']
  ].map(([name, fam, use, token, lines, noteText], i) => `<div class="stack" ${i === 2 ? 'style="direction:ltr"' : ''}>
      <div style="font-family:${fam};font-size:108px;line-height:1;letter-spacing:-.03em;height:118px;${i ? 'font-weight:500' : ''}">${i === 2 ? 'أب' : 'Aa'}</div>
      <h3 class="t" style="font-size:25px">${name}</h3><p class="s">${use}.</p>
      <div>${lines.map(([w, t, st]) => `<div style="display:grid;grid-template-columns:62px 1fr;gap:8px;align-items:baseline;padding:8px 0;border-top:1px solid var(--line)">${k(w)}<span ${i === 2 ? 'class="ar"' : ''} style="font-family:${fam};font-size:21px;line-height:1.25;${i ? '' : 'letter-spacing:-.015em;'}${st}">${t}</span></div>`).join('')}</div>
      <p class="s">${noteText}</p><p class="s">${tok(token)}: <span style="font-family:var(--mono);font-size:9px">${N(token).replace(/"/g, '')}</span></p></div>`).join('') }),
page({ z: 1.3, title: 'Scale.', intro: 'Display sizes are fluid: each grows with the width of the screen between a smallest and a largest size, given here in pixels. Body sizes are fixed. One rem is 16 px.', cols: 'c84',
  body: `${table(['Role', 'Token', 'Face', 'Size', 'Line', 'Tracking'], [
      ['Page title', '--fs-h1', 'Serif 400', 1.06, '-0.022em'], ['Hero headline', '--fs-hero', 'Serif 400', 1.06, '-0.022em'], ['Section heading', '--fs-h2', 'Serif 400', 1.1, '-0.018em'], ['Practice card heading', '--fs-card-title', 'Serif 400', 1.08, '-0.018em'], ['Card heading', '--fs-h3', 'Serif 500', 1.16, '-0.01em'],
      ['Reading passage', '--fs-statement', 'Serif 400', 1.24, '-0.012em'], ['Sign-off line', '--fs-signoff', 'Serif 400', 1.08, '-0.025em'], ['Figure', '--fs-figure', 'Serif 400', 1, '-0.03em'], ['Price', '--fs-price', 'Serif 400', .86, '-0.04em'],
      ['Lede', '--fs-lede', 'Sans 400', 1.6, '0'], ['Paragraph under a heading', '--fs-sub', 'Sans 400', 1.6, '0'], ['Body', '--fs-body', 'Sans 400', 1.6, '0'], ['Body on phones', '--fs-body-sm', 'Sans 400', 1.6, '0'],
    ].map(([r, t, f, l, tr]) => [r, tok(t), f, sz(t), l, tr]))}
    <div class="stack">${k('Small text, as built')}
      ${table(['px', 'Used for'], [['15.2', 'Toggle buttons, the note on the rate card'], ['14.9', 'Nav links, footer links'], ['14.4', 'Form labels, units beside a price'], ['14.1', 'Chips, client names, error lines'], ['13.8', 'Card meta, help text, legal line, footer heads'], ['13.4', 'Tags, client column heads'], ['13.1', 'Figure labels, language button'], ['12.8', 'Map readout'], ['12.5', 'Label above the hero field'], ['12.2', 'Small toggle'], ['11.5', 'Figure inside a map callout']], 'tight')}
      <p class="s">Eleven sizes within four pixels. They are set in the page's stylesheet, not in the token file, and are a candidate for reduction to four steps before the system is final.</p></div>` }),
page({ z: 1.12, title: 'Patterns, and Arabic.', intro: 'How headings are written matters as much as their size. The same patterns hold in Arabic, with emphasis carried by weight and colour because the script has no italic.', cols: 'cols-2',
  body: `<div class="stack">${frame({ w: 860, h: 290, s: .52, pad: 44, cap: 'Headline: key words in italic, underlined once in rose', html: take('.hero-copy h1', h => h.classList.add('in')) })}
      ${frame({ w: 860, h: 245, s: .52, pad: 44, cap: 'Section heading: a statement, then a dimmed second sentence', html: take('.practice .sec-head h2') })}
      ${rules(['Headings are sentences. They end with a full stop.', 'Italic is Newsreader 400 only, for the words that carry the point. The rose underline appears once on a page.', 'Headings wrap balanced, paragraphs wrap without orphans. Paragraphs hold to 26 to 34 em.'])}</div>
    <div class="stack">${frame({ w: 860, h: 290, s: .52, pad: 44, ar: true, cap: 'Headline in Arabic: weight 600, no italic', html: take('.hero-copy h1', h => h.classList.add('in')) })}
      ${frame({ w: 860, h: 245, s: .52, pad: 44, ar: true, cap: 'Section heading in Arabic', html: take('.practice .sec-head h2') })}
      ${rules(['Cairo for everything. Tracking is zero everywhere, because the letters join.', 'Headings at weight 600 and line height 1.3 to 1.35. Body at line height 1.85. Emphasis is weight 600, in cream inside section headings.', 'Digits stay Western. Email fields stay left to right. The logo keeps its Latin wordmark.'])}</div>` }),

/* ============ 04 layout ============ */
opener({ n: '04', title: 'Layout', about: 'Container, rhythm, grids, breakpoints, the page', list: ['Container', 'Rhythm', 'Grids', 'Breakpoints', 'The page, band by band'],
  panel: `<div style="position:absolute;inset:0">${strip('full-night-en')}</div>`, stat: [N('--wrap').replace('px', ' px'), 'is the widest the content column gets. Bands run from edge to edge of the screen. What they hold stays on one column.'] }),
page({ z: 1.14, title: 'Space and grids.', intro: 'Space is fluid like the type: section spacing grows with the screen between a smallest and a largest value. Inside a band, everything aligns to one column and a small set of grids.', cols: 'c57',
  body: `<div class="stack lg">${cells([['Content column', N('--wrap').replace('px', '') + ' <small>px</small>', tok('--wrap')], ['Side margin', '24 <small>px</small>', '16 px on phones'], ['Between cards', N('--gap').replace('px', '') + ' <small>px</small>', tok('--gap')],
        ['Above and below a section', sz('--sec-y').replace(' px', '') + ' <small>px</small>', tok('--sec-y')], ['Under a section heading', sz('--sec-head').replace(' px', '') + ' <small>px</small>', tok('--sec-head')], ['Around the reading passage', '110 to 210 <small>px</small>', 'the page\'s one long pause']], 2)}
      ${table(['Inside a card', 'Padding'], [['Practice card', '28 to 56 px'], ['Format card', '30 px, 12 px between lines'], ['Featured rate', '28 to 44 px'], ['Rate row', '28 px by 22 to 40 px'], ['Form card', '22 to 38 px, 24 px between fields']], 'tight')}</div>
    <div class="stack lg"><div class="stack">${k('Formats: twelve columns, six cards')}
      <div class="gridmap"><i style="grid-column:1/8;grid-row:1/3;min-height:72px">A · 7 of 12, two rows</i><i style="grid-column:8/13">B · 5</i><i style="grid-column:8/13">C · 5</i><i style="grid-column:1/6">D · 5</i><i style="grid-column:6/10">E · 4</i><i style="grid-column:10/13">F · 3</i></div></div>
      ${table(['Grid', 'Desktop', 'Tablet', 'Phone'], [['Figures', '6 across', '3 across', '2 across'], ['Practice card', '1 : 0.92', '1 : 0.92', '1 column'], ['Formats', '12 columns', 'A full, then 6 + 6, 7 + 5', '1 column'], ['Rates', '5 : 7', '1 column', '1 column'], ['Inquiry', '1 : 1.05', '1 column', '1 column'], ['Clients', '4 columns', '2 columns (from 1179)', '1 column'], ['Footer', '1.5 : 1 : 1 : 1', '3 columns', '2 columns']], 'tight')}
      ${table(['Breakpoint', 'Width', 'What changes'], [['Desktop', '1101 px and up', 'Full nav. Hero copy sits beside the map.'], ['Tablet', '768 to 1100 px', 'Menu button. Hero stacks, map below the copy.'], ['Phone', '767 px and below', 'Body 16 px, margins 16 px, cards stop stacking, touch targets 44 px.']], 'tight')}</div>` }),
page({ z: 1.1, title: 'The page, band by band.', intro: 'A page is a stack of full-width bands. Neighbouring bands never share a ground, and a hairline marks each change. Other pages reuse these bands in any order that keeps that alternation.', style: 'grid-template-columns:auto 1fr',
  body: `<div class="fig"><div style="height:492px">${strip('full-day-en', 2)}</div>${k('The page by day, top to bottom, left to right')}</div>
    <div class="stack">${table(['', 'Band', 'Night ground', 'Day ground', 'What it holds'], [
      ['Hero', 'Sky: <code>#36487f</code> to ' + tok('--n900'), 'Warm wash: <code>#f8f1e3</code> to <code>#f1e6d1</code>', 'Headline, one line, an email field. The block map fills the band.'],
      ['Figures', nd('--n900'), dd('--c-raise'), 'The firm in six numbers.'], ['Statement', nd('--n950'), dd('--c-bg'), 'Three paragraphs, lit one at a time as they are read.'],
      ['Practice areas', nd('--n950') + ', cards ' + tok('--pcard-1') + ' to ' + tok('-4'), dd('--c-bg') + ', cards stepping warmer', 'Four cards that stack as the page scrolls.'],
      ['Formats', nd('--n900'), dd('--c-deep'), 'Six ways to work with the firm, as a grid of unequal cards.'], ['Clients', nd('--n950'), dd('--c-bg'), 'Every client and donor, in four columns by kind of institution.'],
      ['Rates', nd('--n950'), dd('--c-bg'), 'One featured rate and a list, with a standard and non-profit switch.'], ['Proof', nd('--n900') + ' to <code>#17305a</code>', dd('--c-bg') + ' to ' + tok('--c-deep'), 'Three publication covers.'],
      ['Inquiry', nd('--n600') + ' to ' + tok('--n800'), dd('--c-blue-2') + ' to <code>#182f50</code>', 'The form, on a cream card.'], ['Footer', nd('--ink'), dd('--c-deep'), 'Sign-off line, links, registration details.'],
    ].map((r, i) => [`<span class="num">${String(i + 1).padStart(2, '0')}</span>`, ...r]), 'tight')}
    ${rules(['The hero is one screen tall on desktop. Every other band is as tall as its content plus the section space.', 'The nav has no bar of its own: it floats on a soft veil that appears once the page scrolls.'])}</div>` }),

/* ============ 05 shape ============ */
opener({ n: '05', title: 'Shape', about: 'Radius, line, depth, texture, geometry', list: ['Radius', 'Line', 'Depth', 'Texture', 'Geometry'],
  panel: `<div style="display:grid;grid-template-columns:auto auto;gap:22px;align-items:end"><i style="display:block;width:250px;height:170px;border-radius:${N('--r-card')};box-shadow:inset 0 0 0 1px ${N('--cream')}"></i><i style="display:block;width:96px;height:128px;border-radius:${N('--r-cover')};box-shadow:inset 0 0 0 1px ${N('--cream')}"></i><i style="display:block;width:250px;height:54px;border-radius:${N('--r-in')};box-shadow:inset 0 0 0 1px ${N('--cream')}"></i><i style="display:block;width:96px;height:54px;border-radius:${N('--r-btn')};background:${N('--cream')}"></i></div>`,
  stat: ['4 radii', 'Cards 20, inputs 12, covers 6, and a full pill for anything that can be pressed. Nothing else.'] }),
page({ z: 1.25, title: 'Edges and depth.', intro: 'Shape says what a thing is. A full pill can be pressed. A 20 px corner is a surface that holds content. A 6 px corner is a printed object. Depth comes from lightness, and shadow is rare.', cols: 'cols-3',
  body: `<div class="stack lg"><div class="stack">${k('Radius')}${table(['Token', 'px', 'Used for'], [[tok('--r-card'), N('--r-card').replace('px', ''), 'Cards, panels, menus'], [tok('--r-in'), N('--r-in').replace('px', ''), 'Text fields, menu rows'], [tok('--r-btn'), N('--r-btn') === '999px' ? 'full' : N('--r-btn').replace('px', ''), 'Buttons, chips, toggles, nav links'], [tok('--r-tag'), N('--r-tag') === '999px' ? 'full' : N('--r-tag').replace('px', ''), 'Small labels that cannot be pressed'], [tok('--r-cover'), N('--r-cover').replace('px', ''), 'Publication covers']], 'tight')}
        <p class="s">Two as-built exceptions: the hero email field takes 22 px when it stacks on phones, and the focus ring is 6 px.</p></div>
      <div class="stack">${k('Line')}${rules(['One hairline, 1 px in ' + tok('--line') + ': between bands, around cards, between rows.', 'Pills are outlined with a 1 px ring drawn inside the shape, at about 30% of their ink, rising to 55 to 75% on hover.', 'The reading rail beside the statement is the only 2 px line.'])}</div></div>
    <div class="stack lg"><div class="stack">${k('Depth')}${table(['Where', 'Shadow'], [['Practice cards, as they stack', '0 -22 48 -30, near-black navy at 85%'], ['Phone menu', '0 24 48 -24, at 70%'], ['Publication covers', '0 34 70 -28, at 90%, plus a 1 px light ring']], 'tight')}
        <p class="s">Three shadows carry the page's depth, each where one object lies over another. Cards do not float. By day the same shadows turn warm brown at 28 to 45%.</p></div>
      <div class="stack">${k('Texture')}<p class="s">A fine film grain lies over the whole page in two fixed layers, at 7% and 3.5% strength (5% and 3% by day). It is switched off in print and is under review: see the last chapter.</p></div></div>
    <div class="stack">${k('Geometry')}${frame({ w: 900, h: 420, s: .29, pad: 20, cap: false, css: '.bento{grid-template-columns:1fr 1fr}.bento>*{grid-column:auto!important;min-height:380px}', html: `<div class="bento">${take('.b-d')}${take('.b-e')}</div>` })}
      ${rules(['Three motifs from the firm\'s brochure: a tall triangle, an upright band, a field of dots at a 15 to 16 px pitch.', 'Each is a light tint that fades to nothing. On a practice card it takes that area\'s tint.', 'Geometry is decoration only. It mirrors in Arabic and thins out on phones.'])}</div>` }),

/* ============ 06 components ============ */
opener({ n: '06', title: 'Components', about: 'Actions, inputs, navigation, cards, data, footer', list: ['Actions', 'Inputs', 'Navigation', 'Cards', 'Rates and figures', 'Proof and clients'],
  panel: frame({ w: 1280, h: 1300, s: .4055, pad: 0, cap: false, html: take('.formats') }), stat: ['Live specimens', 'Each component on the next pages is drawn by the page\'s own stylesheet, in both lights. What is printed here is what the site does.'] }),
page({ z: 1.1, title: 'Actions.', intro: 'Everything that can be pressed is a pill. One solid cream button per view. The navy button exists only on cream surfaces. The nav bar repeats the primary action as an outline so the hero\'s button stays the only solid one.', cols: 'c57',
  body: `<div class="stack">${pair(btns, { w: 880, h: 330, s: .435, pad: 34 }, 'Buttons, arrow link, toggles')}</div>
    <div class="stack">${table(['Part', 'Size', 'Type', 'States'], [
        ['Button', `${t(N('--h-btn'))} high, 28 px sides, pill`, '17 px, 500', 'Hover: lighter fill, arrow moves 4 px. Press: 98% scale. Disabled: 62%.'],
        ['Small button', `${t(N('--h-btn-sm'))} high, 20 px sides`, '14.7 px, 500', 'As above.'],
        ['Cream (primary)', tok('--cream') + ' fill, navy label', '', 'Hover ' + tok('--cream-hi') + '. By day: ' + tok('--c-blue') + ' fill, cream label.'],
        ['Outlined (ghost)', '1 px inner ring at 30%', '', 'Hover: ring 75%, 6% fill.'],
        ['Navy, on cream only', tok('--n900') + ' fill, cream label', '', 'Hover ' + tok('--n700') + '.'],
        ['Arrow link', 'Text and a 1 em arrow, 0.5 em apart', '17 px, 500', 'Hover: arrow moves 4 px. Cream by night, deep blue by day.'],
        ['Toggle', 'Track with 5 px inset, buttons 44 px high', '15.2 px, 500', 'Cream thumb slides in 0.7 s. Chosen label turns navy.'],
        ['Small toggle', '3 px inset, buttons 26 px high', '12.2 px, 500', 'Translucent thumb, chosen label cream. Used on the map.']], 'tight')}
      ${rules(['Icons are 1.1 em, 0.6 em from the label, and always follow it.', 'Arrows point with the reading direction and mirror in Arabic.', 'Focus: a 2 px ring, 3 px clear of the shape, cream by night and deep blue by day.'])}</div>` }),
page({ z: 1.1, title: 'Inputs.', intro: 'Two input styles. On the navy field, one pill holds the email field and its button together. On the cream form card, fields are plain rectangles with 12 px corners and a visible label above each.', cols: 'c57',
  body: `<div class="stack">${pair(take('#starter', f => { f.style.margin = '0'; }), { w: 800, h: 150, s: .48, pad: 30 }, 'Hero email field')}
      ${frame({ w: 800, h: 185, s: .48, pad: 30, cap: 'With its error line', html: take('#starter', f => { f.style.margin = '0'; f.querySelector('.starter-err').removeAttribute('hidden'); f.querySelector('input').setAttribute('value', 'name@'); }) })}
      ${rules(['A label is always visible above its field. Placeholders show a format, never the label.', 'Errors appear under the field in a sentence that says what to do.'])}</div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:20px">${frame({ w: 620, h: 800, s: .45, pad: 28, bg: 'linear-gradient(150deg,var(--n600),var(--n800) 62%)', cap: 'Form card: chosen chip, field in error', html: formHtml })}
      <div class="stack">${table(['Part', 'Measure'], [['Hero field', 'Pill, 4 px inset, field and button 40 px high, at most 392 px wide. Ring turns cream on focus.'], ['Text field', '14 by 16 px padding, 1 px navy line at 30%, ' + tok('--r-in') + ', ground ' + tok('--field') + '.'], ['Label', '14.4 px, 600, 10 px above the field.'], ['Focus', 'Line turns ' + tok('--n700') + ', plus a 3 px soft ring.'], ['Error', 'Line turns ' + tok('--err') + ', soft red ring, message in ' + tok('--err-ink') + ' at 13.8 px, 500.'],
          ['Chip (one choice)', '9 by 14 px, pill, 14.1 px. Chosen: ' + tok('--n900') + ' fill, cream label. 44 px high on phones.'], ['Tag (not pressable)', '7 by 13 px, pill, 13.4 px, 1 px ring at 26%.']], 'tight')}</div></div>` }),
page({ title: 'Navigation and footer.', intro: 'The nav bar has no box. It is type laid over the page, on a veil of blur and tint that appears once the page scrolls. The footer is the darkest surface on the page and ends on the firm\'s line.', cols: 'c84',
  body: `<div class="stack">${['night', 'day'].map(theme => frame({ w: 1320, h: 96, s: .5, pad: 0, theme, cap: 'Nav bar', html: take('#nav', n => n.classList.add('is-scrolled')) })).join('')}
      ${frame({ w: 1320, h: 610, s: .5, pad: 0, cap: 'Footer', html: take('.foot') })}</div>
    <div class="stack">${frame({ w: 390, h: 500, s: .5, pad: 0, cap: 'Phone menu', html: take('#nav') + take('#mnav', m => m.removeAttribute('hidden')), css: '.mnav{animation:none}' })}
      ${table(['Part', 'Measure'], [['Bar', '76 px high (64 on tablet and phone), on the content column.'], ['Veil', '14 px blur and a tint that fade out over 130 to 150 px.'], ['Logo', '97 by 38 px in the bar, 113 by 44 px in the footer.'], ['Links', '14.9 px, 9 by 14 px, pill highlight on hover. Current page at full strength.'], ['Round buttons', 'Theme and language, 42 px. Menu, 44 px.'], ['Phone menu', 'One panel, ' + tok('--r-card') + ', rows 48 px high.'], ['Footer', 'Ground ' + tok('--ink') + '. Columns 1.5 : 1 : 1 : 1, 36 px apart. Links 14.9 px.']], 'tight')}</div>` }),
page({ title: 'Cards.', intro: 'A card is one surface with one idea. Cards are never placed inside cards. The practice cards stack as the page scrolls. The format cards sit in a grid of unequal sizes so that the eye has an order to follow.', cols: 'cols-2',
  body: `<div class="stack">${['night', 'day'].map(theme => frame({ w: 1280, h: 478, s: .396, pad: 0, theme, cap: 'Practice card', css: '.pcard{position:relative!important;top:auto!important}.wrap{margin-top:24px}', html: `<div class="wrap"><div class="stack">${take('.pcard')}</div></div>` })).join('')}
      ${table(['Practice card', ''], [['Surface', tok('--r-card') + ', 28 to 56 px padding, two columns 1 : 0.92.'], ['Ground', 'Its area tint mixed 11% into its navy, fading to plain navy by 62%.'], ['Title', tok('--fs-card-title') + ' with a 34 px line icon in the area tint.'], ['List', 'Rows with 19 px above and below, a hairline between, 17.6 px type.'], ['Stack', 'Each card pins 18 px lower than the one before. Not on phones.']], 'tight')}</div>
    <div class="stack">${frame({ w: 1280, h: 960, s: .396, pad: 0, cap: 'Format cards', css: '.wrap{margin-top:24px}', html: `<div class="wrap">${take('.bento')}</div>` })}
      ${table(['Format card', ''], [['Surface', tok('--r-card') + ', ground ' + tok('--n850') + ', hairline that brightens on hover.'], ['Body', '30 px padding, 12 px between lines, set at the foot of the card.'], ['Title', tok('--fs-h3') + ', 500. One card states its point as a large title instead.'], ['Meta', '13.8 px with a 1 em icon, in ' + tok('--steel-2') + '.'], ['Picture', 'At least 300 px high, fades into the card, grows 4% on hover.']], 'tight')}</div>` }),
page({ title: 'Rates and figures.', intro: 'Numbers are set in the serif at display size, with their unit small beside them in the sans. The one featured rate takes the accent surface: cream by night, deep blue by day.', cols: 'cols-2',
  body: `<div class="stack">${['night', 'day'].map(theme => frame({ w: 1280, h: 568, s: .396, pad: 0, theme, cap: 'Rates', css: '.wrap{margin-top:24px}', html: `<div class="rates" data-tier="standard" style="padding:0"><div class="wrap">${take('.rates-grid')}</div></div>` })).join('')}</div>
    <div class="stack">${frame({ w: 1280, h: 170, s: .396, pad: 0, cap: 'Figures row', html: take('.figures', f => f.querySelectorAll('.stat-num').forEach(n => { n.innerHTML = '<span class="stat-vis">' + n.textContent.replace('M', '<span class="stat-unit">M</span>').replace('+', '<span class="stat-plus">+</span>') + '</span>'; })) })}
      ${table(['Part', 'Measure'], [['Figure', tok('--fs-figure') + ', serif 400. Plus sign and unit in ' + tok('--sand') + ' (brass by day).'], ['Figure label', '13.1 px, supporting ink, at most 15 em wide.'], ['Figures row', 'Six across with a hairline between. Three on tablet, two on phone.'],
        ['Featured rate', tok('--r-card') + ', 28 to 44 px padding. Price at ' + tok('--fs-price') + ', line height 0.86.'], ['Unit beside a price', '14.4 px, 500, tracking 0.05 em, in ' + tok('--ink-blue') + '.'], ['Rate row', '28 px by 22 to 40 px. Title 23.2 px serif, figure 32 to 44.8 px serif.'], ['Row hover', 'A 6% wash, and the row moves 6 px toward its start.'], ['Switch', 'Standard or non-profit. The changed figures rise 0.28 em into place.']], 'tight')}
      ${rules(['Rates are flat and stated in full. A price that depends on scope says so and offers the inquiry link instead of a number.'])}</div>` }),
page({ title: 'Proof and clients.', intro: 'The firm\'s publications and clients are shown as themselves: real covers, real names. Client marks are drawn in one ink so that eighteen different logos read as one wall.', cols: 'cols-2',
  body: `<div class="stack">${frame({ w: 1280, h: 560, s: .396, pad: 0, cap: 'Publication covers', css: '.proof{padding:10px 0 80px;min-height:560px}.covers{margin-top:40px}', html: `<div class="proof" style="border:0"><div class="wrap">${take('.covers')}</div></div>` })}
      ${frame({ w: 1280, h: 560, s: .396, pad: 0, cap: 'Reading passage', css: '.statement{padding:50px 0}', html: `<div class="statement"><div class="wrap">${take('.statement-in')}</div></div>` })}</div>
    <div class="stack">${shot('wall-night-en', 'height:262px')}<span class="k">Clients wall, as on the page</span>
      ${table(['Part', 'Measure'], [['Cover', tok('--r-cover') + ', 150 to 300 px wide (centre 170 to 340). Side covers lean 7 degrees, 3 on hover.'], ['Reading passage', tok('--fs-statement') + ', line height 1.24. Unread paragraphs at 42%. A 2 px rail fills beside the one being read.'],
        ['Client cell', 'At least 84 px high (64 on phones), 8 by 12 px padding, a 118 px slot for the mark, name at 14.1 px.'], ['Client column', 'Head at 13.4 px, 500. Columns stand on one baseline, each as tall as its count.'], ['Cell hover', 'The cell turns to cream paper and the mark shows in its real colours.']], 'tight')}</div>` }),

/* ============ 07 motion ============ */
opener({ n: '07', title: 'Motion', about: 'One curve, durations, the catalogue, reduced motion', list: ['One curve', 'Durations', 'The catalogue', 'Reduced motion'],
  panel: curve(), stat: [t(N('--t-reveal')), 'for content to rise into place, on a spring with no bounce. It arrives once and then stays still.'] }),
page({ z: 1.2, title: 'The catalogue.', intro: 'Every movement on the page, with what starts it and how long it takes. Most use the one spring. Colour changes use the plain ease. Nothing moves unless the visitor scrolls, points or presses.', cols: 'c84',
  body: `${table(['Movement', 'Starts when', 'What happens', 'Time', 'Curve'], [
      ['Arrival', 'A block is 10% in view', `Rises ${t(N('--rise'))} (24 to 72 by block) and fades in. Siblings follow 0.1 s apart.`, t(N('--t-reveal')), 'Spring'],
      ['Nav bar', 'The page opens', 'Drops 36 px and fades in.', '1 s', 'Ease in and out'],
      ['Headline underline', 'With the headline', 'The rose line draws from the start of the words.', '1.1 s, after 0.75 s', 'Spring'],
      ['Figure reels', 'The row is in view', 'Each digit rolls to its value. The plus signs land last.', '2 s', 'Spring'],
      ['Reading passage', 'Scrolling', 'The paragraph being read lights. Its rail fills.', '0.9 s', 'Ease'],
      ['Practice stack', 'Scrolling', 'Cards pin and stack, each 18 px lower.', 'With the scroll', ''],
      ['Toggle', 'A press', 'The thumb slides. Changed figures rise 0.28 em.', '0.7 s', 'Spring'],
      ['Card picture', 'Pointer over a card', 'The picture grows to 104%.', '1.4 s', 'Ease'],
      ['Covers', 'Pointer over the fan', 'Side covers close from 7 to 3 degrees. The centre lifts 3%.', '0.9 s', 'Spring'],
      ['Client cell', 'Pointer over a cell', 'Turns to cream paper. The mark takes its real colours.', '0.35 s', 'Ease'],
      ['Buttons and links', 'Pointer or press', 'Colour changes. The arrow moves 4 px. A press shrinks to 98%.', t(N('--t-ui')) + ' to 0.25 s', 'Ease'],
      ['Map callout', 'A governorate is lit', 'A hairline grows from the block. The label rises 10 px.', '0.6 to 0.7 s', 'Spring'],
      ['Theme switch', 'The theme button', 'The whole page cross-fades.', '0.45 s', 'Ease'],
      ['Smooth scroll', 'Wheel or trackpad', 'The page eases to rest (Lenis).', '1.15 s', 'Exponential out']], 'tight')}
    <div class="stack lg"><div class="stack">${k('Rules')}${rules(['One spring, one ease. ' + tok('--spring') + ' and ' + tok('--ease') + ' are the only curves.', 'Things arrive once. Leaving is not animated.', 'Only position, scale and opacity move. Layout never animates.', 'Ambient drawing (the lattice, the idle map) stops when it is off screen.'])}</div>
      <div class="stack">${k('With reduced motion')}${rules(['Arrivals become a 0.4 s fade with no movement.', 'The underline, the rail and the figures appear complete.', 'Smooth scroll, the theme cross-fade and hover movement are off.', 'The lattice and the map hold still, already lit.'])}</div></div>` }),

/* ============ 08 assets ============ */
opener({ n: '08', title: 'Assets', about: 'Logo, icons, pictures, the block map', list: ['Logo', 'Icons', 'Pictures', 'The block map'],
  panel: logo('width:330px;height:129px'), stat: ['Data is the picture', 'The map, the figures and the firm\'s own covers are the imagery. No stock photographs, no decorative illustration.'] }),
page({ z: 1.18, title: 'Logo and icons.', intro: 'The mark is the firm\'s existing logo, four bars and a wordmark, redrawn as one vector and recoloured for each ground. Icons are few, drawn as lines, and always take the colour of the text beside them.', cols: 'cols-2',
  body: `<div class="stack"><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${['night', 'day'].map(theme => frame({ w: 500, h: 250, s: .41, pad: 0, theme, cap: 'On the page ground', html: `<div style="display:grid;place-items:center;height:250px"><svg viewBox="0 0 1430 558" style="width:300px;height:117px"><use href="#ks-logo"/></svg></div>` })).join('')}</div>
      ${table(['Part of the mark', 'Night', 'Day'], [['Bars 1 and 4', nd('--logo-bar'), dd('--logo-bar')], ['Bars 2 and 3, wordmark', nd('--logo-ink'), dd('--logo-ink')], ['Tagline', nd('--logo-tag'), dd('--logo-tag')]], 'tight')}
      ${rules(['Proportion 1430 : 558. In use at 97 by 38 px (nav) and 113 by 44 px (footer).', 'The tagline inside the mark is Fira Sans 500. The Arabic page keeps the Latin wordmark.', 'On hover the four bars ripple once, then rest.', 'The original mark on karamshaar.com is charcoal <code>#545454</code> and steel blue <code>#738aa7</code> (measured October 2026). It is recoloured here, not redrawn.'])}</div>
    <div class="stack">${k('Interface icons: Phosphor, regular weight')}
      <div class="icons" style="--n:5">${S.phosphor.map(p => `<div><i class="g" style="--ph:${p.url.replace(/"/g, '&quot;')}"></i>${k(p.name)}</div>`).join('')}</div>
      ${k('Practice areas: drawn for this page')}
      <div class="icons" style="--n:4">${S.icons.map(ic => `<div style="color:${D(ic.bar)}">${ic.svg.replace('class="ico"', 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"')}<span class="k">${ic.name}</span></div>`).join('')}</div>
      ${rules(['Interface icons are ten drawings from Phosphor Icons 2.1.1 (MIT licence), 1 em square, filled with the text colour.', 'Practice icons are line drawings on a 24 unit grid with a 1.5 stroke and round ends, shown at 34 px in their area\'s tint.', 'A new interface icon is added to the page\'s stylesheet as one more <code>.ph-name</code> rule.'])}</div>` }),
page({ z: 1.1, title: 'Pictures and the block map.', intro: 'The hero is a model of Syria built from columns, where height carries a figure for each governorate. It is the firm\'s work in one image: a country made legible as data.', cols: 'c57',
  body: `<div class="stack">${shot('hero-night-en', 'height:262px')}${shot('hero-day-en', 'height:262px')}</div>
    <div class="stack lg">${cells([['View', 'Isometric', 'A true isometric camera at 35.264 degrees'], ['Grid', '30 <small>km columns</small>', 'A square grid turned 45 degrees, north up'], ['Height', 'A figure', 'Population, or density on a log scale'], ['Source', '2011', 'Central Bureau of Statistics estimate']], 2)}
      ${table(['Map colour', 'Night', 'Day'], [['Lowest column ' + tok('--map-lo'), dot(N('--map-lo')) + `<code>${N('--map-lo')}</code>`, dot(D('--map-lo')) + `<code>${D('--map-lo')}</code>`], ['Highest column ' + tok('--map-hi'), dot(N('--map-hi')) + `<code>${N('--map-hi')}</code>`, dot(D('--map-hi')) + `<code>${D('--map-hi')}</code>`], ['Lit governorate ' + tok('--map-lit'), dot(N('--map-lit')) + `<code>${N('--map-lit')}</code>`, dot(D('--map-lit')) + `<code>${D('--map-lit')}</code>`]], 'tight')}
      ${rules(['The whole country stays in frame. The map is never cropped and never fades at its edges.', 'A callout is bare type on a hairline that ends in a dot on the block: name at 16.3 px, figure at 11.5 px in tabular numerals.', 'Without WebGL the same blocks are painted once on a flat canvas.', '<b>Covers</b> are the firm\'s own publications. <b>Client marks</b> are drawn in one ink, cream by night and navy by day, and show their real colours only under the pointer.', 'The map\'s stone and coloured lights are tokens, so a change of palette reaches the map too.'])}</div>` }),

/* ============ 09 languages ============ */
opener({ n: '09', title: 'Languages', about: 'Arabic, mirroring, and access for every visitor', list: ['Arabic', 'Mirroring', 'Focus', 'Touch', 'Reduced motion'],
  panel: `<img src="../.cache/shots/hero-day-ar.jpg" alt="" style="object-position:28% 50%">`, stat: ['4 states', 'English and Arabic, night and day. A change is finished when it is right in all four.'] }),
page({ title: 'Arabic, and access.', intro: 'Arabic is not the English page reversed. Type, emphasis and line height change with the script, and decoration mirrors so the open sky stays behind the map. Access is part of the same care.', cols: 'c57',
  body: `<div class="stack"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${['hero-night-en', 'hero-day-en', 'hero-night-ar', 'hero-day-ar'].map(n => shot(n, 'height:128px')).join('')}</div>
      ${table(['Mirrors in Arabic', 'Stays as it is'], [['Layout direction and text alignment', 'The logo and its Latin wordmark'], ['Arrows, and the way they move on hover', 'Digits, which stay Western'], ['The sky, its haze and its dark corner', 'Email fields, typed left to right'], ['Card geometry, the cover fan, the toggle thumb', 'The map: geography does not flip'], ['The reading rail and the headline underline', 'Check, clock and ruler icons']], 'tight')}</div>
    <div class="stack lg"><div class="stack">${k('Access')}${rules(['<b>Focus</b> is always visible: a 2 px ring, 3 px clear of the shape. Cream on navy, deep blue on cream paper, navy on the cream form.', '<b>Keyboard</b>: a skip link comes first. The map takes focus, and the arrow keys step through the governorates while the page announces each one.', '<b>Touch</b>: on phones every target is at least 44 px high: chips, footer links, menu rows.', '<b>Controls say what they are</b>: toggles report pressed or not, chips form one radio group, an error is tied to its field.', '<b>Contrast</b>: body and supporting type meet AA on every ground. The measured ratios are in chapter 02.', '<b>Motion</b>: everything has a still form. See chapter 07.', '<b>Language</b>: the page declares its language and direction, and each theme declares its colour scheme to the browser.'])}</div>
      <div style="display:grid;grid-template-columns:auto auto 1fr;gap:14px;align-items:end">${shot('phone-night-en', 'width:118px;height:255px')}${shot('phone-day-ar', 'width:118px;height:255px')}<p class="s">On phones the hero reorders: headline and line, then the map, then the email field, so the map sits above the button. Night in English, day in Arabic.</p></div></div>` }),

/* ============ 10 platforms ============ */
opener({ n: '10', title: 'Platforms', about: 'Carrying the system beyond the Services page', list: ['Other pages', 'Data tools', 'Reports', 'Slides', 'Social'],
  panel: `<div style="align-self:stretch;justify-self:stretch;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr)">${[['--n950', 'Navy', '--text'], ['--cream', 'Cream', '--n950'], ['--c-bg', 'Day paper', '--c-blue', 'day'], ['--c-blue', 'Deep blue', '--c-raise', 'day'], ['--text', 'Type on navy', '--n950'], ['--rose', 'Rose, as a line', '--text']].map(([bg, name, fg, th]) => `<div style="background:${tv(bg, th || 'night')};color:${tv(fg, th || 'night')};padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between"><span style="font-family:var(--serif);font-size:25px;letter-spacing:-.02em">${name}</span><span style="font-family:var(--mono);font-size:9.5px;opacity:.8">${tv(bg, th || 'night')}</span></div>`).join('')}</div>`,
  stat: ['Carry the core', 'Navy, cream, two faces, four radii and one curve travel everywhere. The rest belongs to the Services page.'] }),
page({ z: 1.15, title: 'One language, other surfaces.', intro: 'This chapter is guidance drawn from the Services page. None of these surfaces has been built with the system yet. Treat each row as a starting brief, and record here what proves right when it is built.', cols: 'c84',
  body: `${table(['Surface', 'Light', 'Carry over', 'Adapt'], [
      ['Other pages of the site', 'Night or day, as the visitor chooses', 'Everything. They live beside the Services page and take the same token block and components.', 'Only the order of bands. Keep the alternation of grounds.'],
      ['Data tools and trackers', 'Day for dense tables and long sessions', 'Fira Sans for all interface and numbers, with tabular numerals. Hairlines instead of boxes. Pills for controls.', 'Newsreader only for page titles and headline figures. Series colours from the practice tints, steel for neutral series, the accent for the selected series only.'],
      ['Reports and PDFs', 'Day: cream or white paper, navy ink', 'Newsreader headings, Fira Sans text, sentence headings, the rose line once on a cover, 6 px corners on pictures.', 'Sizes by ratio, not pixels: text 10 to 11 pt, section heading about twice that, title about three times. No grain.'],
      ['Slides', 'Night for title and section slides, day for content', 'Two-part headings, figures in the serif, one cream element per slide as the point of focus.', 'Nothing smaller than 24 pt. One idea per slide.'],
      ['Social cards', 'Night', 'A serif headline with one italic phrase, the logo in its night colours, one figure or one map.', 'Never a collage. Never more than one accent.'],
      ['Email and office documents', 'Day', 'The colours as they are.', 'Where the fonts cannot load, the fallbacks in the token file: Iowan Old Style or Times New Roman, and the system sans.']])}
    <div class="stack lg"><div class="stack">${k('The portable core')}${table(['', 'Hex', 'RGB'], [['Navy', '--n950', 'night'], ['Cream', '--cream', 'night'], ['Type on navy', '--text', 'night'], ['Rose', '--rose', 'night'], ['Day paper', '--c-bg', 'day'], ['Day ink', '--text', 'day'], ['Deep blue', '--c-blue', 'day']].map(([n, t, th]) => { const c = rgba(tv(t, th), th); return [dot(tv(t, th)) + n, `<code>${hex(c)}</code>`, c.slice(0, 3).map(Math.round).join(' ')]; }), 'tight')}</div>
      <div class="stack">${k('Not defined yet')}${rules(['Print values (CMYK, Pantone) and paper stock.', 'A sequential colour ramp for charts and maps beyond the block map.', 'Motion for video.'], 'no')}</div></div>` }),

/* ============ 11 upkeep ============ */
opener({ n: '11', title: 'Upkeep', about: 'Changing a value, what lives where, status, open questions', list: ['Changing a value', 'What lives where', 'Status', 'Open questions'],
  panel: `<pre style="align-self:stretch;justify-self:stretch;margin:0;padding:26px 28px;font-family:var(--mono);font-size:8.7px;line-height:1.8;color:${N('--mist')};white-space:pre;overflow:hidden">${B.esc(S.raw.split('\n').slice(8, 44).join('\n'))}</pre>`,
  stat: ['One file', 'Colours, type sizes, radii, spacing and timing are changed in the token file. One command carries them to the page and reprints this book.'] }),
page({ z: 1.15, title: 'How a change is made.', intro: 'The values this book records are not typed into the page. They are kept in one short file, and a build step copies them into the page and reprints the book, so a small change is small work.',
  body: `<div class="steps">${[['Say it plainly', '"Make the cream warmer." "Round the cards less." No code is needed to ask. To compare first, it becomes a switch in the testing ground.'], ['Change the token', 'The value is edited once, in <code>design-system/tokens.css</code>. A day value is changed with its night value.'], ['Run the build', '<code>node design-system/build.mjs</code> copies the tokens into every page in <code>site/</code> and reprints this PDF.'], ['Check and publish', 'Look at the page in its four states, then republish. The page and the book now agree again.']].map((s, i) => `<div><span class="num">0${i + 1}</span><b>${s[0]}</b><p>${s[1]}</p></div>`).join('')}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
      <div class="stack">${k('A request, and the token it changes')}${table(['Asked for', 'Token'], [['A warmer or cooler cream', tok('--cream') + ', and by day ' + tok('--c-bg') + ', ' + tok('--c-raise')], ['A darker or lighter navy', tok('--n950') + ' to ' + tok('--n600')], ['A different heading face', tok('--serif') + ', and the font link in the page'], ['Larger section headings', tok('--fs-h2')], ['Larger body text', tok('--fs-body')], ['Rounder or squarer cards', tok('--r-card')], ['More air between sections', tok('--sec-y')], ['A slower or faster arrival', tok('--t-reveal') + ', ' + tok('--rise')], ['A wider or narrower page', tok('--wrap')], ['Taller buttons', tok('--h-btn')]], 'tight')}</div>
      <div class="stack">${k('What lives where')}${table(['File', 'Holds'], [['<code>DESIGN.md</code>', 'The rules in plain text, and a map of the page\'s stylesheet. Where a person or an AI assistant starts.'], ['<code>design-system/tokens.css</code>', 'Every shared value. The source of truth.'], ['<code>design-system/build.mjs</code>', 'Copies the tokens into the pages and prints this book.'], ['<code>design-system/src/</code>', 'This book\'s own pages.'], ['<code>site/index.html</code>', 'The page. Its components are styled in its own stylesheet, in named sections.'], ['<code>testing-ground/</code>', 'Ideas tried as switches on top of the real page, and compared, before any is made real.']], 'tight')}
        <p class="s">Not in the token file yet: the small text sizes, paddings inside components and a few one-off tints. Those are changed in the page\'s stylesheet, in the section named in <code>DESIGN.md</code>.</p></div></div>` }),
page({ z: 1.2, title: 'Status.', intro: 'What is fixed, what is recorded as built but may still move, and what is undecided. This page is the first to update when a decision is made.', cols: 'cols-3',
  body: `<div class="stack">${k('Settled')}<h3 class="t">One site, one direction.</h3>${rules(['Deep navy, cream as the accent, Newsreader with Fira Sans, the block map in the hero. Settled by the owner on 6 October 2026.', 'English and Arabic, night and day, in one page.', 'Only real facts about the firm.'])}</div>
    <div class="stack">${k('Draft: recorded as built')}<h3 class="t">May change before the system is final.</h3>${rules(['The names and grouping of the tokens.', 'The small text scale: eleven sizes within four pixels, to be reduced.', 'The day theme\'s grounds.', 'The film grain over the page.', 'Chapter 10: guidance for surfaces that have not been built.'])}</div>
    <div class="stack">${k('Open')}<h3 class="t">Undecided, or waiting on something.</h3>${rules(['A round of feedback from 9 October 2026 is being tried on a separate test page and is not part of this system until decided: colours nearer the logo\'s, Georgia or Arial as faces, a near-white day theme, less animation.', 'Two of the six figures in the figures row are stand-ins until the real numbers arrive.', 'The Arabic copy is a draft awaiting review.', 'Fonts and scripts load from public servers in the dry run and are to be hosted with the site before launch.', 'The map shows 2011 population. A GDP series is wanted, and no governorate source has been found.'], 'no')}
      <div class="stack" style="margin-top:6px">${k('Changes')}${table(['Version', 'Date', 'What'], [['0.2', '12 October 2026', 'Sky, map, lattice, pale inks and shade became tokens, with no visual change, so ideas can be tried as switches.'], ['0.1', '12 October 2026', 'First record, taken from the Services page. The page was wired to the token file with no visual change.']], 'tight')}</div></div>` }),

/* ============ appendix ============ */
(() => { const row = (t, th) => { const colour = /^#|^rgb/.test(t.value); const dv = S.map.day[t.name], nv = S.map.night[t.name];
      return [tok(t.name), nv ? (colour ? dot(nv.value) : '') + `<span style="font-family:var(--mono);font-size:8.8px">${nv.value.replace(/"/g, '')}</span>` : '', dv ? (/^#|^rgb/.test(dv.value) ? dot(dv.value) : '') + `<span style="font-family:var(--mono);font-size:8.8px">${dv.value}</span>` : '<span class="dim">same</span>', (nv || dv).note || (dv && dv.note) || '']; };
    const all = [...S.tokens.night, ...S.tokens.day.filter(t => !S.map.night[t.name])];
    const isColour = t => /^#|^rgb/.test(t.value), col = all.filter(isColour), rest = all.filter(t => !isColour(t));
    const H = ['Token', 'Night', 'Day', 'Note'];
    // as many sheets as the list needs: two columns a sheet, "per" rows a column
    const sheets = (list, per, title, intro, footName, first) => { const out = [];
      for (let i = 0; i < list.length; i += per * 2) { const part = list.slice(i, i + per * 2), mid = Math.ceil(part.length / 2);
        out.push(`<section class="pg" ${first && !i ? 'data-ch="A"' : ''} data-theme="light">${bar('Appendix')}<div class="hd"><h2>${title}${i ? ', continued' : ''}.</h2><p>${intro}</p></div><div class="bd cols-2" style="font-size:9.4px">${table(H, part.slice(0, mid).map(row), 'tight')}${table(H, part.slice(mid).map(row), 'tight')}</div>${foot('Appendix', footName)}</section>`); }
      return out.join(''); };
    S.chapters.push({ n: 'A', name: 'Token index', about: 'Every value in the token file' });
    return sheets(col, 19, 'Token index: colour', 'Every colour in the token file, printed from the file itself. Where the day column says "same", the night value holds in both themes.', 'Tokens, colour', true)
      + sheets(rest, 17, 'Token index: type, shape, layout, motion', 'The remaining tokens. Fluid sizes are written as the page uses them: a smallest size, a rate of growth with the screen, and a largest size.', 'Tokens, other');
  })(),
  ];
};
