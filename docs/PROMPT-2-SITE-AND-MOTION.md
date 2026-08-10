# Prompt 2 — the site, and the motion catalogue

Step two. Prompt 1 produced the design system; this builds the site with it.

**How to use this:** the motion catalogue below is a menu, not a spec. Read it,
pick the ones you want, then paste the section under `---` into Claude Design
with your picks named. Everything marked **BUILT** already exists and works in
`app/public/journey/flow.html` — those cost nothing to include.

Do not ship all 24. A site that does everything reads as a showreel. Six to
eight, chosen so they do not repeat each other, is a site.

---

## THE MOTION CATALOGUE

`BUILT` = working and verified in a real browser today.
`PROVEN` = built earlier in `showroom.html`, needs porting to GSAP.
`NEW` = would be built from scratch.

### A. Openers — the first thing a visitor sees

**1. Camera pull-back** · `BUILT` · **the signature move**
The landing page is an object at exactly viewport size. Scroll scales one
wrapper 1.0 → 0.16 and the page you were reading becomes a ~190px card on a
wall of 28. Verified: 1200px → 192px, 0 → 28 cards in frame.
*Says: this whole studio is one room and you just saw one wall of it.*

**2. Aperture open** · `BUILT`
A circular window grows from a point; the next scene is already behind it, full
size and in position. The panel inside counter-scales by 1/s so its type never
stretches.
*Says: you are not loading a page, you are looking through into a place.*

**3. Blur-resolve entrance** · `PROVEN`
Content arrives out of focus and resolves as it settles, out of a radial glow.
Cheap, and it makes a static hero feel like it arrived rather than appeared.

**4. Wordmark assembly** · `NEW`
The constructivist display face draws itself in — strokes arriving in sequence,
angular joins landing last. Uses the new type as motion, not decoration.

### B. Transitions between rooms

