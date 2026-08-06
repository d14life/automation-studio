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
git checkout main && git checkout react -- app docs && rm -rf app/dist && cd app && npm run build && cd .. && cp app/dist/v2.html index.html && cp app/dist/v2.html app/dist/sw.js app/dist/dna-poster.jpg . && cp app/dist/assets/* assets/ && rsync -a --delete app/dist/demo/ demo/ && git add -A && git commit -m "deploy: <what>" && git push origin main && git checkout react
```

Four parts of that line are not optional, and each one has already gone wrong:

- **`cp app/dist/assets/* assets/`, never `assets/v2-*`** — that glob assumed the build
  emits exactly one chunk. The moment anything is code-split the new chunk has its own name,
  the glob skips it, and it 404s. `useCardTilt-IMDPqn_b.js` did exactly this: the module
  import failed, React never mounted, and **the whole site went blank** while every check
  that looked at `v2-*` passed. Copy everything the build emits.
- **`cp app/dist/v2.html index.html`** — v2 IS the homepage. It still also publishes to
  `/v2.html` so old links keep working, but the root is the one visitors reach. Skip this
  and the site silently keeps serving the old page while you believe you deployed. The
  previous front page is kept at `/classic.html`.
- **`rm -rf app/dist`** — `git checkout react -- app` only restores tracked files; it never
  deletes. Demos removed upstream stay behind in `app/public/demo`, get swept into the next
  build, and republish themselves. Three orphan folders (`ekran`, `storozh`, `theatre`) came
  back this way and one was nearly redeployed after being deliberately removed.
- **`rsync -a app/dist/demo/ demo/`** — `cp -r` merges unpredictably across nested asset
  folders. Deliberately **without** `--delete`: `/demo/ekran/` and `/demo/storozh/` are
  live pages that exist only on `main`, and `--delete` would silently unpublish them.
  Removing a demo for real means deleting it from `app/public/demo` on `react` **and**
  `demo/` on `main`, in that order.

If a card 404s, the cause is the opposite of the above: the card shipped and the page did
not. `/demo/theatre/` did exactly that. After any deploy, check every card resolves —
`for d in $(ls demo); do curl -o /dev/null -w "$d %{http_code}\n" -sk https://solutions101.net/demo/$d/; done`

`git checkout react -- app` on `main` has wiped uncommitted edits five times.
**Never switch branches with unstaged work.** Commit or stash first, every time.

## Two people work on this repo, on the SAME branch

Damir and his brother both work locally on `react` and push their parts to it, so
each sees the other's changes as they land. No feature branches — that is his call
and it is the right one for two people who want immediate feedback on each other's
work. It costs nothing as long as the loop below is followed exactly.

**Stay inside the job you were given.** With two people in the same files, an agent
that "improves" something it was not asked about is not being helpful — it is
silently overwriting work the other person may be mid-way through. If you notice a
real problem outside your scope, **write it down and keep going**; do not fix it.
That includes reformatting, renaming, tidying imports, and deleting code that looks
unused. Looks-unused is exactly what half-finished work looks like.

**Every push, without exception — and never `git add -A` here:**

```bash
git status                        # anything dirty you did not mean to touch?
git diff                          # read it. every line should be part of the job
git add <the files you meant>     # named paths, not -A
git commit -m "real sentence"
git pull --rebase origin react && git push origin react
```

`git add -A` is how a stray edit leaves the machine. Naming the paths means an
accidental change stays local and harmless — you will see it in the next
`git status` and can throw it away with `git checkout -- <file>`.

(The deploy to `main` is the one exception: it legitimately sweeps built output, so
it uses `-A` on that branch only.)

`--rebase` is the whole trick: it replays your commits on top of theirs instead of
creating a merge bubble, so the history stays a straight line and nobody's work
gets buried. Run `git config pull.rebase true` once per machine and plain
`git pull` does the right thing.

- **Pull before you start working, not just before you push.** Starting from stale
  code is what turns a two-line conflict into an evening.
- **Commit small and push often.** Two people editing `V2.tsx` — 761 lines and
  effectively the whole site — will touch the same file constantly. Frequent small
  pushes conflict on a few lines; a four-hour push conflicts on everything.
- **Say which area you are in** before starting: the header scrub, the chapters,
  the CSS, or one of the five content pages. Same file is fine; same function at
  the same time is not.
- **If a rebase stops with a conflict, do not force-push.** `git status` names the
  files, fix them, `git add` them, `git rebase --continue`. `git push --force` on a
  shared branch deletes whatever the other person pushed while you were working —
  it is the one command that can actually lose work here.
- **Only one person deploys to `main` at a time.** Say so out loud before you do.
- Running two sessions on one machine? Use a worktree, not a second clone:
  `git worktree add ~/solutions101-lane-b -b lane-b react`

## The rules that are not negotiable

- **Never claim without evidence.** Run the check, then report — `curl` the live bundle
  and grep for your change, screenshot the simulator, print the value into the page.
  "It should work" is not done. If a test failed or a step was skipped, say so plainly.
- **Anything with a screen gets driven, not read — use the `drive-demo` skill.** His
  standing instruction, and it covers the demos, any artifact someone sends, and this site
  after a deploy. Reading source tells you what the author intended; only clicking tells you
  what it does. Every real bug in these prototypes was found by clicking: the calendar that
  was two days off at 1440px, 33 of 59 invoices multiplying wrong, a scan field that ignored
  Enter, two dashboards nobody could reach because the app opened elsewhere. The skill also
  carries the browser-pane traps that cost an hour each and are not guessable — the pane only
  repaints on fresh navigation, `form_input` is silently ignored by React, refs go stale on
  every re-render, and motion cannot be verified in the pane at all.
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
