# Karam Shaar Advisory website redesign

There is **one** website in this project and **one** design direction. The owner settled on it on 2026-10-06. When he says "the website", "the page", "the site" or "the artifact", he means this, with no need to ask which version.

## The site

- **File:** `site/index.html` (single file, vanilla HTML, CSS and JS). Its images are in `site/assets/`.
- **What it is:** the Services page of karamshaar.com, redesigned. Deep navy, Newsreader + Fira Sans, isometric block map of Syria in the hero.
- **Published copy:** https://claude.ai/artifact/TjipzwFKm2sFmF23NnfgR2 ("Services | Karam Shaar Advisory"). This is the only artifact that matters.
- **Preview:** launch config `site`, port 5179.

That one file already holds every variant. Do not make a second folder or a second file for any of them:

| Variant | How it works | Open it directly with |
| --- | --- | --- |
| English | the markup itself | default |
| Arabic (right to left) | the `AR` table in the "Language" script, keyed by the English string | `?lang=ar` |
| Dark | default | default |
| Light | `html[data-theme="light"]` rules | `?theme=light` |

Both switches are also buttons in the nav. So every change has four states to check: English dark, English light, Arabic dark, Arabic light.

## Design system (draft, since 2026-10-12)

The design is written down, and its shared values live in one file. Start here for any design change instead of reading the whole page.

- **`DESIGN.md`** (project root): the rules in text, the list of tokens, and a table of every component with the stylesheet section that styles it. Read it before a design change.
- **`design-system/tokens.css`**: every shared value (night and day colours, type sizes, radii, spacing, timing). The source of truth. The `:root` and day-theme token blocks in `site/index.html` are a generated copy between the `DS:TOKENS:START` and `DS:TOKENS:END` marks: never edit that copy.
- **Colours as "r,g,b".** Where the page needs one colour at several strengths it writes `rgba(var(--cream-rgb),.3)`. The build works out every `--name-rgb` a page asks for from `tokens.css` and adds them to the generated block (`design-system/lib.mjs`): never type them, just use them.
- **`node design-system/build.mjs`**: copies the tokens into every page in `site/` and reprints `design-system/Karam-Shaar-Design-System.pdf` (40 pages, for the owner and colleagues). `--no-pdf` copies the tokens only. `--check` reports drift without changing anything.
- To change a colour, a size, a radius, spacing or timing: edit `tokens.css`, run the build, check the four states, then commit and republish as usual. To change a component: find its section through the table in `DESIGN.md` and read only that section.
- The PDF's wording and component measurements are typed in `design-system/src/pages.js`. When a change makes a sentence or a measurement there untrue, update it in the same change and rebuild.
- The system is a draft. `DESIGN.md` section 9 lists what is settled and what is open. The owner does not need a separate artifact for it: the PDF is the deliverable.
- `site/test.html` has no token marks and is not touched by the build.

## Testing ground (switches, since 2026-10-12)

Where the owner tries ideas and compares them before any of them reaches the real site. It is not a copy of the site: it is today's real site with experiments layered on as switches, so it cannot drift and any mix can be shown.

- **An experiment is one file:** `testing-ground/experiments/<id>.css`. Plain CSS with a first comment (`name:`, `about:`) and three kinds of block: `& { --token:value }` (night values, as in `tokens.css`), `&[data-theme="light"] { --token:value }` (day values), and ordinary rules or `@media` blocks (start a selector with `&` to mean the page root, e.g. `&[data-theme="light"] .inquiry`). Prefer token values; add rules only for what tokens cannot say. The header of `tools/ground.mjs` has the format.
- **Typefaces in an experiment.** A face the real page does not load is named in the experiment's first comment on its own line, as a Google Fonts stylesheet address (`fonts: https://fonts.googleapis.com/css2?family=...`): the build adds the link, and `promote` adds it to the real page. Only Google Fonts load in the published copy, so a paid face (Season, Lust Text) is shown through a free look-alike, and the owner is told which. A font file of our own lives in `testing-ground/assets/fonts/` and is declared in its experiment with a plain `@font-face` block (`src:url(assets/fonts/name.woff2)`): the build lifts the block out of the switch, `promote` moves the file into `site/assets/fonts/`, and the file goes in `files` when publishing the testing-ground artifact (`node tools/ground.mjs build` lists it). `KS Hybrid` (a sans with serif italic letters woven in, after the paid Dessign Maison) is such a file, built by `tools/make-hybrid-font.py` from Inter Tight and Playfair Display Italic, both open-licensed; the script's header says what it needs and how its automatic italics work. Never copy or trace a paid font. Arabic keeps Cairo: the build restates the page's Arabic swap for any type token a switch sets, and every other type rule (weights, tracking, line heights, italics, capitals) is written under `&:not([dir=rtl])`.
- **A look is a named mix of experiments:** `testing-ground/looks.json`. Give the owner a look for each combination he wants to compare (letters A, B, C… with a plain description).
- **Published copy:** https://claude.ai/artifact/RMfUvHkYMZkyXJ7t3WFVW7 ("Services (testing ground)", private). It has a red "Testing ground" tab in the corner that opens a panel: looks, a switch per experiment, "hold to see the real site" (also the C key), keys 0 to 9 for looks. To republish: `node tools/ground.mjs build`, then publish `testing-ground/build/index.html` to that URL (images in `files` only if they changed). Republish after every change to an experiment or look, **and after every change to the real site**, since the testing ground is built from it.
- **Preview:** launch config `ground`, port 5181 (rebuilt on every load). `?x=id,id` opens with those switches on, alongside `?theme=` and `?lang=`: `PORT=5181 node tools/shoot.mjs name 1440 900 auto "?x=corners-8px&theme=light"`.
- **Commands** (`node tools/ground.mjs ...`): `list` (experiments, what each touches, clashes, looks), `build`, `serve`, `compare` (pictures every look side by side, night and day, into `testing-ground/build/Compare.pdf`: send it to him with SendUserFile when he asks to compare), `book "<look>"` (the design system PDF as it would be with that look), `promote <id or look>...`.
- **Which one to edit.** "The website", "the page", "the site", "the artifact", "main" and "the real site" mean `site/` and its artifact. Work in the testing ground when he says "testing ground", "try", "test", "experiment", "compare" or "let me see how it would look". Never change `site/` or `design-system/tokens.css` as part of an experiment. If a request could mean either, ask one plain question.
- **Making it real.** Only when he says so ("push it to main", "make it real"), and only the experiments he names: `node tools/ground.mjs promote corners-8px` or `promote "B"`. It writes their token values into `tokens.css`, appends their rules to the page's stylesheet under a dated comment (prefixed `html:root` so they win exactly where they won as switches), deletes those experiment files, trims the looks, and rebuilds. Then, as for any change to the site: check the four states, bring `DESIGN.md` and `design-system/src/pages.js` in line with what is now true, commit, republish both artifacts. Experiments not named stay in the testing ground.
- **What a switch cannot do.** It restyles: colour, type, size, spacing, corners, how a component looks. A change to markup, copy or scripts cannot be a switch. For one of those, say so, and offer to make it on the real site directly (git history is the undo) or to describe it first.
- **Colours a switch can reach.** Most colours in the page come from tokens, including the hero sky (`--sky-*`, `--haze-*`), the map (`--map-*`), the lattice and the pale inks (`--ice-*`, `--tint`). A few one-off tints are still written in the page's stylesheet: when an experiment needs one, override that rule in the experiment file.
- The same care applies (day value for every colour, check all four states and a phone), since any switch may be promoted. `testing-ground/build/` is generated and not synced.
- **It is not the "test version" below.** `site/test.html` is the older, separate page made for the colleagues' feedback, with its own artifact.