**5. Aperture wipe** · `BUILT` (as #2)
Room A collapses into a circle, room B is behind it.

**6. Card becomes room** · `NEW` (GSAP Flip)
A card in a grid grows until it *is* the page; its image becomes the room's
hero. A layout morph, not a crossfade — the card never disappears and reappear.
*The strongest possible expression of "the room is the proof".*

**7. Zoom-through** · `PROVEN`
The current room rushes past the camera and blows out to a glow, with the next
room arriving from far away as a small dark shape at centre. This is how
showroom.html closed its loop.

**8. Panel curtain** · `NEW`
Solid ice panels sweep across in sequence, the new room already assembled
behind them. The safest transition here — use it for utility pages.

### C. Travel — moving through the showroom

**9. Pinned horizontal track** · `BUILT`
Section pins, vertical wheel becomes horizontal travel. Nothing shares a
baseline: every card a different size at a different height, each drifting at
its own rate. That variation is most of why it reads as expensive.
Track length is not a knob — it is exactly as long as the content is wide.

**10. Flight through a Z-field** · `BUILT`
Cards scattered in depth, the whole field translated toward the viewer on one
transform. About six on screen at a time. Nothing rotates — the camera dollies.

**11. Camera pan across a plane** · `PROVEN`
Down to a row, then right along it, then further right until the pieces read as
a collage. One flat canvas, camera moving over it.

**12. Sticky card stack** · `BUILT`
Cards pin at one spot; each new one rises over the last while the one beneath
sinks and dims. Cheap and it holds attention.

### D. Type and reveals

**13. Line-mask reveal** · `BUILT`
Headlines split into lines, each clipped by its own box, sliding up from behind
its own edge. A reveal, not a fade. Re-splits when the webfont lands so line
breaks are never measured against a fallback.

**14. Character stagger** · `NEW`
Per-letter arrival. Made for the constructivist face — angular uppercase forms
landing one at a time is a different gesture from lines sliding.

**15. Blur-to-focus text** · `PROVEN`
Headline resolves from blur as it lands. Pairs with #3.

**16. Scramble / decode** · `NEW`
Text resolves out of noise. Fits the "invisible work" room specifically — it
looks like a parser finishing.

### E. Ambient — always running, cheap

**17. Velocity-reactive marquee** · `BUILT`
Ticker on its own timer that skews and speeds with scroll velocity. This is
what makes a ticker feel attached to the page instead of decorative.

**18. Column parallax** · `NEW`, near-free
A grid whose columns scroll at slightly different speeds. One attribute per
column, no scroll listener. The single best effort-to-impact ratio available —
it is most of why the reference site's helmet grid looks the way it does.

**19. Scroll-velocity skew on media** · `NEW`
Images lean into the direction of travel and settle when you stop.

**20. Magnetic hover** · `NEW`
Buttons and cards pull slightly toward the cursor. Must use motion values, not
React state, or it collapses on mobile.

**21. Particle sphere** · `PROVEN`
~4200 points on a Fibonacci sphere, hand-projected on a 2D canvas. Batched by
alpha bucket — 16 fillStyle changes a frame instead of 20000, measured 11.5ms →
2.5ms. Deliberately not three.js.

**22. DNA scrub** · `LIVE AND LOCKED`
The existing homepage header: a scroll-scrubbed video of a DNA strand breaking
apart. **Its motion is signed off and closed.** Design around it. Do not retune
it, redesign it or replace it.

### F. Product-specific

**23. Animated flow diagrams** · `NEW` · **the gap**
For the "invisible work" room — bots, parsers, API and accounting integrations.
There is nothing to photograph and there never will be, so the motion *is* the
product shot: data moving between boxes, a night job running, a reconciliation
resolving to zero. **Nothing exists for this. It is the highest-value thing to
design.**

**24. Exploded view** · `NEW`
A 3D product separating into parts on scroll. Sells the 3D room by being the 3D
room.

---

# THE PROMPT — paste from here

Build the Solutions101 site using the design system you just produced. Same
tokens, same components, no new colours and no new type.

## What it is

**The site is a place, not a page.** Every competitor in custom software has the
same site: a grid of case-study cards, a services list, a contact form.
Solutions101 has a **showroom** — one continuous space you fly through, where
every product is a real thing you can walk up to and open. You do not read about
the work. You are inside it.

This is the entire argument. A studio that can build this room can obviously
build your warehouse system. The room is the proof, so the service list stops
having to sell.

**The gap:** business software is universally ugly, and the studios that can
design don't do plumbing. Enterprise shops build warehouse terminals but cannot
make them beautiful; creative studios make beautiful things but will not touch a
FEFO picking rule or a 1C integration. This studio does both.

**The line:** «Изменим ДНК ваших инструментов» / "We change the DNA of your
instruments."

Read it precisely, because both halves are load-bearing. Not the DNA of your
*business* — the studio does not reorganise a company, and claiming otherwise
is what every consultancy already claims. It changes what the business works
*with*: the warehouse terminal, the reconciliation screen, the parts catalogue,
the configurator. And not merely "changes" those instruments — changes what
they are made of.

This also pays off the site's own header, which is a DNA strand coming apart.
The animation stops being decoration and becomes the argument.

Never write: "digital transformation", "scalable solutions", "innovative
approach", "we turn ideas into reality". Every competitor already says those.

## The four rooms

1. **Systems** — warehouse terminal, reconciliation, rental fleet, parts
   catalogue. Real screenshots exist.
2. **Sites** — landing pages and full sites. Real screenshots exist.
3. **Invisible work** — bots, parsers, API and accounting integrations.
   **Nothing to photograph.** Must be shown as animated flow diagrams.
4. **3D / graphics** — product and equipment renders, exploded views.

Every product in the showroom must be **openable**. A demo that cannot be
clicked breaks the central promise.

## Motions to use

> Replace this list with your picks from the catalogue, by number.

Use these and only these. Each one appears where it earns its place, not
everywhere. State for each: where it fires, what moves, what it eases on, and
how long it takes.

## Motion rules — these are not stylistic

- **Nothing appears from nowhere.** Where you are going is visible before you
  get there. The next room, the target card, the destination — on screen and
  growing.
- **Travel eases in and out; the middle runs at constant speed.** A camera that
  eases the whole way stalls.
- **Rest between moves.** A big transition needs a quiet screen either side or
  it reads as noise. Most sections are exactly one viewport; two or three are
  long runways of four to seven. A page where every section is 2–3 viewports
  feels like mud.
- **Transforms and opacity only.** Never animate width, height, top or left.
- **A horizontal track is exactly as long as its content is wide.** Making it
  last longer means putting more in it, never slowing the tween — slowing it
  breaks the 1:1 tracking that makes it feel physical.
- **Perspective is a wall.** Anything whose z reaches the perspective value is
  at the lens and vanishes. This has caused two separate bugs here; keep the
  nearest object short of it, or use plain 2D scale, which has no wall.
- **`prefers-reduced-motion` gets a readable page, not a broken one.** No
  smoothing, no scrubs, everything in its resolved state.

## Non-negotiable

- **Dark theme primary.** Palette exactly as the system defines it. **No violet
  anywhere** — no purple gradients, no indigo glows, no AI-lavender.
- **The DNA header is locked.** Design around it; never retune or replace it.
- **Cyrillic and Latin both work.** Display face for headlines only, above the
  size floor the system set. Text face for everything else.
- **WCAG AA**: 4.5:1 body, 3:1 large text and UI boundaries, visible
  focus-visible rings.
- **No invented statistics.** No "200+ projects", no "98% uptime", no fake
  client logos. Where a number belongs but none exists, write `[placeholder]`
  and leave it visible.
- **No real-looking client data** — no plausible company names, tax numbers,
  phone numbers or balances anywhere, including inside mockups.

## Deliverable

The showroom structure, every chosen motion specified tightly enough to build,
and the invisible-work room's visual language. Show me 2–3 options for anything
with taste in it rather than one answer.
