# Solutions101 — everything a fresh session needs

Read this first. It is the whole project in one file: what it is, where the code
lives, what is broken, and the traps that have each cost a full evening.

---

## 1. What this is

**solutions101.net** — Russian-language landing page for Damir's one-man
custom-software / automation studio. Sells built-to-order internal tools for
Russian businesses.

The page's entire value is its **first screen**: a morphing liquid slogan, a
giant "101", moving light-ribbons and a starfield. That first screen IS the
pitch — it demonstrates the craft the studio sells. Everything below it is
ordinary marketing sections.

**Live:** http://solutions101.net (GitHub Pages, repo `d14life/automation-studio`,
branch `main`, legacy build from repo root, `CNAME` file sets the domain).

**HTTPS does not work.** Certificate stuck in state `new`. Do not touch it
unless Damir asks — a fix attempt on 4 Aug briefly unrouted the domain.

---

## 2. Stack and layout

Vite + React 19 + TypeScript (`verbatimModuleSyntax` — type imports must be
`import type`). Tailwind is installed but used in only ~23 places; the real
styling is **1027 lines of hand-written CSS** in one file.

```
solutions101/
  CNAME                     domain for GitHub Pages — never delete
  index.html                the DEPLOYED page (built output lands here)
  anim3.js  win.js          vendor scripts, loaded from /public copies
  tubes1.min.js             775KB WebGL ribbon library, dynamic import only
  tubes-loop.mp4            filmed ribbons, the mobile fallback
  record-tubes.html         the tool that filmed the clip
  docs/                     catalogue.md, software-types.md, feedback-rainur.md,
                            tools-verdict.md, HANDOFF.md (this file)
  app/                      the Vite project — ALL source edits happen here
    index.html              dev entry + font loading + hero visibility gate
    public/anim3.js         must stay identical to the root anim3.js
    src/
      App.tsx               65 lines — every section and hook, in order
      site.css              1027 lines — the real stylesheet
      components/
        sections/           the page: TopBar, Hero, About, Numbers, Services,
                            Projects, HowItWorks, SelfCheck, Team, RequestForm,
                            Contacts, SiteFooter, AiPanel
        fx/                 Starfield, TubeLayer
        ui/                 21st.dev components, adapted (see §3)
      hooks/                one hook per behaviour, all called from App.tsx
```

### The 21st.dev convention

Everything in `components/ui/` came from **21st.dev** and was adapted to this
project. When Damir feeds a new 21st.dev component, it goes there.

Adapting a 21st.dev drop means, every time:

1. Its Tailwind classes stay; the surrounding page uses `site.css` classes.
   Both work — do not convert one to the other.
2. Replace its palette with the project's: `ICE = ['#DFF6FF','#7FD8FF','#5C82C9']`
   from `hooks/heroTuning.ts`. There is **no violet on this site** — Damir
   removed it explicitly.
3. Strip any `framer-motion` dependency. This project animates with CSS and
   rAF only; adding a motion library for one component is not acceptable.
4. Check what it animates. See trap §5.1 — a component that animates a
   registered `@property` will cost more than every other effect combined.

Current ui/ inventory, biggest first: `sparkles` (437), `border-beam-panel`
(379), `liquid-metal-button` (355), `glowing-shadow` (294), `spotlight-card`
(201), `traveling-beams` (188), `glow-effect` (155),
`interactive-hover-button` (76), `gradient-button` (51), `shiny-button` (35),
`edge-card` (31).

---

## 3. The header / hero — the part being worked on

Four pieces stacked in one viewport:

| Layer | File | What it is |
|---|---|---|
| Starfield | `components/fx/Starfield.tsx` + `useStarfield.ts` | canvas dots, time-based drift, capped |
| Ribbons | `components/fx/TubeLayer.tsx` + `useTubeScene.ts` | three.js tubes — OR a filmed mp4 |
| Header bar | `components/sections/TopBar.tsx` | logo, nav pills with hover hints, burger under 700px |
| Hero | `components/sections/Hero.tsx` | two morph lines, the "101", a sliding switch of two actions |

`Hero.tsx` is only 26 lines. The behaviour is in `useLiquidSlogan.ts` (74) and
the CSS.

### The slogan

```
line 1: АВТОМАТИЗИРУЕМ · БЫСТРО · ТОЛЬКО ПРАКТИКА
line 2: БИЗНЕС-ПРОЦЕССЫ · НЕ ЗНАЧИТ ПЛОХО · НОЛЬ ТЕОРИИ
```

