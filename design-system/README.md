# Design system

- **To read it:** open `Karam-Shaar-Design-System.pdf`.
- **To change the design:** edit `tokens.css`, then run `node design-system/build.mjs` from the project folder. The page and the PDF both update.
- **The rules in text:** `../DESIGN.md`.

| File | What it is |
| --- | --- |
| `Karam-Shaar-Design-System.pdf` | The book: principles, colour, type, layout, shape, components, motion, assets, languages, other platforms, upkeep. Rebuilt by the build, never edited by hand. |
| `tokens.css` | Every shared value (colours for night and day, type sizes, radii, spacing, timing). The source of truth. |
| `build.mjs` | Copies `tokens.css` into each page in `site/` and prints the PDF with the Chrome on this machine. |
| `lib.mjs` | The part of that shared with the testing ground: reading tokens, writing a page's token block. |
| `src/` | The book's own pages. `pages.js` holds the wording. |
| `.cache/` | Pictures of the page taken for the book. Re-made on each build, not synced. |

Build options: `--no-pdf` (tokens only, about a second), `--check` (change nothing, report whether pages match the tokens), `--no-shots` (reuse the last page pictures), `--serve` (view the book live in a browser at `localhost:5180/design-system/src/book.html`). While laying out a page of the book, `DS_PAGES=5-9` prints only those sheets and `DS_PREVIEW=5,9` also saves those sheets as pictures in `.cache/`.
