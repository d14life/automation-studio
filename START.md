# START HERE — read this, then say what you understood before touching anything

You are joining a site that is already half-built by another person working on the
same branch at the same time. Everything below is current as of **4 August 2026**.

## 1. Get it running

```bash
git clone https://github.com/d14life/automation-studio.git
cd automation-studio && git checkout react
cd app && npm install && npm run build
git config pull.rebase true
```

Then read, in this order: **`CLAUDE.md`** (rules), **`docs/HANDOFF.md`** section 0 and
4c (what exists and what already cost an evening), **`docs/BRIEF.md`** (every
requirement, transcribed from the client's own voice messages — never write copy
without it).

## 2. What this is, and what is already done

A Russian B2B automation studio's site. **Two pages live in this repo and they share
no code.** `index.html` is the old page — finished, live, nobody is touching it.
`v2.html` is the real work: `app/src/v2/V2.tsx` and `app/src/v2/v2.css`, two files.

**Done and verified — do not reopen:**
- The DNA video header. Scroll scrubs it; when you stop, it plays itself back and
  forth. Its speed, its beam and its glass cards all have measured proof behind them
  in HANDOFF traps 5.12–5.15. **Three of those traps describe something that looks
  like a bug and is not.** Read them before reporting the header as broken.
- Six pages as hash routes, a persistent top bar, a working light/dark toggle.

**Where it stopped:** the home page is built. The other five pages exist as routes
with thin content. That is the next job.

## 3. Your lane

**You work on the content pages: О нас · Услуги · Инструменты · Работы · Контакты.**
Damir is in the header and the hero. Same file is fine — the same function at the
same time is not, so stay out of `V2.tsx`'s scroll tick and the `.v2glass` / video
CSS unless he asks.

The client's one repeated rule is **«ноль воды»** — concrete over prose, numbers
because "бизнес любит цифры". Everything you need is already written and must not be
reinvented: `docs/BRIEF.md`, `docs/catalogue.md` (582 lines of offers),
`docs/software-types.md`, `docs/feedback-rainur.md`.

Decisions already made: free prototype then 50% · team of 3–4, London education is
the accent · prices as **ranges**, not "от X" · dark AI look on mabk.pro's structure.

**Do not invent prices or contact details.** They read «указать» on purpose.

## 4. How to save your work

Two people push to `react`. This exact sequence, every time:

```bash
git status                      # anything dirty you did not mean to touch?
git diff                        # read it — every line should be part of the job
git add app/src/v2/V2.tsx       # name the files. NEVER git add -A
git commit -m "a real sentence about what changed and why"
git pull --rebase origin react
git push origin react
```

If the pull stops on a conflict: fix the lines it names, `git add` that file,
`git rebase --continue`. **Never `git push --force`** — on a shared branch that
deletes whatever the other person pushed while you were working. It is the one
command here that can actually lose work.

**Never commit to `main`.** That is the deploy branch and only Damir touches it.

## 5. The four rules that matter

1. **Evidence, never "it should work."** `curl` the live bundle and grep for your
   change, or screenshot it. If a step was skipped or a test failed, say so plainly.
2. **Anything that MOVES cannot be checked in the preview pane.** It reports the page
   as hidden, which freezes the frame loop *and* the CSS animation clock. Use the iOS
   Simulator or a real foregrounded browser window.
3. **Stay in the job.** Do not tidy, rename, reformat or delete "unused" code you
   were not asked about — the other person may be mid-way through it. Write it down
   instead.
4. **One page at a time, all layers, ending in something Damir can click.** Screenshot
   it and give him 2–3 options on anything visual. Never decide taste alone.

English and short when you report. The site copy stays Russian.

---

**Now:** build the site, screenshot the home page, tell Damir which page you are
starting on — and wait for him to confirm before you write anything.
