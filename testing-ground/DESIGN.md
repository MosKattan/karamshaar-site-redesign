# Karam Shaar Advisory design system

Draft 0.1, 12 October 2026. Recorded from the Services page (`site/index.html`). Not final: section 9 lists what is open.

This file is the design system in text, for people and for AI assistants. The same content, with swatches and live specimens, is in `design-system/Karam-Shaar-Design-System.pdf`.

## 1. Changing something (read this first)

Most small changes are one value in one short file.

1. Find the token in `design-system/tokens.css` (about 100 lines, grouped and commented). Section 3 below lists them.
2. Change the value. If it is a colour, change its day value in the `[data-theme="light"]` block in the same edit.
3. Run `node design-system/build.mjs`. It copies the tokens into every page in `site/` (between the `DS:TOKENS:START` and `DS:TOKENS:END` marks) and reprints the PDF. `--no-pdf` copies the tokens only and takes a second.
4. Check the page in its four states (English and Arabic, night and day), then republish, as `CLAUDE.md` says.

Never edit the token block inside `site/index.html`: the next build overwrites it. `node design-system/build.mjs --check` says whether a page and the token file have drifted apart.

**You do not need to read all of `site/index.html` to make a design change.** For a token, read `tokens.css`. For a component, search the page for its section comment (section 6) and read only that part.

| Asked for | Change |
| --- | --- |
| Warmer or cooler cream | `--cream`; by day `--c-bg`, `--c-raise` |
| Darker or lighter navy | `--n950` to `--n600` |
| A different heading or body face | `--serif` or `--sans`, **and** the Google Fonts `<link>` at the top of the page |
| Larger or smaller headings | `--fs-h2`, `--fs-hero`, `--fs-h3`, `--fs-card-title` |
| Larger body text | `--fs-body` (phones: `--fs-body-sm`) |
| Rounder or squarer cards | `--r-card` |
| More or less air between sections | `--sec-y`, `--sec-head` |
| Slower or faster arrival | `--t-reveal`, `--rise` |
| A wider or narrower page | `--wrap` |
| Taller or shorter buttons | `--h-btn`, `--h-btn-sm` |

## 2. Principles

1. **Evidence leads.** Data is the picture: the block map, the figures row, the firm's own covers. No stock photographs, no decorative illustration.
2. **One field, one accent.** Navy carries the page. Cream is the only accent and means "can be pressed" or "is selected". Rose appears once, as the line under the headline's key words.
3. **Editorial, not promotional.** Serif headings written as sentences that end in a full stop. No small label above a heading, no coloured stripe down a card's side, no card inside a card.
4. **Motion that settles.** One spring with no bounce. Things arrive once and stay. Everything has a reduced-motion form.
5. **Two scripts, two lights.** English and Arabic, night and day are four equal states. A change is finished when it is right in all four.
6. **Only what is true.** Rates, clients, counts and registration numbers come from the live karamshaar.com. Nothing is invented.

Hierarchy, in order: headline (one per page) > figure > section heading (second sentence dimmed) > card heading > body > meta. Ink strength: `--text` > `--lit` > `--muted` > `--faint`. Depth comes from lighter surfaces, not shadow. Actions: solid cream pill (one per view) > outlined pill > arrow link > plain link.

## 3. Tokens (`design-system/tokens.css`)

Values live in the file. This is the map of names and roles.

