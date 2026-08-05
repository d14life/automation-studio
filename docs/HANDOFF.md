# Solutions101 — everything a fresh session needs

Read this first. It is the whole project in one file: what it is, where the code
lives, what is broken, and the traps that have each cost a full evening.

---

## 0. THERE ARE TWO PAGES. Know which one you are working on.

This is the single most confusing thing about the repo and it is not obvious from
the file tree.

| | `index.html` — the OLD page | `v2.html` — the NEW page |
|---|---|---|
| source | `app/src/` (App, Projects, `anim3.js`…) | `app/src/v2/` — `V2.tsx` + `v2.css`, two files |
| the hero | morphing liquid slogan, giant "101", WebGL ribbons, starfield | a scroll-scrubbed 3D DNA video |
| styling | Tailwind + `index.css` | its own `v2.css`. **Deliberately does not load Tailwind** |
| status | live, feature-complete, **not being worked on** | where every hour since 4 Aug has gone |

**Everything in sections 2, 3, 4, 5.1–5.11, 6, 6b and 6c below is about the OLD
page.** It is kept because it is hard-won and the old page is still live, but if
you are here to build the site, it is history, not instructions. The current work
is section 4c and traps 5.12–5.15.

The two pages share a repo and a build but no code. Changing one cannot break the
other, and a fix written for one will usually not apply to the other — `v2.css`
in particular re-declares everything from scratch on purpose.

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
1. ~~The mobile slogan overlaps.~~ **Fixed 4 Aug, and it was never the melt.**
   Both `.morph` hosts were flex items of `.stageui` whose only children are
   `position:absolute` — so their min-content height is 0, `min-height:auto`
   could not protect them, and when the phone column overflowed flex crushed
   both to `height:0` at the same `top`. Two lines painted on the same y.
   `flex:none` on `.morph`. Six fixes chased the animation; the animation was
   working the whole time. See §6 for the method that found it.
1b. **The live phone ribbons need his own iPhone.** The scene now runs live on
   phones (§3), but the iOS Simulator measured **33fps**, so `usePerfGuard`
   fired and swapped to the clip. The simulator runs WebGL through a
   translation layer on the Mac and is **not** a real iPhone GPU — that number
   proves nothing either way. Check on the real phone before tuning anything.
   If it is genuinely slow there, §6b is the way out.
2. **HTTPS** — cert stuck. Leave alone.
3. **iPad** — never tested. Three simulators available.
4. **Rainur's feedback** — `docs/feedback-rainur.md`, items 3/4/6 ready to
   implement, two items blocked on Damir's answer. Written down deliberately;
   do not implement unasked.
5. **Projects section** contains invented company names and money figures
   (`Projects.tsx:94-105`). Two of four are labelled «· макет». Damir has
   dismissed this as unimportant for now.

---

## 4c. THE V2 PAGE — the current work, state as of 2026-08-04 late evening

Two files: `app/src/v2/V2.tsx` (761 lines) and `app/src/v2/v2.css` (546). No other
file in the repo affects it.

### Verified working live
- **The DNA header.** A 3D clip scrubbed by `currentTime`, on a `position:sticky`
  runway. Scroll moves it; when you stop, it plays itself forward and backward
  forever while the page stays put. Traps 5.12–5.13 explain the model; do not
  re-derive it.
- **Four tiers of the clip**, chosen by DEVICE pixels (`innerWidth * devicePixelRatio`),
  not CSS pixels. All-intra (`-g 1 -bf 0`) so a seek costs exactly one decode.
  H.264 only — see "HEVC" under Settled below.
- **Six pages** as hash routes (`PAGES` in `V2.tsx`): Главная · О нас · Услуги ·
  Инструменты · Работы · Контакты. Hash routing because GitHub Pages cannot
  rewrite clean URLs. The strand renders on the home page only.
- **A persistent top bar** with a working theme toggle (light/dark), and three
  liquid-glass chapter cards over the video with an orbiting two-comet beam.

