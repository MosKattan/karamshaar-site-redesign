---
target: services page v1
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 3
target_identity: "file:/home/user/karamshaar-site-redesign/karamshaar-services-impeccable/index.html"
target_fingerprint: "sha256:8aca4b340556a9da41dca5fb142033d47094bdc2a116127c88f2f7e56a1e365f"
target_path: /home/user/karamshaar-site-redesign/karamshaar-services-impeccable/index.html
timestamp: 2026-10-05T06-47-59Z
slug: karamshaar-services-impeccable-index-html
---
# Critique: Services page v1 (karamshaar-services-impeccable/index.html)
Method: dual-agent (A: design review, B: detector + browser). Env limits: unpkg.com and karamshaar.com blocked (Three.js map, Lenis, Phosphor icons, client logos judged from source).

## Design Health Score (21/32, 66%, Acceptable; 7 and 10 n/a on a Persuade surface)
1 Visibility 3 | 2 Real world 3 (MEAL, Enhanced/Basic DD unexplained) | 3 Control 2 (mobile menu dead) | 4 Consistency 2 (services listed 4 ways, arrow icons not links) | 5 Error prevention 2 (preselected chip, eligibility unstated) | 6 Recognition 3 | 7 n/a | 8 Aesthetic 3 (repetition, triangle tic) | 9 Recovery 3 | 10 n/a

## Specificity
Skin authored (CBS governorate map, brochure tints, real covers, brand palette); skeleton is a generic SaaS landing sequence. No person shown for a firm named after one.
Detector: 13 findings, 1 real (italic-serif-display on hero em, L489); 12 false positives (7 cramped-padding, 3 tight-leading on display paras, buried-raster grain, duplicate italic). No overflow, no JS errors. Hero placeholder contrast 4.16:1 at lightest gradient stop.

## Priority Issues
1. [P1] Services described four ways, none match the form chips; 24h policy brief vs 72h analytical brief unexplained; arrow icons on non-links. Fix: one canonical list. clarify, distill.
2. [P1] Mobile menu button has no handler; nav unreachable below 1100px. Fix: real disclosure menu. harden.
3. [P1] No confidentiality / reply time / named person at the inquiry and done panel. Fix: 3-line assurance (facts from client). clarify.
4. [P2] Standard/Non-profit toggle changes 2 of 4 prices, no eligibility. Fix: inline dual prices or "same for all" + eligibility. clarify.
5. [P2] 10 chips, preselected default, no radio semantics, not reset. Fix: no default, 4-5 options, radios. distill.

## Persona red flags
Jordan: Enhanced/Basic DD, MEAL, dead arrows, eligibility. Casey: dead menu, chips 35px, footer 32px, rate link 26px, email 22px, chips push email below fold. Sam: no skip link, map tab stop dead without WebGL, marquee no focus pause.

## Minor
Statement repeats lede; formulaic h2 .dim x4; triangle beam x7; 300% brochure crop illegible; client strip undersized; 2011 hero data; starter overwrites #email.

## Questions
2011 data in hero? Where is Karam Shaar? Work-email capture vs "Request a scope"?
