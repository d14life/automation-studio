# Solutions101 — read this before touching anything

This file is loaded automatically into every Claude session opened in this repo.
It is the short version. **`docs/HANDOFF.md` is the long version and you should read
it before your first edit** — it is 400 lines of traps that each cost a full evening.

## What this is

A Russian B2B automation studio's site. Dark AI aesthetic, structured like mabk.pro.
The v2 page (`app/src/v2/`) is a scroll-scrubbed DNA video header plus a content site.
`index.html` is the older live page; `v2.html` is the one being built.

- **`docs/HANDOFF.md`** — architecture, current state, and every trap. Read first.
- **`docs/BRIEF.md`** — all 14 of Rainur's voice messages transcribed, his Telegram
  spec, the whiteboard, and Damir's decisions. Read before writing any copy.
- **`docs/catalogue.md`, `docs/software-types.md`** — the 62 offers, already written.

## Branches — get this wrong and you wipe work

    react = source. main = deploy (built output at the repo root).

**Commit on `react` FIRST, then deploy.** The deploy is:

```bash
git checkout main && git checkout react -- app docs && cd app && npm run build && cd .. && cp app/dist/v2.html . && cp app/dist/assets/v2-* assets/ && git add -A && git commit -m "deploy: <what>" && git push origin main && git checkout react
```

`git checkout react -- app` on `main` has wiped uncommitted edits five times.
**Never switch branches with unstaged work.** Commit or stash first, every time.

## Two people work on this repo

Damir and his brother both run Claude sessions against it, sometimes at once.

- Branch off `react`: `git checkout react && git pull && git checkout -b feat/<name>-<thing>`
- Merge back into `react` when the slice is done and verified.
- **Pull before you start and before you push.** Two agents rebasing the same branch
  is how a day disappears.
- **Only one person deploys to `main` at a time.** Say so before you do it.
- Running two sessions on one machine? Use a worktree, not a second clone:
  `git worktree add ~/solutions101-lane-b -b lane-b react`

## The rules that are not negotiable

- **Never claim without evidence.** Run the check, then report — `curl` the live bundle
  and grep for your change, screenshot the simulator, print the value into the page.
  "It should work" is not done. If a test failed or a step was skipped, say so plainly.
- **Never build in `/tmp` or a scratchpad.** macOS wipes them; a full day was lost that
  way on 2026-08-02. Real work lives in `~/solutions101/`.
- **The preview pane cannot verify motion.** It reports `document.hidden`, which freezes
  `requestAnimationFrame` AND the CSS animation timeline — `document.timeline` advances
  0 ms. Anything that moves gets verified on the iOS Simulator or a real foregrounded
  window. (Trap 5.9, and it has bitten twice since.)
- **Vertical slices.** Every slice cuts all layers and ends in something Damir can look
  at and click. Never "all the schema, then all the API".
- **Build lean.** Does it need to exist? → reuse what's here → stdlib → platform-native →
  installed dep → one line → minimum. **Never** cut validation, security, or error
  handling.
- **Never automate QA.** Damir's eyes on the result is how taste gets into the product.
  Offer 2–3 options on anything visual and let him choose.

## Talking to Damir

**English only, TL;DR.** Lead with the answer in one or two lines; add detail only when
it changes what he does next. Site copy, client deliverables and anything the visitor
reads stay **Russian** — the language rule is about talking to him, not about the product.

Decide technical calls yourself — fix priority, branch, dispatch, merge order. Ask him
only about pricing, feature names, and business strategy. "go" / "c" / "do it" means full
authorisation; stop asking.

Ask for a missing input **once**, write it into the relevant doc, then stop mentioning it.

## Model routing

Top model orchestrates; cheaper models execute. `haiku` for mechanical volume (browser
automation, log reading, file sweeps, bulk edits). `sonnet` for implementation. `opus` for
hard reasoning — tricky debugging, architecture, security, review. Always pass `model:`
explicitly on Agent calls.

## Still open, do not re-ask

Price ranges per tool and the real contact details are missing on purpose — Damir will
supply them. The footer says «указать» so it cannot be mistaken for real data.