Two `<div class="morph">` hosts (`#liq1`, `#liq2`) driven by `window.LiquidText`
from `anim3.js`. The melt shows **both** phrases simultaneously and fuses them
with a heavy blur plus an SVG alpha threshold. That needs vertical room: at the
desktop's 77px it reads as liquid; at a phone's ~31px it reads as a collision.

Desktop: `morphTime 4.5s`, `cooldownTime 0.45s` — in transition 91% of the time.
Touch: `morphTime 1.6s`, `cooldownTime 2.6s`, plus `simple` (sequential fade,
not a crossfade), `flat` (no background-clip) and a `maxBlur` of half the
measured font size.

### The ribbons — live vs filmed

Damir's own idea and it was the right one: **film the WebGL scene once, play the
clip on machines the live scene hurts.** Video decode runs on dedicated silicon,
not the shader cores.

- Phone/tablet → filmed from the start
- Desktop → live scene, swaps to filmed if `usePerfGuard` measures under 46fps
- `record-tubes.html` is the tool that produced `tubes-loop.mp4`

The ribbons do **not** follow the cursor on this site (switched off long ago),
so the clip is not an approximation — it is the effect.

### usePerfGuard

Waits 2.6s after load, samples 1.8s of real frame rate, and if under 46fps sets
`document.documentElement.dataset.perf = 'low'` and fires a `perf-low` event.
CSS drops expensive blurs from that attribute; both canvas systems listen.
One shot, never upgrades back. Reads back as `window.__perfFps`.

This exists because guessing "phone = weak, desktop = fine" was wrong: it lagged
on Windows desktops with integrated graphics, which neither guess covers.

---

## 4. Current state

### Working and verified live
- Loads in **0.30s**, HTTP 200
- Filmed-ribbon fallback
- Parallax on the hero only — removed from every other section
- Nunito self-hosted, subset to Cyrillic+Latin, 60KB, preloaded; font gate 500ms
- Bundle 424KB (was 457 — liquid-metal shader split out)
- Mobile hero uses the same layout as the Mac hero

### Broken / open
1. **The mobile slogan overlaps.** Six attempted fixes, still wrong on the
   iOS Simulator. **This is the job.** See §6 for where to start — do not ship
   a seventh guess.
2. **HTTPS** — cert stuck. Leave alone.
3. **iPad** — never tested. Three simulators available.
4. **Rainur's feedback** — `docs/feedback-rainur.md`, items 3/4/6 ready to
   implement, two items blocked on Damir's answer. Written down deliberately;
   do not implement unasked.
5. **Projects section** contains invented company names and money figures
   (`Projects.tsx:94-105`). Two of four are labelled «· макет». Damir has
   dismissed this as unimportant for now.

---

## 4b. What is already written down — the 62 offers

If Damir says **"remember those 62 prototypes we made"**, this is what he means.
It is not lost, it is in `docs/` and it is verified.

### `docs/catalogue.md` — 36KB, 582 lines
**60 numbered offers + 2 industry packages = 62.** Recovered verbatim from
commit `90df847` (the first version of the site). Every offer has a title, who
it is for, what it replaces and what it produces.

Grouped as: Сбор данных и интеграции (01–07) · Бухгалтерия и финансы (08–14) ·
and on through to №55 «Обучение, документация и передача» and beyond.
The two packages are **Для юридических фирм** and **Для строительных компаний**.

### `docs/software-types.md` — 38KB, 345 lines
The same 62 sorted into **12 kinds of software**, each offer assigned exactly
once — verified by script, not by eye:

Сборщик · Мост · Конвейер документов · Распознаватель · Рабочее приложение ·
Сторож · Экран правды · Отчёт по расписанию · Собеседник · Предсказатель ·
Публичная витрина · Генератор контента и рассылок

Plus: one offer that does not fit the classification, the two industry
packages, and a proposed **order of work for building the prototypes**.

**Why it matters:** the plan is to build a small number of clickable prototypes
— one per software type, not one per offer — so a visitor can touch a real
example of each kind. Rainur's verdict on the current animated placeholders was
blunt and correct: they are not a demonstration of anything.

### The other two
- `docs/feedback-rainur.md` — his 7 points from 3 Aug, with the exact file and
  line each one touches, and the 2 decisions blocked on Damir.
- `docs/tools-verdict.md` — Figma vs Base44 vs Claude Code, re-verified against
  real documentation and reviews, including the five things stated wrongly the
  first time. Bottom line: the site stays on Claude Code; Base44 is disqualified
  for Russian clients by 152-ФЗ, no Russian data region, and Wix's blocking.

---

## 5. Traps — each of these cost a full evening

