# Solutions101 — brief for Claude Design

Paste everything below the line into Claude Design. It is written to stand
alone: Claude Design cannot see this repo, so every colour, font and constraint
it needs is spelled out.

Source of truth for the positioning is `docs/BRAND.md`. Source of truth for the
palette is `app/src/v2/v2.css` + `hooks/heroTuning.ts`. The motion vocabulary at
the bottom is what has already been built and measured in
`app/public/journey/flow.html` — reuse it, do not reinvent it.

---

# Solutions101 — design system + site

## Who this is for

Solutions101 is a B2B software studio. It builds **warehouse terminals,
reconciliation screens, equipment-rental systems, parts catalogues, API and
accounting integrations, Telegram bots and parsers, 3D product graphics, and
sites.** Clients are Russian; the studio is going worldwide, so **English and
Russian are equal, with a switch up front.**

## The position: THE SHOWROOM

**The site is a place, not a page.**

Every competitor in custom software has the same site: a grid of case-study
cards, a services list, a contact form. Solutions101 has a **showroom** — one
continuous space you fly through, where every product is a real thing you can
walk up to and open. You do not read about the work. You are inside it.

This is the entire argument:
- A studio that can build this room can obviously build your CRM.
- The room is the proof, so the service list stops having to sell.
- No competitor can copy it, because none of them can build the room.

**The gap being occupied:** business software is universally ugly, and the
studios that can design don't do plumbing. Enterprise shops build warehouse
terminals but cannot make them beautiful. Creative studios make beautiful
things but will not touch accounting integrations or FEFO picking logic. This
studio does both, and that combination is close to unoccupied.

## The line

**RU:** «Изменим инструменты вашего бизнеса»
**EN:** "We change the instruments your business works with"

Instruments, not "DNA", not "transformation". It is literally accurate — the
studio does not change what a business *is*, it changes what it works *with*.
A warehouse terminal, a reconciliation screen, a 3D configurator: those are
instruments. A showroom is where you come to see the instruments, pick one up
and try it.

Do not write: "digital transformation", "scalable solutions", "we turn ideas
into reality", "innovative approach". Every competitor already says those.

## The four rooms

Structure the showroom as four rooms, not 62 line items:

1. **Systems** — warehouse, reconciliation, rental fleet, parts catalogue
2. **Sites** — landing pages and full sites
3. **Invisible work** — bots, parsers, API and accounting integrations. This
   room has nothing to photograph, so it must be shown as **animated flow
   diagrams**: data moving between boxes, a night job running, a reconciliation
   resolving. This is the room with no assets yet — invent its visual language.
4. **3D / graphics** — product and equipment renders, exploded views

## Palette — ICE. These are exact, do not substitute.

    --bg     #0b1720   page background, off-black tinted navy. NEVER pure black
    --deep   #070f16   deeper panels, section floors
    --ink    #F2F7F5   primary text
    --dim    #8fa6b4   secondary text
    --ice-1  #DFF6FF   lightest ice — headlines on dark, highlights
    --ice-2  #7FD8FF   THE accent — buttons, active states, one per screen
    --ice-3  #5C82C9   deeper blue — emphasis words inside headlines

**There is no violet on this site.** It was removed deliberately and must not
come back — no purple gradients, no indigo glows, no AI-lavender. One accent
(`--ice-2`), one radius scale, one dark theme.

Ice means: cold, clear, slightly wet, faintly luminous. Think frozen glass over
deep water, not neon and not cyberpunk.

## Type

Available and self-hosted: **Nunito** (variable 300–900, full Cyrillic),
**Golos Text**, **JetBrains Mono**.

Nunito is the current voice — rounded, warm, confident, and it carries Cyrillic
properly, which most display faces do not. Headlines are heavy (800–900) with
tight tracking (about −0.03em) and line-height under 1. Body is 1.6 and never
wider than 52 characters.

If you propose a different pairing it **must** ship a real Cyrillic cut. A
headline face that renders "Изменим инструменты" badly is disqualified however
good it looks in English.