## Test version (temporary, since 2026-10-09)

On 2026-10-09 the owner asked for a test version, to try feedback from two colleagues: stronger colours taken from the logo, Georgia and Arial, a white light theme, faster loading. It is the one exception to rule 4, made at his request.

- **File:** `site/test.html`. A copy of `site/index.html`: the same stylesheet followed by one block headed "TEST VERSION overrides", and script changes marked "test version" in comments. It opens in the light version (`?theme=dark` for dark, `?lang=ar` for Arabic, `?map=flat` for the flat map).
- **Published copy:** https://claude.ai/artifact/GNBoMic7zoyaqtAQuvKdxo ("Karam Shaar Services (test)"). Republish it to that URL after every change to `site/test.html`, with the same care as the main artifact (images go in `files`).
- **It is not "the site".** "The website", "the page" and "the artifact" still mean `site/index.html` and its artifact. Do not copy the test's changes into `index.html`, and do not make any further test files, unless the owner asks.
- When the owner decides, either the test's changes move into `index.html` and `test.html` is deleted, or `test.html` is simply deleted. Then remove this section.

## Rules

1. **Edit only `site/`, `design-system/` and `testing-ground/`** (plus `DESIGN.md`). Everything in `_archive/` is a retired direction, kept for the record. Do not read it for guidance, do not edit it, do not copy from it, and do not suggest going back to it unless the owner asks by name.
2. **New or changed English copy needs its Arabic entry** in the `AR` table, in the same change. Anything that depends on left or right needs an `html[dir=rtl]` rule or an `rtl()` branch.
3. **New or changed colours need their light theme counterpart**: a token in `design-system/tokens.css` gets its day value in the `[data-theme="light"]` block there, a one-off colour in the page gets its rule under `html[data-theme="light"]`.
4. **Work on `main` only.** No new branches, no new version folders, no "v2" copies. To try an idea, add it to the testing ground as a switch; git history is the undo.
5. **Only real facts** about the firm (rates, clients, registration numbers come from the live karamshaar.com). Never invent figures.
6. If more pages are added later (home, publications, about), they go inside `site/` as further files and reuse the same tokens and components: give the new page's stylesheet the two `DS:TOKENS` marks and the build fills them.

## Working here

- The owner is not a programmer. Explain results in plain language and keep git mechanics out of his way. Syncing with GitHub is automatic (hooks run `tools/git-sync.mjs`).
- Screenshots: `node tools/shoot.mjs <prefix> <width> <height> auto [path such as "?lang=ar&theme=light"]` with the `site` preview running. Output goes to `tools/shots/` (not synced).
- Republishing the artifact: the published page is `site/index.html` exactly as it is (since 2026-10-06 the icons are drawn in the page's own stylesheet, so there is no icon block to swap in any more). Read the artifact first to see nobody else changed it, then publish the file to the same URL. A new icon needs its drawing added as a `.ph-name` rule in the "icons" part of the stylesheet.
- **Always keep both up to date (standing rule, owner's instruction 2026-10-06):** after every change to `site/`, republish the artifact to the same URL and make sure the change is committed and pushed to GitHub, without waiting to be asked. Before ending a turn that changed `site/`, confirm `git status` is clean and the artifact is current, and tell the owner in plain words that both are done.
