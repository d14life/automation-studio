# Prompt 1 — the design system

Paste everything below the line into Claude Design. This is step one and it
produces **only the system**: tokens and components. No page layouts, no
transitions, no marketing copy — those come in prompt 2 once the system is
signed off.

---

Build me a design system. Only the system — no page layouts, no hero sections,
no marketing copy. Tokens and components.

## The brand

**Solutions101** — a B2B software studio. It builds warehouse terminals,
reconciliation screens, equipment-rental systems, parts catalogues, accounting
and API integrations, Telegram bots and parsers, 3D product graphics, and sites.
Clients are Russian, the studio is going worldwide, so **every component must
work in Cyrillic and Latin**.

The line is **«Изменим инструменты вашего бизнеса»** — "we change the
instruments your business works with". Instruments, not "transformation". The
studio does not change what a business *is*, it changes what it works *with*.

**The one thing that makes this brand different:** business software is
universally ugly, and the studios that can design don't do plumbing. Enterprise
shops build warehouse terminals but cannot make them beautiful; creative studios
make beautiful things but will not touch a FEFO picking rule or a 1C
integration. This studio does both. **So the system has to dress a dense
operational table as convincingly as it dresses a landing page.** If it only
works for marketing pages it has failed.

## The palette is fixed. These are exact — do not substitute or "improve".

    --bg     #0b1720   page background. Off-black tinted navy. NEVER pure black
    --deep   #070f16   deeper panels, section floors
    --ink    #F2F7F5   primary text
    --dim    #8fa6b4   secondary text
    --ice-1  #DFF6FF   lightest ice — headlines on dark, highlights
    --ice-2  #7FD8FF   THE accent — one per screen
    --ice-3  #5C82C9   deeper blue — emphasis words inside headlines

**There is no violet on this site.** It was removed deliberately. No purple
gradients, no indigo glows, no AI-lavender, no "tech gradient" from blue to
pink. One accent, one dark theme.

"Ice" means cold, clear, slightly wet, faintly luminous — frozen glass over deep
water. Not neon, not cyberpunk, not glassmorphism-everywhere.

Your job on colour is to **extend this into a working set of roles**, not to
pick new hues: surface levels, borders, dividers, overlays, focus rings, plus
semantic success / warning / danger / info that sit beside ice without breaking
it. Danger and warning are the hard ones — they must read as urgent in a
warehouse at a glance while still belonging to this palette.

## Type

Self-hosted and available: **Nunito** (variable 300–900, full Cyrillic),
**Golos Text**, **JetBrains Mono**.

Nunito is the current voice — rounded, warm, confident, and its Cyrillic is
properly drawn, which most display faces cannot claim. Current headline
treatment is weight 800–900, tracking about −0.03em, line-height under 1.

If you propose a different pairing it **must ship a real Cyrillic cut**, and you
must show «Изменим инструменты вашего бизнеса» set in it. A face that renders
that badly is disqualified however good it looks in English.

Give me one type scale that covers a 96px display headline *and* an 11px table
label, with line-heights and tracking per step. Body text never wider than 52
characters. Numbers in tables must be tabular-figure and monospaced-aligned —
a reconciliation screen where the columns don't line up is a broken screen.

## What to deliver

**1. Tokens.** Colour roles, type scale, spacing scale, one corner-radius scale,
elevation, motion durations and easings. Real values, named, ready to become CSS
custom properties.

**2. Components, each with every state** — default, hover, focus-visible,
active, disabled, loading, error, and empty where it applies:

- Buttons: primary, secondary, ghost, destructive, icon-only
- Form fields: text, select, date, search, and a **barcode-scanner input**
  (a warehouse field that takes a scan followed by Enter — it needs an obvious
  ready / scanned / rejected state readable from a metre away)
- Data table: sortable header, zebra rows, row hover, selected row, sticky
  header, inline edit, numeric alignment, and an empty state
- Cards: product card, stat card, case-study card
- Navigation: top bar, side rail, breadcrumb, tabs
- Feedback: toast, inline error, confirmation dialog, skeleton loader
- Status pills for order and reconciliation states

**3. Two screens, built only from those components** — one marketing section and
one dense operational table. Same tokens, same components, no exceptions. This
is the proof that the system spans both, and it is the deliverable I will judge
the system on.

## Rules

- **Dark theme is the primary theme.** If you also do light, dark comes first.
- **Accessibility is not negotiable.** WCAG AA minimum: 4.5:1 body, 3:1 for
  large text and UI boundaries. Every interactive element gets a visible
  focus-visible ring. Check `--ice-2` on `--bg` and tell me the real ratio — if
  it fails, fix it and say what you changed.
- **One radius scale**, followed everywhere. Pill buttons next to square cards
  with no stated rule is broken design.
- **Motion**: transforms and opacity only. Give durations and easings as tokens,
  and honour `prefers-reduced-motion`.
- **No invented statistics.** No "200+ projects", no "98% uptime", no fake
  client logos. Where a number belongs but none exists, write `[placeholder]`
  and leave it visible.
- **No real-looking client data** — no plausible company names, tax numbers,
  phone numbers or balances anywhere, including in the table screen. Generic
  placeholders that read as deliberate, never as unfinished.
- **Show me 2–3 options** for anything with taste in it — the type pairing, the
  card treatment, the table density — rather than one answer. I will pick.

Start with the tokens and the type specimen. Do not move on to components until
I have signed those off.