### The four feel knobs — change these, not the tick
All at the top of `V2.tsx`. A "faster" or "slower" note from Damir is one number
here and nothing else.

| knob | now | what it does |
|---|---|---|
| `RUNWAY` | 4.6 | screens of scroll the sticky header occupies |
| `SCROLL_GAIN` | 1.8 | clip covered per screen scrolled. 1 = a full runway is one pass |
| `LOOP_SPEED` | 1.7 | idle playback rate. 1 = real time |
| `HOLD_FADE` | 0.16 | fraction of a card's slice spent fading. **Smaller = card stays longer** |

`RUNWAY` and `SCROLL_GAIN` pull against each other on purpose: the longer runway
is what gives a card distance to be readable in, and the gain buys the strand's
speed back on top.

### Settled — do not reopen without a measurement
- **HEVC is out.** It halved the file, but libx265 all-intra emits profile `Rext`
  and Apple hardware decodes Main only. Switching to `hevc_videotoolbox` produced
  a Main-profile file that still would not scrub on his real iPhone, so H.264 is
  what ships. A `<source>` fallback does NOT rescue this: a codec that decodes and
  then fails is not a codec the browser rejects.
- **Only 293 frames are real.** The 583-frame clip that arrived was those 293
  motion-interpolated — proven by PSNR (consecutive frames 29.3dB apart, every
  SECOND frame 25.0dB, the master's true spacing). Everything ships from the 293,
  AI-upscaled with Real-ESRGAN. Phones get 50fps (interpolated, invisible at that
  size), laptops and 4K get real frames only at 25fps — Damir spotted the smearing
  on a 1440p laptop unprompted.
- **The glass panels cost nothing.** A/B on the phone, video motion over 3s:
  28.85 with them, 27.82 with `?nopanel=1`. That switch is still in the CSS as a
  measuring tool, not a feature.
- **Morph text is removed**, and the vendor scripts it needed are no longer
  fetched by v2. It made the whole page lag. Do not bring it back.

### Open on v2
1. **Portrait phones stretch the clip.** The CSS fills a 9:19.5 screen with a 16:9
   source, so it is magnified ~3x vertically no matter which tier is served. The
   real cure is a portrait-cropped encode, not a bigger landscape one.
2. **Content.** The five non-home pages need real depth. Everything needed is in
   `docs/BRIEF.md`, `catalogue.md`, `software-types.md` — do not reinvent it.
3. **Prices and contacts** are «указать» on purpose. Damir supplies them. Ask once.

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

### 5.10 A shorthand on a `.wrap` element resets the gutter
`.topbar` is `class="wrap topbar"`. `.wrap` sets `padding:0 24px`; `.topbar`
then set `padding:22px 0`, a **shorthand**, which put the horizontal padding
back to zero. The header had no side gutter at any width — invisible on desktop
behind the 1180px max-width, and on a phone the logo sat at x=0. Use
`padding-block` on anything that rides on `.wrap`.

### 5.10b The clip can never loop perfectly - the trails are not periodic
The PATH is: x=cos(t), y=sin(2t) comes home every 2*PI seconds, and a frame-by-frame scan of
a take confirms the best match to frame 0 sits exactly at 4*PI. The RENDERED STATE does not:
the tubes lag their target and their trails depend on history, so measured over a 13.7s take
at 30fps:

| comparison | mean abs diff (0-255 grey) |
|---|---|
| adjacent frames, 1/30s apart | **0.41**  <- what seamless looks like |
| best loop found anywhere in the take | **3.17**  (cut 1.333s -> 13.733s) |
| frames 0.5s apart | 4.86 |
| two random frames | 10.84 |

So no cut length is seamless, and picking one by theory (an integer number of path periods)
does NOT beat searching the take frame by frame. Search it.

The crossfade is what hides the residual, and it must be SHORT. An overlay crossfade blends
content F seconds apart, so a long F is a long ghost of two different figures - which is
exactly what "it teleports from one point to another" meant. 1.18s was very visible; 0.4s is
not. If a seam is still visible the answer is a LONGER take, which gives the search more
candidate loop points, not a longer fade.

### 5.11 A filmed clip cannot do two of the things the ribbons are for
The ribbons walk the ICE palette one step behind the slogan (`setColors` every
frame), and their sweep is measured off the slogan's own ink whenever it
changes. A clip has one fixed colour and the geometry of the screen it was
filmed on. `record-tubes.html` knew this — its own note says the scene "records
in near-white and **the page tints it live**". That live tint is what trap 5.5
deleted, so the clip has been stuck white ever since. If the clip ever has to
carry the colour again, the tint must be a `filter` on the `<video>` element
itself, never an overlay in an isolated group.

### 5.12 A scrubbed video must turn OFF the browser's scroll restoration
On reload the browser puts `scrollY` back where it was. For an ordinary page
that is a kindness; for v2's DNA header it is a bug, because the scroll is
restored and the video is not — it comes back at `currentTime` 0. Measured in
the browser: reload at `scrollY 1800` gave `currentTime 0`, i.e. the page sat
two thirds through the stage showing an intact strand.

On iOS it is worse than a mismatch. A `<video>` there cannot be **seeked** until
it has been allowed to play once, and a fresh load has had no gesture yet — so
the picture freezes on whatever frame is painted and scrolling does nothing,
then the first touch arms it and it snaps. That snap reads as "the page reloaded
by itself and jumped back to the start".

`history.scrollRestoration = 'manual'` in `V2.tsx`, at **module scope** — not in
an effect. The browser restores scroll as soon as the document is tall enough,
which can be before React has mounted. Any future scroll-driven media on this
site needs the same line.

### 5.13 The strand is ALIVE now — scroll is a delta, not a position
Since 2026-08-04 v2's clip is no longer an absolute function of scroll position.
One virtual clock (`pos` in `V2.tsx`'s tick) is driven by two hands: the scroll
DELTA scrubs from whatever frame is on screen, and when the measured scroll
speed dies an idle loop plays the clip itself — forward, then backward,
ping-ponging over the full range at 1x, while the page stays put.

**Corrected 2026-08-04, later the same evening.** The velocity blend and the
anchors described in earlier drafts of this section are **deleted, and must not
come back** — each was a second controller writing to the same `pos`, and each
produced a bug he reported within minutes. The blend overpowered slow scrolling
("it goes down even though I go up"); the anchors dragged the strand to the
destroyed end and would not let go, because `dp === 0` passes `dp >= 0`.

What survives is one unbounded `phase` and a triangle wave, ~24 lines:
`pos = triangle(phase)`, no boundaries, no clamps, no reflection branch. Speed
rides a bell so turnarounds are naturally soft. Input gating (`quiet`) holds the
loop off while a finger or wheel is active, with a 0.22 floor so scroll start
does not hitch.

Two clamps, and confusing them cost several rounds: `scrollP` is pinned to [0,1]
because the overlay and chapters fade along it. **The scrub must not read it** —
when the runway runs out the delta becomes exactly zero, so the strand receives
no input at all and freezes ("stuck at the end"). The scrub reads raw `scrollY`
scaled by travel. Raw scroll distance never runs out.

### 5.13b THE BOUNCE IS THE OPTIMAL LOOP. Stop trying to remove it.
Asked over and over for a forward-continuous loop, and every alternative was built,
measured and thrown away. The question was finally settled with the right method,
which was his: take the END frame and find the frame that best continues it.

| what to attach after frame 293 | best frame | seam |
|---|---|---|
| **untransformed** | **292** | **1.2x a normal step** |
| rotated 180 | 62 | 7.9x |
| mirrored horizontally | 32 | 8.3x |
| mirrored vertically | 64 | 8.4x |

**Frame 292 is the reverse.** The ping-pong is not a compromise - it is the
mathematically closest continuation available, and it beats every alternative by
about seven times. That is why mirror, rotation and dissolve all looked wrong.

Also measured, so nobody repeats them: across ALL 293x293 frame pairs and three
transforms the best cut point anywhere in the clip is 3.7x, and every good join
lands on frame 1, because the footage is a ONE-WAY transformation - nothing near
the destroyed end resembles anything else. Motion interpolation refuses the job
outright: asked to bridge 59.85 against a normal step of 8.6 it produces zero new
frames, only exact copies of both ends. Animating the rotation swings the video's
corners into frame. A baked crossfade reads as fade-and-restart. A faster return
leg reads as a fault, not as a rewind.

**The only way to a forward loop is different footage** - the 3D source re-rendered
so its end flows into its start. No amount of code adds a frame that was never shot.

### 5.14 A `var()` inside a custom property is substituted where that property is DECLARED
This froze the glass panels' beam for its entire life and read as "the animation
doesn't work". `--bm-ring` (the conic-gradient) is declared on `.v2glass`, so it
is resolved **there**, with `--beam` at its `0deg` initial value — and what the
pseudo-elements inherit is a finished string with the angle already baked in.
Animating `--beam` on `::before` moved a variable that nothing was reading.

Measured, old wiring: pseudo `--beam` ticking 0/90/180 while the gradient's own
`from` angle stayed `0deg` at every sample. Fixed wiring: 0/90/180/270 on both
the glow and the ring. **The animation must live on the element that owns the
property containing the `var()`** — here `.v2glass`, not its pseudos.

Note this refines trap 5.1 rather than contradicting it. 5.1's cost came from an
`inherits:true` registered property forcing a whole-document re-resolve every
frame. `--beam` is `inherits:false` and scoped to the panel being read
(`.v2ch.is-live`), so only that subtree recomputes. A/B on the phone, video
motion over 3s as the proxy for a starved frame budget: **28.85 with the panels,
27.82 with them stripped** (`?nopanel=1`, still in the CSS as a measuring
switch). That is noise. Verified on device: two untouched screenshots seconds
apart show the comets ~90° further round AND the strand at a different frame, so
the beam and the idle loop run together.

### 5.15 Every deploy makes every visitor refetch the 30MB video
GitHub Pages builds its `ETag` from the **deploy timestamp, not the file
contents** — `ETag: "6a721503-1cfbcfa"`, where the prefix is the deploy time in
hex. So pushing a two-line CSS change invalidates `dna-loop-hq.mp4` as well, and
the browser pulls all 30.4MB again.

The symptom is a flat `#0e202d` screen where the strand should be. That is
`.v2bg`'s fallback colour showing through while the clip downloads, and it looks
exactly like a broken video element. **It is not a bug.** Before diagnosing it as
one, check `video.readyState` and `video.buffered` — a healthy live page reports
`4` and the full 11.72s.

---

## 6. The method that finally worked

Print the facts into the page and photograph them. A `?diag=1` block that dumps
`matchMedia` results, the anim3 URL actually requested, `host.style.filter`
(empty ⇔ `simple` mode), every span's opacity, and the real `getBoundingClientRect`
of both hosts. Six sessions inferred those values; the first one to *read* them
found the bug in one screenshot, because `liq1 h=0.0` and `liq2 h=0.0` at the
same `top` cannot be an animation bug.

Two things that will waste an hour if not known:
- **Safari on the simulator cannot resolve `localhost`.** Use `127.0.0.1`. A
  `localhost` URL renders a blank white page with no error.
- The page origin sits ~61pt below the screen top in Safari, so a tap at a
  page-space y misses. Add the offset.

## 6b. If the live phone ribbons are too slow on his real phone
Re-film, but the clip must be re-filmed **near-white** and tinted by a CSS
`filter` on the `<video>` element (element-local, so trap 5.5 does not apply) —
animating `hue-rotate` on the palette clock is what gives a clip a colour cycle
at video cost. `record-tubes.html` records at the recording window's size and
uses `SWEEP_X/SWEEP_Y` fractions measured off a 1470x797 desktop; a phone take
needs a portrait window and the phone's taller `sleepRadiusY`.
**The preview pane cannot run the recorder** — it reports `document.hidden` and
the tool aborts on exactly that (trap 5.9). It needs a real foregrounded browser
window for ~10s.

## 6c. The original slogan brief, kept for the record

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

### 5.16 GitHub Pages resets every file's mtime on every deploy, so the 40MB video re-downloads

Measured 5 August. Pages builds its ETag as `"mtime-size"`, and a deploy rewrites the mtime of
files it never touched:

| | ETag |
|---|---|
| before a deploy that did not touch the video | `"6a72a13a-2656316"` |
| after it | `"6a72a2da-2656316"` |

Same size, different mtime, therefore a different ETag, therefore the browser's HTTP cache is
void and all 40MB come down again. `Cache-Control` is fixed at `max-age=600` and Pages does not
let you change it, so **this cannot be fixed with configuration.**

The fix is `app/public/sw.js`: Cache Storage is keyed by URL alone, so a deploy cannot evict it.
Three properties keep it safe on a root scope shared with `index.html` — it intercepts only
`/dna-loop*.mp4`, a cache miss does not call `respondWith` at all (so a first visit behaves
exactly as before), and the copy is taken only once the video has fully buffered, when the bytes
are still in the HTTP cache and the worker's fetch is local rather than a second download.
Kill switch is written at the top of the file.

### 5.17 The first screen was blank until 40MB arrived

A `<video>` paints nothing until it can decode a frame. Three layers now, cheapest first: a
300-byte inline JPEG of frame 0 as the video element's CSS background (no request, paints with
the stylesheet), a 41KB `poster` preloaded from the `<head>`, then the real frame. The poster is
on the element rather than in a layer of its own on purpose — `poster` obeys the element's
`object-fit`/`object-position`, so it cannot produce the vertical seam that killed the canvas
overlay (trap 5.5).

### 5.18 The video ref callback leaked three window listeners per navigation

The strand lives inside `{home && ...}`, so every click into an inner page unmounts it and every
click back mounts a new one. The ref callback added `touchstart`/`pointerdown`/`click` each time
and removed them never — measured at nine added and zero removed after three round trips, each
handler holding a detached `<video>` and calling `play()` on it on every click. Fixed by
returning a cleanup from the ref callback (React 19). **Note the consequence:** once a ref
callback returns a cleanup, React stops calling it with `null`, so clearing `videoRef.current`
became the cleanup's job.

### 5.19 A state class that sets `transform` wipes the responsive geometry underneath it

`.v2bg video.is-mir{transform:rotate(180deg)}` looked harmless and was invisible on desktop,
where the video has no transform of its own. In portrait it was destructive: that rule
**replaced** `translate(-50%,-50%) rotate(-90deg)`, so the loop's turn threw away both the
quarter turn and the centring, on every turn.

Measured at 375x812:

| | box | covers the screen |
|---|---|---|
| normal | `(0,-130) 375x1072` | yes |
| `.is-mir`, before the fix | `(188,406) 1072x375` | no — starts at the dead centre |

`transform` is a single property, so the last declaration wins outright; there is no cascade
*within* it. The fix is to let each geometry own its own `transform` and pass the state through
a custom property instead — `--turn`, composed as a final `rotate(var(--turn))`. **Any future
state class on this element must do the same: set a variable, never a transform.**

### 5.20 Never write `currentTime` to a byte range the browser has not downloaded

A `<video>` downloads progressively; seeking outside the buffered ranges **aborts the request in
flight** and restarts it at the new offset. The scrub loop writes `currentTime` up to 50 times a
second, so scrolling during the first seconds cancelled and restarted the download 50 times a
second and it could not finish. The idle loop did the same unprompted, which was the "static for
two seconds" half of the report. Guard every seek with a `buffered` range check, and roll the
phase back when the target is not there yet, so nothing accumulates invisibly and then jumps.
