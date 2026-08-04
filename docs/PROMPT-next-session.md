# Starting prompts

Paste one of these into a fresh Claude Code session. The first one is for someone
joining the project for the first time.

---

## PROMPT 0 — a new person / a new machine

```
Read CLAUDE.md in the repo root, then docs/HANDOFF.md, then docs/BRIEF.md, before
you touch anything. HANDOFF is 400 lines of traps that each cost a full evening —
do not skim it. BRIEF is every requirement, transcribed from the client's own
voice messages; do not write any copy without reading it.

Then get the site running and show me a screenshot before you change a line:

  git checkout react && git pull
  cd app && npm install && npm run build

The page being worked on is app/src/v2/ — v2.html on the live site. The old
index.html page is legacy; leave it alone.

Rules I care about most:
- Show evidence for every claim. curl the live bundle and grep for your change,
  or screenshot the simulator. "It should work" is not done.
- Anything that MOVES cannot be verified in the preview pane — it reports
  document.hidden, which freezes both requestAnimationFrame and the CSS
  animation timeline. Use the iOS Simulator or a real foregrounded window.
- Commit on `react`, never straight to `main`. Read the branch section of
  CLAUDE.md before your first push — the wrong checkout has wiped work five times.
- English and short with me. The site copy stays Russian.
```

---

## PROMPT 1 — the current work: content and pages

```
Read CLAUDE.md, docs/HANDOFF.md and docs/BRIEF.md first.

The DNA header is finished and verified — do not reopen it. Its scrub, its idle
loop and its beam all have measured proof behind them in HANDOFF traps 5.12-5.15.
If something about the header looks wrong, read those four traps before touching
the code; three of them describe a symptom that is not a bug.

This session is CONTENT. Six pages exist as hash routes in V2.tsx (PAGES):
Главная, О нас, Услуги, Инструменты, Работы, Контакты. The home page is built.
The others need real depth — Rainur's one repeated rule is «ноль воды»: concrete
over prose, numbers because "бизнес любит цифры", a separate animation per
service rather than one for the whole site.

Everything you need is already written down and must not be reinvented:
  docs/BRIEF.md          — 14 voice messages, the Telegram spec, the whiteboard
  docs/catalogue.md      — 582 lines, the offers
  docs/software-types.md — 345 lines
  docs/feedback-rainur.md

Damir's four decisions, already made: free prototype then 50% (every "0
предоплаты" claim comes out); team of 3-4, London education is the accent; prices
as RANGES not "от X"; our dark AI aesthetic on mabk.pro's structure.

One vertical slice at a time — one page, all layers, ending in something Damir
can click. Not "all the copy, then all the CSS". Screenshot each one and give him
2-3 options on anything visual.
```

---

## What NOT to let a fresh session do

- **Reopen the video header.** It took an evening and every behaviour in it is
  backed by a measurement. Traps 5.12–5.15.
- **Touch HTTPS.** The certificate is stuck; an attempt on 4 Aug briefly took the
  domain offline. Not in scope until Damir says so.
- **Invent prices or contact details.** They are deliberately «указать» in the
  footer. Damir supplies them; do not ask twice and do not guess.
- **Add a motion library for one component**, or rewrite sections below the fold
  "while it's in there".
- **Deploy to `main` while the other person is mid-deploy.** Say it out loud first.