## Hard constraint: the DNA header is LOCKED

The live homepage (solutions101.net) opens with a scroll-scrubbed video of a
DNA strand that breaks apart. Its motion is signed off and closed — the runway,
frame rate, seek interval, easing and two-gear warp curve must not be retuned,
redesigned or replaced.

**Design around it, not over it.** It is the first thing a visitor sees and it
sets the temperature: dark, cold, precise, slightly clinical. Whatever you
build has to feel like the same world this strand lives in.

## What to produce

1. **A design system** — colour roles, type scale, spacing scale, one corner
   radius scale, button/field/card states including hover, focus, active,
   loading, empty and error. Not a mood board: tokens and components.
2. **The showroom structure** — how the four rooms sit in one continuous space,
   how a visitor moves between them, and what "opening" a product looks like.
3. **Page transitions** — see below. This is the priority.
4. **The invisible-work visual language** — the animated flow diagrams. Nothing
   exists for this yet.

## Page transitions — the priority

Not fades. In this showroom, moving between rooms is *travel*, and the
transition is the proof that the rooms are in one space.

Design at least three, each specified frame by frame with what moves, what it
eases on, and how long it takes:

- **Camera pull-back** — the page you are on shrinks until you see it was one
  card on a wall of cards, then the camera moves to a neighbour and pushes in.
  *This is the signature move. It is already built and working.*
- **Aperture** — a circular window opens from a point on the current page and
  the next room is already behind it, full size and in position. Not a wipe —
  the next room was always there.
- **Card becomes room** — a card in a grid grows until it *is* the page. The
  card's image becomes the room's hero. Layout morph, not a crossfade.

Rules for all of them:
- **Nothing appears from nowhere.** Where you are going is visible before you
  get there.
- **Travel eases in and out; the middle is constant speed.** A camera that eases
  the whole way stalls.
- **Rest between moves.** A big transition needs a quiet screen either side or
  it reads as noise.
- Transforms and opacity only — no animating width, height, top or left.

## Motion vocabulary already built and measured — reuse it

Working GSAP implementation exists (ScrollTrigger + ScrollSmoother + SplitText).
These were built against a reference and verified in a real browser:

- **Camera on a plane.** The landing page is an *object* at exactly viewport
  size; scroll scales one wrapper from 1.0 to 0.16 and it becomes a ~190px card
  among 28 others. One transform, any number of cards.
- **Pinned horizontal track.** A section pins and vertical wheel becomes
  horizontal travel. Nothing shares a baseline — every card is a different size
  at a different height, each drifting at its own rate. That variation is most
  of why this reads as expensive.
- **Aperture wipe.** A circular mask scales up while the panel inside
  counter-scales by 1/s, so the type inside never stretches.
- **Sticky card stack.** Cards pin at one spot; each new one rises over the last
  while the one beneath sinks and dims.
- **Velocity-reactive marquee.** A ticker running on its own timer that skews
  and speeds up with scroll velocity — it feels attached to the page.
- **Line-mask reveals.** Headlines split into lines, each clipped by its own
  box, sliding up from behind its own edge. A reveal, not a fade.

## Pacing — measured off a reference site, use these ratios

Most sections are **exactly one viewport**. Two or three are long runways of
four to seven viewports. The big moves land *because* the sections either side
do almost nothing.

A page where every section is 2–3 viewports feels like mud. A page where
everything is one viewport has no weight anywhere.

## Honesty rules

- **No invented statistics.** No "200+ projects", no "98% satisfaction", no
  fake client logos. Where a number belongs but none exists, write
  `[placeholder]` and leave it visible.
- **No real client data** — no real company names, tax numbers, phone numbers
  or balances anywhere, including in mockups.
- Placeholder UI inside mockups should be generic interface furniture — row
  lists, bar charts, tile grids — never anything that could be mistaken at a
  glance for a real client or a real figure.

## Deliverable

Tokens, components, the four-room structure, and the three transitions
specified tightly enough to be built. Show me 2–3 options for anything visual
rather than one answer.