- **Navy ramp** (night surfaces, dark to light): `--ink` page edge and footer, `--n950` page ground, `--n900` raised band and menus, `--n850` card, `--n800` lifted card, `--n700` hover and focus on cream, `--n600` inquiry band, `--n500` reserved.
- **Cool tints**: `--steel-2` meta, `--mist` tags, `--steel` reserved.
- **Cream, the accent**: `--cream` primary action and selected state, `--cream-hi` its hover, `--sand` brass for figure units, `--field` text field on a cream card, `--cream-2` reserved.
- **Fixed small roles**: `--rose` the headline underline only. `--lilac` `--peri` `--sage` `--ochre` one tint per practice area. `--pcard-1` to `--pcard-4` the practice card grounds.
- **Ink and rules**: `--text`, `--lit`, `--muted`, `--faint`, `--line` (every hairline).
- **On cream surfaces** (same in both themes): `--ink-blue` meta and icons, `--err`, `--err-ink`.
- **Logo**: `--logo-bar`, `--logo-ink`, `--logo-tag`.
- **Day theme only**: `--c-raise` cards and bands, `--c-tint`, `--c-bg` page ground, `--c-deep` edge and alternate band, `--c-sand` reserved, `--c-blue` ink and action, `--c-blue-2`, `--c-blue-ink`. The day block also re-values `--text`, `--muted`, `--faint`, `--lit`, `--line`, `--steel-2`, `--mist`, `--rose`, the four tints, the four `--pcard`s and the logo.
- **Type**: `--serif` Newsreader (headings, figures, the reading passage), `--sans` Fira Sans (everything else), `--arabic` Cairo (both roles in Arabic). Sizes: `--fs-h1`, `--fs-hero`, `--fs-h2`, `--fs-h3`, `--fs-card-title`, `--fs-statement`, `--fs-signoff`, `--fs-figure`, `--fs-price`, `--fs-lede`, `--fs-sub`, `--fs-body`, `--fs-body-sm`.
- **Shape**: `--r-card` 20, `--r-in` 12, `--r-pill`, `--r-cover` 6.
- **Layout**: `--wrap` content column, `--gap` between cards, `--sec-y` section space, `--sec-head` space under a section heading, `--h-btn`, `--h-btn-sm`.
- **Motion**: `--spring`, `--ease`, `--t-reveal`, `--t-ui`, `--rise`.

