# Prompts to paste after `/clear`

Two prompts. Use #1 now. Use #2 only once the mobile header is finished and
you have looked at it yourself and approved it.

---

## PROMPT 1 — mobile header (paste this one first)

```
Read /Users/damir12/solutions101/docs/HANDOFF.md before doing anything. It is
the whole project in one file, including nine traps that have each cost a full
evening. Do not skip it.

Scope for this session: THE HEADER AND FIRST SCREEN ON A PHONE. Nothing else.
Not the sections below it, not the desktop, not HTTPS, not the iPad. If you
notice a problem outside that scope, write it down and keep going.

The job is one specific bug: the two morphing slogan lines OVERLAP on a phone,
so neither is readable. Six fixes have already been shipped for this and all
six failed. Do not ship a seventh guess.

Start by proving which code path actually runs. Section 6 of HANDOFF.md tells
you exactly what to establish and in what order. The short version: the last
screenshot contradicts the deployed source, so an assumption is wrong — find
which one before changing any rendering code. If `simple` mode is on and the
fade is sequential, two phrases cannot both be legible at once. If they are,
something is lying. Find the liar.

Verify on the iOS Simulator, not the preview pane — the pane reports
document.hidden and returns black screenshots. Use
mcp__Claude_Code_iOS_Simulator__control: `attach` FIRST, then build/launch,
then `screenshot`. iPhone 16 Pro is 6ED5A100-930E-4675-958C-6B3F1996AA8B.

When the slogan is fixed, go through the rest of the phone first screen in
this order and fix what is actually wrong, checking each with a screenshot:
  1. the header bar — logo, burger, the nav panel when open
  2. the "101" — size, stroke, position
  3. the two action buttons under it
  4. the ribbons — size and position of the filmed clip
  5. the starfield

Rules: English, TL;DR. Show me evidence, never "it should work". Commit and
push each fix separately with a real message. Bump the anim3 cache version if
you touch anim3.js — read trap 5.2, it has burned three fixes already.
```

---

## PROMPT 2 — desktop header (only after the phone is approved)

```
Read /Users/damir12/solutions101/docs/HANDOFF.md first.

The phone header is finished and approved. This session is THE SAME FIRST
SCREEN ON THE MAC, and nothing else.

Do not undo anything the phone session did. Every phone rule lives inside
`@media (max-width:700px)` or behind `isSmallDevice()` — keep it that way, so
the two never fight.

Go through the desktop first screen and tell me what is actually wrong before
changing it. Screenshot first, opinion second. Cover:
  1. the morphing slogan at 77px — the melt, its timing, its colour
  2. the "101" and its glow
  3. the sliding two-action switch
  4. the live WebGL ribbons — density, length, brightness
  5. the nav pills and their hover hints
  6. the frame rate while scrolling the first screen, measured, not guessed

Then give me 2-3 options on anything visual and let me pick. Do not decide
taste on your own.

Rules: English, TL;DR. Evidence for every claim. One thing at a time.
```

---

## What NOT to let a fresh session do

- Touch HTTPS. The certificate is stuck; an attempt on 4 Aug briefly took the
  domain offline. It is not in scope until you say so.
- Implement Rainur's feedback. It is written down in `docs/feedback-rainur.md`
  on purpose. Two of its items need your decision (prepayment terms, team size).
- Rewrite sections below the fold "while it's in there".
- Add a motion library for one component.
