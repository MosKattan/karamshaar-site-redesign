# Karam Shaar Advisory website redesign

A redesign of the Services page of karamshaar.com.

- **The site:** [`site/index.html`](site/index.html). One file, with English and Arabic and a dark and a light theme built in (`?lang=ar`, `?theme=light`, or the buttons in the nav).
- **Published preview:** https://claude.ai/artifact/TjipzwFKm2sFmF23NnfgR2
- **The design system:** [`DESIGN.md`](DESIGN.md) in text, [`design-system/Karam-Shaar-Design-System.pdf`](design-system/Karam-Shaar-Design-System.pdf) as a book. Shared values are in `design-system/tokens.css`; `node design-system/build.mjs` applies them to the site and reprints the book.
- **The testing ground:** `testing-ground/`, an exact copy of the site and its design system for experiments. `node tools/ground.mjs status | promote | reset` compares it with the real site, sends its changes to the real site, or makes it a fresh copy again.
- **`_archive/`:** earlier directions, retired. Not in use.
- **`tools/`:** the screenshot script and the GitHub sync script.

All work happens on `main`.
