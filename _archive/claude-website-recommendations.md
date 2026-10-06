# Building professional, non-"AI-looking" websites with Claude — recommendations

Sources: YouTube video 86HM0RUWhCk (Claude Code workflow) + academy.claude.com "Create a custom webpage" (Claude web/artifact workflow).

## 1. Pick your workflow
- **Claude (web) + artifacts** — easiest, no setup. Describe the page, upload files, preview in browser, deploy via the Netlify connector. Best for portfolios and simple pages.
- **Claude Code in VS Code** — more control; local files, screenshot loop, GitHub + Vercel auto-deploy. Best for multi-section sites you'll iterate on. Needs a paid plan (Pro to start, Max if you hit limits).

## 2. Prepare inputs before prompting
1. Resume/PDF and 3–5 detailed project descriptions (for portfolios).
2. Logo and brand guidelines (colors, typography, icons) in a `brand_assets` folder; tag them with `@`.
3. Design inspiration: screenshots of sites you admire (Dribbble, Godly, Awwwards) or code snippets.
4. Real copy and facts. Without them Claude invents placeholder text and stats.

## 3. Write a strong prompt
- State the goal, audience, design philosophy and deployment need up front.
- Frame Claude as an expert and name a quality bar (e.g. "top-tier consulting report").
- Say what to avoid (e.g. "no generic corporate blue").
- Expect iteration; the first output is a draft.

## 4. Set up the project (Claude Code)
1. Create a **CLAUDE.md** — short, standing rules: always use the front-end design skill, where brand assets live, screenshot workflow, "test on localhost, don't push until I say so", screenshot naming convention. Update it as you learn what goes wrong.
2. Install the **front-end design skill** globally (paste the install commands into Claude Code).
3. Set up **Puppeteer** so Claude can screenshot and compare its own output.
4. Consider **plan mode** for big or vague tasks so Claude asks questions first.
5. Bypass-permissions mode speeds things up but lets Claude run any command. Use it only while watching.

## 5. Raise design quality
- **Clone a reference site first**: full-page screenshot (DevTools → Ctrl+Shift+P → "screenshot") plus copied styles from Elements, then ask for a clone and swap in your brand afterwards.
- **Screenshot loop**: let Claude build, screenshot, compare and fix (at least 2 passes). Delete old screenshots between builds.
- **Turn the loop off for animated elements** — it can get stuck over-engineering.
- **Add individual components** from 21st.dev (backgrounds, buttons, shaders): copy the prompt, say where it goes.
- **Package your style into a Skill** (visual references + preferences) to reuse across projects without re-explaining.

## 6. Refine
- Give specific, nitpicky feedback (readability, colors, contrast, size, spacing). Dictating while looking at the page works well.
- Add interactions: card hover shifts/borders, heading fade-ins on scroll, glowing CTAs.
- Expand projects into case studies: problem, research, iterations, challenges, solution, measurable impact.
- Wire up real details: button links, your own images, copy.

## 7. Deploy
- **Easy route**: Claude's Netlify connector pushes the artifact to a live URL.
- **Pro route**: GitHub repo → Vercel (sign in with GitHub, import repo). Every push auto-redeploys.
- Keep working on localhost; push only when you approve.
- Add a custom domain in Vercel/Netlify domain settings (follow the DNS steps).
- **Never push secrets** (API keys, passwords, webhooks) to a public repo; check `.gitignore`.

## 8. Quick checklist
- [ ] CLAUDE.md written
- [ ] Design skill installed
- [ ] Brand assets folder ready
- [ ] Inspiration site/screenshots chosen
- [ ] Real copy and images supplied
- [ ] Screenshot loop configured (and disabled for animations)
- [ ] Mobile view checked
- [ ] Local review approved before pushing
- [ ] Repo clean of secrets
- [ ] Domain connected
