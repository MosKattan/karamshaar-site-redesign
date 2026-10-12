# Testing ground

Ideas are tried here as switches on top of the real site, compared, and only then made real.

- **To look:** the testing-ground link (or `node tools/ground.mjs serve`, then http://localhost:5181). The red tab in the corner opens the panel: looks, switches, hold to see the real site.
- **To compare on paper:** `node tools/ground.mjs compare` writes `build/Compare.pdf`, every look side by side in night and day.
- **To make one real:** `node tools/ground.mjs promote <experiment or look>`.

| File | What it is |
| --- | --- |
| `experiments/<id>.css` | One experiment: token values and, where needed, extra rules. The format is at the top of `tools/ground.mjs`. |
| `looks.json` | Named mixes of experiments. |
| `panel.html` | The panel added to the testing-ground page. |
| `build/` | Generated: the switchable page, comparison sheets, books. Not synced. |

The page is always today's real site with the experiments layered on, so there is nothing to keep in step.