**Not in the token file yet** (change these in the page's stylesheet): the small text sizes (eleven sizes from 11.5 to 15.2 px), paddings inside components, each band's gradient, the clients wall colours (`--wall-*` on `.wall`), and the map's colours (the `dark` and `light` palettes in the map script, search `brass:`). The page's `<meta name="theme-color">` repeats `--n950` by hand.

## 4. Rules

**Colour.** Cream is the only accent. Rose is a line, never type or a button. A practice tint marks only its own area. Cream surfaces keep navy ink in both themes. By day, deep blue owns the featured rate and the inquiry band, and inside them type takes its night values back. Neighbouring bands never share a ground. Every new colour needs its day value in the same change.

**Type.** Headings: Newsreader 400, sentence case, full stop. Emphasis inside a heading is italic 400 (the only italic weight loaded). Two-part headings put the second sentence in `.dim` on its own line. Body: Fira Sans 400, line height 1.6. Pressable things and meta: 500. Form labels and footer heads: 600. Headings wrap balanced, paragraphs wrap pretty, paragraphs stay within 26 to 34 em. Numbers in the serif use lining numerals, data readouts use tabular numerals.

**Arabic.** Cairo for everything, tracking zero, no italic: emphasis is weight 600 (cream inside section headings). Headings 600 at line height 1.3 to 1.35, body 1.85. Digits stay Western, email fields stay left to right, the logo keeps its Latin wordmark. Layout, arrows, decoration and the hero sky mirror; the map does not. New English copy needs its entry in the `AR` table in the same change.

**Shape.** Anything pressable is a pill. Cards 20 px, inputs 12 px, covers 6 px. One hairline, 1 px `--line`. Pills are outlined with an inset 1 px ring, not a border. Three shadows only (stacked practice cards, phone menu, covers).

**Layout.** Content on one column, at most `--wrap` wide, 24 px side margins (16 on phones). Bands run edge to edge with `--sec-y` above and below. Breakpoints: 1100 px (nav becomes a menu, hero stacks) and 767 px (phones: body 16 px, single column, 44 px touch targets). The clients wall has its own steps at 1340, 1250 and 1179.

**Motion.** `--spring` for movement, `--ease` for colour. Arrival: rise `--rise` and fade over `--t-reveal`, siblings 0.1 s apart, once. Only transform and opacity animate. Nothing loops for attention; ambient canvases stop off screen. Under reduced motion: fades only, no smooth scroll, no hover movement, figures and underline shown complete.

**Access.** Focus ring 2 px, 3 px offset (cream at night, deep blue by day, navy on the cream form). Skip link first. Map operable by arrow keys with a live region. Toggles use `aria-pressed`, chips are a radio group, errors are tied to their field. Body and supporting type meet AA on every ground (ratios are printed in the PDF, chapter 02).

## 5. The page, band by band

Hero (sky gradient, block map) > Figures (`--n900` / `--c-raise`) > Statement (`--n950` / `--c-bg`) > Practice areas (four stacking cards) > Formats (`--n900` / `--c-deep`, bento grid) > Clients wall > Rates > Proof (covers) > Inquiry (`--n600` to `--n800` / deep blue, cream form card) > Footer (`--ink` / `--c-deep`).

## 6. Components and where their styles are

Each has a section in the stylesheet of `site/index.html`, headed `/* ---------- name ---------- */`. Search for the header and read that section only.

| Component | Classes | Section header |
| --- | --- | --- |
| Buttons, arrow link | `.btn` `.btn-cream` `.btn-ghost` `.btn-navy` `.btn-sm` `.link-arrow` | `buttons` |
| Icons (Phosphor masks) | `.ph` `.ph-name` | `icons` |
| Arrival | `.rv`, `[data-stagger]` | `reveal` |
| Nav bar, phone menu, skip link | `.nav` `.nav-links` `.lang` `.theme` `.menu` `.mnav` `.skip` | `nav` |
| Hero, headline underline, lede | `.hero` `.hero-copy` `.uline` `.lede` | `hero` |
| Hero email field | `.starter` `.starter-row` | `Impeccable pass` |
| Block map, callout, readout, small toggle | `.iso` `.iso-call` `.map-readout` `.seg-sm` | `block map` |
| Figures row | `.figures` `.stats` `.stat` `.reel` | `figures` |
| Reading passage | `.statement` | `statement` |
| Section heading | `.sec-head`, `h2 .dim` | `practice` and `type` |
| Practice cards | `.pcard` `.pcard-geo` `.g1` to `.g4` | `practice` |
| Format cards (bento) | `.bento` `.bcard` `.b-a` to `.b-f` `.tags` `.bmeta` | `formats` |
| Clients wall | `.wall` `.wcol` `.wcell` `.wmark` | `clients wall` |
| Rates, toggle | `.rates` `.seg` `.rate-feature` `.rate-row` | `rates` |
| Covers | `.proof` `.covers` `.cover` | `proof` |
| Inquiry form, chips, fields | `.inquiry` `.panel` `.form` `.chip` `.field` | `inquiry` |
| Footer | `.foot` `.signoff` `.foot-grid` | `footer` |
| Phone and tablet rules | | `responsive` |
| Arabic layer | `html[dir=rtl] ...` | `Arabic (RTL) layer` |
| Day theme rules | `[data-theme="light"] ...` | `Light theme` |

Scripts, in page order: language (the `AR` table), main (theme, menu, reveals, figures, clients wall, rates, forms), ambient lattice, block map (Three.js).

## 7. Other platforms

Guidance only, not yet built: see chapter 10 of the PDF. The portable core is navy `--n950`, cream `--cream`, the two faces plus Cairo, the four radii and the one spring. Further pages of the site go in `site/`, carry the `DS:TOKENS` marks so the build fills them, and reuse the components above.

## 8. Files

| File | What it is |
| --- | --- |
| `DESIGN.md` | This file. |
| `design-system/tokens.css` | Every shared value. The source of truth. |
| `design-system/build.mjs` | Copies tokens into `site/*.html` and prints the PDF. Flags: `--no-pdf`, `--check`, `--no-shots`, `--serve`. |
| `design-system/Karam-Shaar-Design-System.pdf` | The book. Rebuilt by the build, never edited by hand. |
| `design-system/src/` | The book's source: `book.html`, `book.css`, `book.js` (tools), `pages.js` (the pages and their wording). |
| `design-system/.cache/` | Page pictures taken for the book. Not synced. |

The book reads `tokens.css` and `site/index.html` as it prints: swatches, size tables, contrast ratios and component specimens are live. The reasoning and the component measurements are typed in `pages.js`, so when a component's measurements change, update its lines there (and the PDF's version line in `book.js`).

## 9. Status

- **Settled** (owner, 6 October 2026): one site and one direction. Navy, cream accent, Newsreader with Fira Sans, block-map hero, four states in one page, real facts only.
- **Draft, recorded as built**: token names and groups, the small text scale, the day theme's grounds, the film grain, the platform guidance.
- **Open**: the 9 October feedback round being tried in `site/test.html` (colours nearer the logo's, Georgia or Arial, a near-white day theme, less animation) is not part of this system until the owner decides. Two of the six figures are stand-ins. The Arabic copy awaits review. Fonts and scripts are to be self-hosted before launch. No print (CMYK) values are defined.

Changes: 0.1, 12 October 2026, first record. The page was wired to the token file with no visual change (every computed style compared before and after, in all four states at three screen widths).
