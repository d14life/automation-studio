# Prompt: MVP #4 — «Складской сканер» (offer 37)

Paste everything inside the fence into a fresh Claude session. It is written to be
self-contained: it assumes the reader has never seen this repo.

**Why this one.** The three demos already live are a storefront (`zapchasti`), a financial
ledger (`vzaimoraschety`) and an asset-ops dashboard (`park`). All three are desktop
applications made of tables, cards and a calendar. A warehouse terminal is the first shape
whose *interaction* is different, not just its industry: one task at a time, driven by a
scan, operated with a thumb by someone wearing gloves. It cannot be mistaken for the others
even in a thumbnail — which is the whole point of a fourth card on the site.

It is offer **37** in `docs/catalogue.md`, where the demo is already named `Складской сканер`.

---

```
Build a working, self-contained prototype of a warehouse management system for a Russian-
speaking B2B audience. It is a sales demo: a business owner opens it, plays for two minutes,
and understands what their own warehouse would look like running on it.

THE PRODUCT

«Складской сканер» — приёмка, размещение, отбор, перемещение и инвентаризация по штрихкоду,
с адресным хранением. Two surfaces in one file:

1. ТЕРМИНАЛ (the hero, opens first) — what the picker holds. A phone-shaped panel, one task
   on screen at a time, driven by "scanning". Since there is no real scanner, typing a code
   and pressing Enter IS a scan, and there is a visible list of sample barcodes to click.
   Every scan resolves to a real reaction: correct item, wrong item, wrong cell, quantity
   mismatch. Big touch targets, big numerals, unmistakable success/error states.

2. ОФИС (a tab away) — the supervisor's view. Остатки по ячейкам, карта склада, документы,
   расхождения, история движений.

FUNCTIONAL DEPTH — it has to survive being poked at

- Адресное хранение: зона → стеллаж → ярус → ячейка (e.g. A-03-2-04). A visual КАРТА СКЛАДА
  showing occupancy per cell — this is the second thing that makes the demo look unlike a
  normal CRUD app, so give it real care.
- Приёмка: приходный ордер → сканируешь товар → система предлагает ячейку размещения
  (правило: свободная ячейка в зоне хранения этого товара, ближайшая к зоне приёмки) →
  подтверждаешь или выбираешь другую.
- Отбор: заказ на отбор → маршрут по ячейкам, отсортированный так, чтобы не ходить назад →
  скан ячейки, скан товара, ввод количества. Неверный скан — явная ошибка, не тихий сбой.
- Перемещение и подпитка: из ячейки в ячейку, с проверкой остатка.
- Инвентаризация: пересчёт по ячейкам, лист расхождений (учёт vs факт), акт списания/
  оприходования.
- Партии и сроки годности: FEFO при отборе — если у товара есть срок, система обязана
  предложить партию, которая истекает раньше. Показывайте это в интерфейсе.
- Остатки: свободно / зарезервировано / в отборе — три разных числа, а не одно.
- Документы, печатаемые на месте (window.print, вёрстка A4): приходный ордер, отборочный
  лист, акт инвентаризации, накладная на перемещение. Их содержимое обязано совпадать с тем,
  что реально считает система — не заглушки.
- Выгрузка в CSV: точка с запятой + UTF-8 BOM (иначе русский Excel открывает одну серую
  колонку из мусора).

VISUAL DIRECTION — it must NOT look like a SaaS dashboard

Промышленный терминал, а не админка. Reference points: industrial HMI panels, airport gate
displays, Bloomberg-style density where it earns it. Concretely:
- Very dark, near-black base; ONE loud functional accent (safety yellow / lime) used only for
  the active task and confirmations; red used only for genuine errors. No pastel, no glass,
  no soft gradients on everything.
- Huge type where the eye needs it: quantities, cell addresses, item codes in a monospace
  face at sizes that read at arm's length. Small type everywhere else.
- Chunky hit targets (min 56px) on the terminal surface. Thumb-first.
- Success and error are unmistakable at a glance: a full-panel colour flash, a large tick or
  cross, and a short text line. Add sound via the Web Audio API (a short beep for ok, a lower
  buzz for error) and navigator.vibrate where available — with a mute toggle that persists.
- Motion is functional only: the scan feedback, the route advancing. Nothing decorative.
- It must look correct in a 300px-wide card on a website, because that is how it will first be
  seen — check the top-left 1440x1000 region reads clearly when scaled to ~0.28.

DATA — the demo has to be full, and full of the right problems

Generate synthetic data with a SEEDED generator (so it is reproducible), covering at least:
~40 SKU across a few категории, ~180 ячеек across 3 зоны, партии со сроками годности, ~25
приходов and ~60 заказов на отбор spread over a real history, and deliberate imperfections
the demo can show off:
- одна ячейка с пересортицей (учёт не сходится с фактом)
- один товар с истекающим сроком, который FEFO обязан вытолкнуть первым
- один переполненный стеллаж, из-за которого размещение уходит в дальнюю зону
- один заказ, который нельзя собрать целиком — не хватает остатка
Russian names for goods, zones and staff. Invent every company name; never use a real one.

HARD RULES

- ONE self-contained .html file. No build step, no framework, no CDN, no external font, no
  network request of any kind. It must run when opened from a memory stick.
- Vanilla JS. Do not add a chart library — if you draw a chart, hand-roll the SVG.
- State persists in localStorage under a namespaced key, and the app SEEDS ITSELF on a first
  ever visit. An empty demo is a broken demo: nobody will find a "load sample data" button,
  and inside a card on the website the page is a picture that cannot be clicked at all.
  Guard the seed on "nothing is stored", not on "the data looks empty", so a visitor who
  wiped it or is entering their own goods does not get fake stock growing back.
- NO login screen. A demo that asks for a password loses the visitor.
- It opens on the screen that sells: the ТЕРМИНАЛ mid-task, not a settings page.
- Keep input validation and error handling. Every number a user types is checked, and a
  refusal says why in plain Russian.
- Everything the user reads is Russian. Comments in the code may be English.

VERIFY BEFORE YOU CALL IT DONE — and report the actual output, not a claim

1. Extract the inline <script> and run `node --check` on it. A duplicate `const` in one big
   inline script is a PARSE error: no console message, every function undefined, blank page.
2. Serve the folder and load it in a real browser. Confirm zero console errors.
3. Walk one full отбор end to end and state the numbers: остаток before, остаток after,
   which партия FEFO chose and why.
4. Trigger a wrong-item scan and a wrong-cell scan; confirm each is refused visibly.
5. Run an инвентаризация on the deliberately-wrong cell; confirm the лист расхождений shows
   the difference and the акт matches it.
6. Confirm zero network requests leave the page.
7. Print each document and confirm its figures equal what the system computed.

If something cannot be built honestly, say so plainly instead of faking it with hardcoded
output. A demo that lies is worse than a demo that is smaller.
```

---

## Note for whoever picks this up

`docs/catalogue.md` has the italic English subtitles shifted by one from offer 32 onward —
#36 reads *"Shift scheduling and rostering"* over the field-service text, #37 reads *"Field
service and mobile crew app"* over the warehouse text. The Russian is correct; the English
line is off by one. Not fixed here because it is outside this job.
