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

## Rules

1. **Edit only `site/`.** Everything in `_archive/` is a retired direction, kept for the record. Do not read it for guidance, do not edit it, do not copy from it, and do not suggest going back to it unless the owner asks by name.
2. **New or changed English copy needs its Arabic entry** in the `AR` table, in the same change. Anything that depends on left or right needs an `html[dir=rtl]` rule or an `rtl()` branch.
3. **New or changed colours need their light theme counterpart** under `html[data-theme="light"]`.
4. **Work on `main` only.** No new branches, no new version folders, no "v2" copies. To try an idea, change `site/index.html`; git history is the undo.
5. **Only real facts** about the firm (rates, clients, registration numbers come from the live karamshaar.com). Never invent figures.
6. If more pages are added later (home, publications, about), they go inside `site/` as further files and reuse the same tokens and components.

## Working here

- The owner is not a programmer. Explain results in plain language and keep git mechanics out of his way. Syncing with GitHub is automatic (hooks run `tools/git-sync.mjs`).
- Screenshots: `node tools/shoot.mjs <prefix> <width> <height> auto [path such as "?lang=ar&theme=light"]` with the `site` preview running. Output goes to `tools/shots/` (not synced).
- Republishing the artifact: the published page is the local file with the Phosphor icon `<link>` replaced by an inlined `<style>` subset. Read the artifact first, lift that block into a scratch copy of `site/index.html`, then publish to the same URL.
- **Always keep both up to date (standing rule, owner's instruction 2026-10-06):** after every change to `site/`, republish the artifact to the same URL and make sure the change is committed and pushed to GitHub, without waiting to be asked. Before ending a turn that changed `site/`, confirm `git status` is clean and the artifact is current, and tell the owner in plain words that both are done.
