# Solutions101 — brand direction

Decided by Damir, 2026-08-10. This supersedes the positioning implied by the
current Russian copy. Nothing here is a suggestion; it is the direction.

---

## The market, checked before deciding

Worldwide B2B custom-software studios all say the same sentence. Surveying the
2026 "top custom software development companies" listings, the differentiators
are: "scalable digital products", "product strategy, UI/UX design and modern
software engineering", "clean, functional, production-ready", "data-focused
approach, clear goals before coding". Even the claims to be different are the
same claim. There is no visual or structural differentiation anywhere in the
category — every one of them is a grid of case-study cards.

## The gap Solutions101 occupies

**Business software is universally ugly, and the studios that can design don't
do plumbing.** Enterprise shops build warehouse terminals and accounting
integrations but cannot make them beautiful. Creative studios make beautiful
things but do not touch 1C integrations or FEFO picking logic.

Damir does both. Warehouse terminal AND 3D. Accounting API AND a scroll site
that no CRM vendor on earth could build. In worldwide B2B that combination is
close to unoccupied.

## The position: THE SHOWROOM

**The site is a place, not a page.**

Competitors have a portfolio: a grid of cards, a case-study page, a contact
form. Solutions101 has a **showroom** — one continuous space you fly through,
where every product is a real thing you can walk up to and open. You do not
read about the work. You are inside it.

This is why the scroll journey is not decoration. It is the entire argument:
- A studio that can build this room can obviously build your CRM.
- The room is the proof, so the service list stops having to do the selling.
- "Come in and touch it" is a promise no competitor in the category can copy,
  because none of them can build the room.

The 62 offers stop being a scary service list and become **what is on display**.

## What this means for the build

- The world plane in `app/public/journey/index.html` IS the showroom floor.
  The camera model is not a scroll effect, it is the architecture of the brand.
- The 4 box faces = 4 KINDS of work, not 4 demos: custom systems, integrations,
  3D/visual, sites. The collage = everything else on display.
- Every product in the showroom must be openable. A demo that cannot be clicked
  breaks the central promise.

## Language

**English and Russian, equal, with a switch up front.**
Worldwide B2B means English is the front door; the existing Russian clients keep
theirs. Both versions are maintained in parallel — every visible string needs a
pair. This is real, ongoing cost and it was chosen deliberately.

## What is now wrong on the live site

- All copy is Russian only.
- "Автоматизируем бизнес-процессы" describes maybe a third of the actual range
  (CRM, custom systems, 3D rendering, sites, API integration, accounting).

## The line, corrected by Damir 2026-08-10

It is **«Изменим ИНСТРУМЕНТЫ вашего бизнеса»** — instruments, not DNA. I had
this wrong and wrote DNA into an earlier draft. His words: "mine is change
business instruments, important, this is what we do."

That is a much better line than the DNA cliché and it is literally accurate:
he does not change what the business IS, he changes what it works WITH. A
warehouse terminal, a CRM, a reconciliation screen, a 3D configurator - those
are instruments. It also survives translation, which the DNA line does not:
**"We change the instruments your business works with."**

It sits directly under the showroom: a showroom is where you come to see the
instruments, pick one up, and try it.

**«Только практика, ноль теории» is retired.** Damir does not like it and is
right that it does not hold up - it is a boast about method, not a promise
about outcome, and "zero theory" is not something a buyer wants to hear about
software that has to work.

## Rejected, and why

- *"Business software that isn't ugly"* — true and it is the real gap, but it is
  a claim. The showroom SHOWS the same thing instead of asserting it.
- *"No proposals, no discovery"* — strong, but it sells a process, and the whole
  point is to stop selling process.
- *"Instrument maker"* — good language, too small a frame for 3D and sites.