### 5.1 Never animate a registered `@property`
An animated custom property declared `inherits:true` makes the browser
re-resolve inherited custom properties for the **whole document every frame**.
One dead rule doing this cost **160 ms/s — half of all main-thread time**.
Style recalc dropped 170 → 28 ms/s when it was deleted, with zero visual change.
`transform` and `opacity` are free by comparison; the compositor handles them.

### 5.2 Bump the anim3 cache version on EVERY change
```ts
// hooks/useVendorScripts.ts
export const VENDOR_SCRIPTS = ['/win.js?v=1', '/anim3.js?v=8'] as const
```
Three consecutive slogan fixes shipped and **none of them ran**, because the
query string was never bumped and Safari served the cached copy. The file's own
comment warned about this and it happened anyway. **Bump it, every time.**

Also: `anim3.js` exists **twice** — repo root and `app/public/`. Edit both.

### 5.3 Test the device predicate before trusting a device fix
`matchMedia('(hover:none)')` and `(pointer:coarse)` both return **false in the
iOS Simulator**, which is mouse-driven. Every phone-path fix was silently
inactive on the exact screen being photographed while it got diagnosed as a
phone bug. Use `isSmallDevice()` from `heroTuning.ts` — it ORs pointer, width
(≤600px) and device memory. **Print which branch actually ran before believing
any device-specific diagnosis.**

### 5.4 iOS drops `background-clip:text` on a blurred layer
The travelling colour is painted as the span's *background* and cut to the
glyphs. Blur that span on iOS and the clip is dropped — the background
**rectangle** paints instead of the letters. That is the grey box Damir
photographed. Touch uses `flat: true`, a plain text colour, instead.

### 5.5 A colour that only looks right over a video must not exist
The clip was filmed near-white and tinted by a `multiply` overlay inside an
isolated group. Correct on paper. On iOS the video under that group never
painted, the multiply had nothing to multiply against, and an **opaque pale-blue
sheet was screened over the entire page**. The colour now lives inside the clip.
Only one blend remains — `screen`, on the `<video>` element itself.

### 5.6 `object-fit: contain`, not `cover`, for the filmed ribbons
The clip is landscape 1280×695; a phone is portrait. `cover` scaled it until it
covered 812px of height, blowing the sweep up to **541px where the live scene
computes 124px**. `contain` fits it to the width, and because the sweep is a
fixed fraction of the frame (0.362 of width), that reproduces the live geometry.

### 5.7 The CSS minifier eats prefixed/unprefixed pairs
It collapses them and keeps only the `-webkit-` version, which then loses to the
base rule. **Write unprefixed only.**

### 5.8 `backdrop-filter` — every function is a separate pass
`backdrop-filter: blur() saturate() brightness()` is three full passes over the
same region. Passes went 52 → 28 by merging and removing.

### 5.9 The preview pane cannot verify motion
It reports `document.hidden === true`, so scroll timelines return null and
screenshots come back black. **Use the iOS Simulator instead** —
`mcp__Claude_Code_iOS_Simulator__control`, `attach` first, then `screenshot`.

---

## 6. Where to start on the slogan bug

Do **not** ship another speculative fix. Six have failed. The last screenshot
contradicts the deployed code, which means the assumption about which code path
runs is wrong. Establish facts in this order:

1. On the simulator, read back the actual values — `isSmallDevice()`,
   whether `simple` reached the library, and `window.__perfFps`. Print them
   into the page or the console; do not infer them.
2. Confirm **which copy of `anim3.js` Safari executed** — check the query
   version actually requested in the network log, not the one in the source.
3. Only when 1 and 2 agree with the source, look at the rendering itself.

If `simple` is on and the fade is sequential, two phrases **cannot** both be
legible at once — so if they are, one of 1 or 2 is lying. That is the crack.

---

## 7. How Damir works

- **English only, TL;DR.** Lead with the answer in one or two lines. Site copy
  and client deliverables stay Russian — the rule is about talking to him.
- **Never claim without evidence.** Run the check, then report. `curl` the live
  bundle and grep for the change; do not assume a push landed.
- **Never build in `/tmp` or a scratchpad** — a full day's work was lost that
  way. Real work goes in `~/solutions101/`.
- **One section at a time.** His instruction, and it is right: finish the
  header, optimise it, then move on. Do not fire fixes at the whole page.
- **Finish one job before starting the next.** New prompts are a queue.
- **Decide technical calls yourself** — fix priority, branch, dispatch. Ask him
  only about pricing, feature names, business strategy.
- **Never automate QA.** His eyes on the result is how taste gets in. Offer 2–3
  options on anything visual.
- Commit early, push often. Commit messages on this repo are a full sentence
  describing what was learned, not a label.
