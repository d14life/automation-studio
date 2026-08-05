import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode, RefObject } from 'react'
import './v2.css'

/* v2: the DNA strand is driven by the scroll wheel, not by playback.

   His idea, and it is the right one for this clip: the footage already runs destroy ->
   rebuild (it is the take followed by its own reverse), so scrubbing it with the scrollbar
   means scrolling down pulls the strand apart and scrolling back up knits it together, at
   exactly the speed of your hand.

   Three things make this work rather than stutter:

   1. The clip is re-encoded with a keyframe every 10 frames. This is the whole game. Seeking
      lands on the nearest keyframe and decodes forward from there, so with a default GOP of
      250 every scroll step can mean decoding a hundred frames. 59 keyframes across 585 costs
      about 25% more file and turns each seek into at most nine frames of work.

   2. currentTime is written once per animation frame, never per scroll event. Scroll fires
      far more often than the screen refreshes, and every write is a seek.

   3. The time eases toward its target instead of snapping to it. A trackpad emits scroll in
      coarse jumps; easing turns those into motion. */

/* Back to 5. The +30% was his idea and he has changed his mind having felt it - it made the
   header too long to get through. */
/* 3.85, not 5. His ask: the same scroll should move the strand 30% further, which is a
   shorter runway rather than a faster clip - the clip is scrubbed, it has no speed of its own.
   5 / 1.3 = 3.85. */
const RUNWAY = 3.85

/* THE THREE FEEL KNOBS. Everything about how the strand responds is one of these, so a
   "faster" or "slower" note changes a number here and nothing else.

   SCROLL_GAIN  how much clip one screen of scrolling covers. 1 = a full runway is one pass.
   LOOP_SPEED   how fast the strand plays itself while nobody is scrolling. 1 = real time.
   HOLD_FADE    the fraction of a chapter's slice spent fading in and out. SMALLER MEANS THE
                CARD STAYS LONGER: at 0.28 it held still for 44% of its slice, at 0.16 it holds
                for 68%.

   SCROLL_GAIN IS BACK TO 1, AND 0.55 UNDOING THE 50fps WORK IS THE REASON. He said the strand
   looked laggy again, "like before we did extra frames" - and he was reading it correctly.

   The arithmetic I missed: smoothness under the finger is FRAMES PER PIXEL SCROLLED, not
   frames per second in the file. Doubling the file to 50fps doubled it. Setting the gain to
   0.55 halved it again, because half as much clip passes under the same scroll. The two
   cancelled almost exactly, which is why it looked like the 25fps version - it was showing
   the same number of distinct frames per screen of scrolling.

   And lengthening RUNWAY instead is the same lever wearing a hat: dp is deltaY/travelPx, so a
   longer runway divides the delta by a bigger number. Identical effect, identical cost.

   So slower destruction and smooth scrubbing are the SAME knob pulled in opposite directions,
   and this file cannot give both. The only real way to have both is more frames still - a
   100fps interpolation would let the gain sit at 0.55 and still show 50fps-per-scroll - and
   that is a ~76MB download, which is a separate decision for him rather than a silent one. */
const SCROLL_GAIN = 1
const LOOP_SPEED = 1
const HOLD_FADE = 0.08
/* Frame rate is per tier, so it is declared with the tier below - seeking finer than one frame
   just decodes the same picture again, and the grid has to be the grid the file actually has. */

/* ?v=3: REBUILT FROM THE MASTER. He said the clip looked better the day it arrived than it
   does now, and he was right - it had been re-encoded from its own output twice and
   interpolated once, each step spending quality it could never earn back. The 15.7MB
   1920x1080 original still sits in git history (blob 4038131, commit 5c86d28) at 26.8 KB per
   frame against the shipped file's 15.7 - so both files are now ONE lossy step from that
   master instead of three, built from its 293 real frames as lossless PNG.

   All-intra as well (-g 1 -bf 0): the old files carried a keyframe every ten frames, so each
   seek decoded up to nine frames it would never show, and the idle loop seeks ~25 times a
   second, half of them in reverse where a GOP is pure cost. Every frame is its own keyframe,
   so a seek costs exactly one decode in either direction.

   ?v=4: AI UPSCALED. 1920x1080 was the ceiling of the master, so the only way past it was to
   invent detail: Real-ESRGAN (realesr-animevideov3) took all 293 frames to 3840x2160 on the
   M4 GPU, and both files are cut from those. Smooth 3D-rendered CG is the ideal case for it -
   nothing to confuse with grain - and it DENOISED the source compression on the way, so the
   AI 1440p came out both sharper AND smaller than a plain lanczos 1440p (29.0MB vs 35.2MB,
   measured on identical crops). Desktop is 2560x1440 now instead of 1920x1080.

   His call, and it overrides the old economy: the upscaled picture goes to EVERY device, so
   the smallest file is 1080p now rather than 720p. All three are cut from the same 4K frames.

   THREE TIERS - 3840x2160 at 47.6MB, 2560x1440 at 29MB, 1920x1080 at 16.6MB - and the file is
   picked by DEVICE pixels, not CSS pixels. CSS pixels lie on every retina screen: measured in
   the browser, a 1440-CSS-px window on a 2x display renders this video at 2880x2060 real
   pixels, so the 2560-wide file was being stretched, not "exactly 1:1" as the old comment
   claimed. His rule, and it is the right one: give each screen the most it can actually show
   and not one byte more.

   NEED is the width a 16:9 source must have to cover BOTH axes, because the CSS deliberately
   overstretches the clip past the viewport (see v2.css) - height is what binds on a phone, not
   width. Measured at 375x812: the element renders 375x1072 CSS px, which is 1125x3216 device
   pixels at dpr 3. Even the 4K file is only 2160 rows against 3216 wanted, so on a portrait
   phone this clip is ALWAYS being magnified vertically - that is a framing problem, not a file
   problem, and the real cure is a portrait-cropped encode rather than a bigger landscape one.

   The 4K gate is 3200, not 2560, and that number is chosen against real hardware rather than
   roundness: his MacBook Air asks for 2960, a true 4K display asks for 3840. So the 4K tier
   means an ACTUAL 4K monitor, and a retina laptop takes 1440p with mild stretching - which is
   the right trade, because he reported the page felt laggier and 4K decodes at 299fps here
   against 1440p's 610fps. Sharpness nobody can see is not worth a scrub that stutters.

   PHONES GET 720p, and that is not a downgrade in disguise - it is the answer to "keep the
   video clean and sexy but don't add lag". Sharpness at rest and smoothness in motion are
   bought with the same currency here, decode time per seek, so the phone spends it where the
   eye actually notices: motion. What makes the picture clean is no longer resolution anyway -
   it is that every frame is a real rendered frame, AI-upscaled and denoised from the master,
   rather than the interpolated mush we shipped before. This 720p is cut from the same 3840x2160
   frames as the 4K file, so it is a far better 720p than the one this page started with, and a
   1280x720 intra frame costs a quarter of a 2560x1440 one to decode. He confirmed the 1080p
   file stuttered on his iPhone when scrolling; this is that fix.

   Chosen once at module load rather than per render - the file cannot be swapped mid-scroll
   without losing the seek position, so a resize does not re-pick.

   SMOOTHNESS IS BOUGHT WITH BYTES, NOT WITH LAG - which is what lets both of his asks be true
   at once. The seek rate is capped at 30Hz regardless of the file, so doubling a file's frame
   rate costs nothing in scrubbing cost; and when the loop cruises it uses native playback,
   where 50 sequential decodes a second is still trivial against the 610fps this machine
   benchmarks. So a 50fps file is smoother for free in CPU and expensive only in download.
   That is why the laptop tier - the one screen where the bytes are cheap and he watches most -
   is the one that gets 50fps, regenerated from the AI-upscaled 4K frames rather than from the
   degraded originals that made interpolation a dirty word on this page.
   Written as a plan on 4 August and only actually built late that night - until then the file
   was still the 293-frame 25fps encode and this paragraph described an intention. It is true
   now. The 4K tier shares it: with HEVC reverted there is no separate 4K H.264 file, and a
   50fps 3840x2160 all-intra encode is a ~95MB download that no hero video can justify. */
const DPR = Math.min(devicePixelRatio || 1, 3)
const NEED = Math.max(innerWidth * DPR, (innerHeight * DPR * 16) / 9)
const TIER =
  innerWidth < 700 ? 'sm'        /* phones - decode cost rules here, see above */
  : innerWidth < 1100 ? 'md'     /* tablets */
  : NEED > 3200 ? '4k'           /* an actual 4K display */
  : 'hq'                         /* laptops and ordinary monitors */
/* H.264 ONLY, and the HEVC experiment is reverted rather than patched.
   The saving was real on paper - roughly half the bytes - but it cost the one thing that has
   to be true: he could not play the video on his own iPhone. First it was libx265 emitting an
   Rext profile, which Apple hardware refuses; Apple's own encoder fixed the profile and the
   file STILL would not scrub on a real device, only decode a single frame. On his phone the
   H.264 files scrubbed for the whole evening before HEVC was introduced, and on the phone
   tier HEVC was saving 6% - 12.5MB against 13.3. That is not a trade, it is a regression with
   a rounding error attached.
   H.264 High profile, all-intra, yuv420p, faststart: the most universally decodable video
   there is, and the configuration this page was already proven on. Windows, Android, old
   Safari, everything.

   A note for whoever is tempted to try HEVC again: a <source> fallback CANNOT save you. A
   browser that accepts the type up front and then fails to DECODE does not fall back to the
   next line - it shows nothing at all. Test on real hardware, not the simulator, which
   borrows the Mac's decoder and plays files a phone will refuse. */
/* 50 EVERYWHERE NOW, and the reason the desktop was held at 25 no longer applies.
   The rule used to be "phones get interpolated frames, laptops get real ones only" -
   because the 583-frame clip that arrived was the master's 293 real frames badly
   interpolated, and its invented frames measured 13% less detail with visible smearing
   on the strand's scale texture. He spotted that on a 1440p laptop unprompted.
   Re-interpolated properly from the 293 (motion-compensated, aobmc + vsbmc, not a blend)
   the invented frames measure 2.4% off - and hold up magnified: a real/invented/real
   triptych puts the strand exactly halfway with the scale texture intact and no ghosting.
   The clip was never a bad candidate for interpolation. It had just been interpolated badly.
   Cost: 29MB -> 38MB for double the frames, and 50 seeks a second against a file that
   benchmarks at 610fps sequential decode. */
const FPS = 50
const HALF_FRAME = 0.5 / FPS
/* THE SEEK CAP IS THE FILE'S OWN FRAME INTERVAL, not a hand-picked 30Hz. 33ms was chosen when
   the phone was still on 1080p H.264 and stuttering, and it has been throttling the 50fps
   files ever since - 30 updates a second out of 50 available, throwing away two frames in
   five. Deriving it removes the guess: seeking faster than the clip has frames only decodes
   the same picture twice, seeking slower discards frames that were paid for.
   So the 50fps tiers now run at 50Hz and the 25fps tiers at 25Hz - which is actually LESS work
   than before for laptops and 4K, where 33ms was over-seeking a 40ms grid. The extra cost
   lands only on phone and tablet, and lands on 720p/1080p HEVC that Apple decodes in hardware,
   which is the cheapest seek in the whole matrix. */
const SEEK_MS = 1000 / FPS

/* The two sources need not be the same resolution - the browser takes the first it can decode,
   and that is the whole point. HEVC is roughly half the bytes, so where it is available a
   laptop can afford the 4K master with no upscaling at all; where it is not, the H.264 line
   hands back a sharp 1440p instead of a 47MB 4K file nobody should download. Every device ends
   up with real frames and a sane download, and Windows and Android are never asked for a codec
   they do not have. */
const SRC_H264 =
  TIER === 'sm' ? '/dna-loop-sm.mp4?v=9'
  : TIER === 'md' ? '/dna-loop.mp4?v=9'
  : '/dna-loop-hq.mp4?v=10'

/* The light theme's own file, same tier, same 50fps, cut from the same 4K masters and graded
   for cream rather than inverted at runtime. Only ever downloaded if the visitor switches. */
/* LIGHT USES THE DARK FILE AND ONE CSS INVERT. This was tried the other way on 5 August and
   reverted the same night, for two separate reasons - both worth keeping written down.

   The grade was wrong. I validated it on ONE frame, the intact end, and shipped. The clip ENDS
   GOLD (measured: frames 1-150 are blue-dominant at p95 luma 0.31, frames 220-293 are
   yellow-dominant at 0.82). Gold inverted goes electric blue, and my grade then desaturated it
   into brown mud, so the entire back half of the runway was ruined while the one frame I
   checked looked clean. Any future grade has to be checked at the intact end, the middle AND
   the destroyed end.

   The download killed it anyway, and this is the part no grade can fix. A separate light file
   means switching themes waits on a fresh 8.6-28MB download before anything appears. His call
   after feeling it: an instant invert beats a prettier picture you have to wait for. Theme
   toggles have to be free.

   So: one file, both themes, one compositor filter. If a light version is ever wanted for real
   it is a re-render on a light set, not a grade and not a second download. */
const SRC_LIGHT = SRC_H264

/* RELOAD MUST START THE STRAND OVER. The browser restores scrollY on reload, which for an
   ordinary page is a kindness and for this one is a bug: the scroll is restored but the video
   is not - it comes back at frame 0 - so the page is two thirds through the stage showing an
   intact strand. Measured: after location.reload() at scrollY 1800, currentTime was 0.
   On iOS it is worse than a mismatch. A video there cannot be SEEKED until it has been allowed
   to play once, and a fresh load has had no gesture yet, so the picture sits frozen on a stale
   frame and scrolling does nothing - then the first touch arms it and it snaps. That snap is
   the "page reloads very quick and gets back to the starting frame".
   Set at module scope, not in an effect: the browser restores scroll as soon as the document
   is tall enough, which can be before React has mounted. */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

/* Copy lives beside the markup rather than inside it: these are the six things we actually do
   and the tools that can be bought singly, and both lists will change more often than the
   layout will. Every line names a job and what it removes - Rainur's rule is ноль воды, and
   the fastest way to break it is to describe a feature instead of a relief.
   NO PRICES YET, deliberately. He asked for ranges and has not given the numbers, and this
   page's whole credibility argument is that nothing on it is invented. */
const TOOLS = [
  { t: 'CRM под компанию', d: 'ваши этапы и поля, а не чужой шаблон' },
  { t: 'Телефония', d: 'запись разговоров, статистика, привязка к карточке клиента' },
  { t: 'Автообзвон', d: 'обзвон базы роботом, живому менеджеру уходит только заинтересованный' },
  { t: 'Пробив по компаниям', d: 'проверка контрагента по реквизитам до сделки' },
  { t: 'Телеграм-бот', d: 'приём заявок, ответы по прайсу и остаткам, передача человеку' },
  { t: 'Сборщик данных', d: 'прайсы, сайты, почта и выгрузки — в одну таблицу' },
  { t: 'Отчёты и дашборд', d: 'один экран с деньгами и долгами, письма при отклонениях' },
  { t: 'Сайт или экосистема', d: 'если нужен не инструмент, а всё сразу' },
]

/* THE CONTENT BUILD, 5 August - PAGES.md and SPEC.md turned into markup. Sources are the
   brief, the whiteboard, and two references: mabk (number tiles, clear menu) and GAIA
   (numbered sections, services accordion, chip form). Every number shown is from the honesty
   list in PAGES.md - nothing invented, because this site is shown in meetings as proof. */

/* One tiny in-view hook gates EVERY effect below - count-ups, service animations, the
   process line. Nothing animates offscreen; that rule is what killed v1's performance. */
function useInView<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, set] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { set(true); io.disconnect() }
    }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, inView]
}

/* The tiles count up once when seen. A string target like '3–4' or '0 ₽' cannot be counted,
   so each tile names the number to count and the text around it separately. */
const FIGS = [
  { n: 62, pre: '', post: '', b: 'готовых сценария', s: 'автоматизации — от бота до экосистемы' },
  { n: 12, pre: '', post: '', b: 'типов инструментов', s: 'сборщики, сторожа, конвейеры документов' },
  { n: 4, pre: '3–', post: '', b: 'человека в команде', s: 'лондонское техническое образование' },
  { n: 0, pre: '', post: ' ₽', b: 'стоит прототип', s: 'платите 50%, когда увидите его в работе' },
]
function Fig({ f }: { f: (typeof FIGS)[number] }) {
  const [ref, seen] = useInView<HTMLDivElement>()
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!seen) return
    if (f.n === 0) { setV(0); return }
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 900)
      setV(Math.round(f.n * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [seen, f.n])
  return (
    <div className="v2fig" ref={ref}>
      <dt>{f.pre}<i>{v}</i>{f.post}</dt>
      <dd><b>{f.b}</b><span>{f.s}</span></dd>
    </div>
  )
}

/* Each service draws its own picture - Rainur asked for that in its own voice message, and
   it is the difference between claiming automation and showing it. All five are inline SVG
   animated by CSS, started by the .is-in class and paused otherwise. */
const SVC_ART: Record<string, ReactNode> = {
  crm: (
    <svg viewBox="0 0 120 72" aria-hidden="true">
      <path className="a-lane" d="M8 14h104M8 36h104M8 58h104" />
      {[0, 1, 2].map((r) => <circle key={r} className={`a-deal a-deal--${r}`} cy={14 + r * 22} r="4.5" />)}
    </svg>
  ),
  tel: (
    <svg viewBox="0 0 120 72" aria-hidden="true">
      <path className="a-wave" d="M4 36 Q10 12 16 36 T28 36 T40 36 T52 36 T64 36 T76 36 T88 36 T100 36 T112 36" />
      <circle className="a-rec" cx="108" cy="12" r="4" />
    </svg>
  ),
  bot: (
    <svg viewBox="0 0 120 72" aria-hidden="true">
      <rect className="a-msg a-msg--in" x="8" y="10" width="56" height="14" rx="7" />
      <rect className="a-msg a-msg--out" x="56" y="30" width="56" height="14" rx="7" />
      <rect className="a-msg a-msg--in2" x="8" y="50" width="40" height="14" rx="7" />
    </svg>
  ),
  data: (
    <svg viewBox="0 0 120 72" aria-hidden="true">
      {[0, 1, 2].map((r) => <rect key={r} className={`a-row a-row--${r}`} x="4" y={8 + r * 12} width="34" height="7" rx="2" />)}
      <rect className="a-table" x="70" y="8" width="46" height="56" rx="4" />
      {[0, 1, 2, 3].map((r) => <rect key={r} className={`a-cell a-cell--${r}`} x="76" y={14 + r * 13} width="34" height="7" rx="2" />)}
    </svg>
  ),
  check: (
    <svg viewBox="0 0 120 72" aria-hidden="true">
      <rect className="a-card" x="30" y="8" width="60" height="56" rx="6" />
      <path className="a-tick" d="M48 38l9 9 17-19" />
    </svg>
  ),
}
const SVC = [
  { k: 'crm', t: 'CRM под ваши этапы', d: 'Не коробка, в которую вы подстраиваетесь, а ваша воронка как она есть. Импорт из таблиц, права по ролям, отчёты, которые вы просили.' },
  { k: 'tel', t: 'Телефония с записью и автообзвоном', d: 'Каждый звонок в карточке сделки. Робот обзванивает базу и передаёт менеджеру только тех, кто ответил «да».' },
  { k: 'bot', t: 'Боты, которые отвечают по вашему прайсу', d: 'Telegram и WhatsApp. Считают стоимость, принимают заявку, отдают её в CRM. Не «чат-бот» ради галочки.' },
  { k: 'data', t: 'Сборщики прайсов', d: 'Прайсы поставщиков из почты, сайтов и таблиц — в одну таблицу, каждое утро, без ручной сверки.' },
  { k: 'check', t: 'Пробив компаний', d: 'ИНН на входе, на выходе — реквизиты, суды, долги, учредители. Пакетно, по списку.' },
]
function SvcRow({ s, i }: { s: (typeof SVC)[number]; i: number }) {
  const [ref, seen] = useInView<HTMLDetailsElement>()
  return (
    <details className={seen ? 'v2svc is-in' : 'v2svc'} ref={ref} open={i === 0}>
      <summary><span className="v2num">{String(i + 1).padStart(2, '0')}</span><h3>{s.t}</h3></summary>
      <div className="v2svc__body"><p>{s.d}</p><figure className="v2svc__art">{SVC_ART[s.k]}</figure></div>
    </details>
  )
}

/* The three steps, joined by a line that draws itself as the section arrives. */
function Process() {
  const [ref, seen] = useInView<HTMLDivElement>()
  return (
    <div className={seen ? 'v2proc is-in' : 'v2proc'} ref={ref}>
      <svg className="v2proc__line" viewBox="0 0 2 100" preserveAspectRatio="none" aria-hidden="true"><path d="M1 0v100" /></svg>
      {[
        ['Разбираем процесс', 'Час разговора. Смотрим, что делается руками и сколько это стоит.'],
        ['Показываем прототип', 'Работающую версию, не макет. Бесплатно. Не понравилось — расходимся.'],
        ['Доводим и передаём', 'Исходный код, документация и обучение — ваши. Уходить от нас не больно.'],
      ].map(([t, d], i) => (
        <div className="v2proc__step" key={t}>
          <span className="v2num">{i + 1}</span><b>{t}</b><p>{d}</p>
        </div>
      ))}
    </div>
  )
}

/* SERVICES BY CLIENT, not by technology - the instruction from voice 3.3: a visitor должен
   узнать себя, not choose between "интеграция" and "парсинг". Sticky headline per industry. */
const INDUSTRIES = [
  { t: 'Логистике', items: ['Заявки из почты и Telegram в одну CRM', 'Автообзвон перевозчиков', 'Сборщик ставок с бирж', 'Пробив контрагента до подписания'] },
  { t: 'Оптовой торговле', items: ['Прайсы поставщиков в одну таблицу каждое утро', 'Бот, который считает стоимость по вашему прайсу', 'Остатки и резервы без Excel'] },
  { t: 'Строительству', items: ['Сметы и акты из шаблонов', 'Контроль этапов и подрядчиков', 'Фотоотчёты с объектов в одну ленту'] },
  { t: 'Юридическим фирмам', items: ['Документы из шаблонов за минуты', 'Мониторинг судов по вашим клиентам', 'Контроль сроков'] },
]

/* THE FORM - GAIA's chip pattern, which is what «ахуенная форма» turns out to mean: three
   taps and one honest textarea. The budget chips also answer the price question without a
   price list. No backend exists yet and the contacts are deliberately unset, so submit
   composes the enquiry and hands it to the visitor to send - a form that silently swallows
   a lead would cost more than the whole site. Validation stays full. */
const CHIP = {
  what: ['CRM', 'Бот', 'Телефония', 'Сборщик данных', 'Сайт', 'Экосистема', 'Не знаю пока'],
  budget: ['до 150 тыс', '150–400 тыс', '400 тыс – 1 млн', '1 млн +', 'не знаю'],
  when: ['как можно скорее', '1–3 месяца', 'позже в этом году', 'пока смотрю'],
}
function Enquiry() {
  const [what, setWhat] = useState('')
  const [budget, setBudget] = useState('')
  const [when, setWhen] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [pain, setPain] = useState('')
  const [err, setErr] = useState('')
  const [bad, setBad] = useState<'' | 'name' | 'contact' | 'pain'>('')
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (sent) return
    if (!name.trim()) { setErr('Как к вам обращаться?'); setBad('name'); return }
    if (!/@|\+?\d{6,}|t\.me|^@?[a-zA-Z]\w{3,}$/.test(contact.trim())) { setErr('Оставьте телефон, почту или ник в Telegram — иначе мы не сможем ответить.'); setBad('contact'); return }
    if (!pain.trim()) { setErr('Одной фразы достаточно — что отнимает время?'); setBad('pain'); return }
    setErr(''); setBad('')
    const text = `Заявка с solutions101.net\nИмя: ${name}\nСвязь: ${contact}\nЧто нужно: ${what || '—'}\nБюджет: ${budget || '—'}\nСроки: ${when || '—'}\nЗадача: ${pain}`
    navigator.clipboard?.writeText(text).catch(() => {})
    setSent(true)
  }
  const chips = (list: string[], cur: string, set: (v: string) => void) => (
    <div className="v2chips">{list.map((c) => (
      <button type="button" key={c} aria-pressed={cur === c}
              className={cur === c ? 'is-on' : ''} onClick={() => set(cur === c ? '' : c)}>{c}</button>
    ))}</div>
  )
  if (sent) return (
    <div className="v2form v2form--done">
      <h3>Заявка собрана и скопирована в буфер.</h3>
      <p>Пришлите её нам в Telegram или WhatsApp — контакты появятся в подвале в ближайшие
         дни, а пока команда на связи лично. Ответим в течение рабочего дня.</p>
    </div>
  )
  return (
    <form className="v2form" onSubmit={submit} noValidate>
      <label className="v2form__l">Что нужно{chips(CHIP.what, what, setWhat)}</label>
      <label className="v2form__l">Бюджет{chips(CHIP.budget, budget, setBudget)}</label>
      <label className="v2form__l">Сроки{chips(CHIP.when, when, setWhen)}</label>
      {/* A placeholder is not a label: it vanishes the moment typing starts and screen
          readers treat it as a hint, not a name. Real labels, visually hidden, plus the
          error tied to the field that actually failed rather than floating under the form. */}
      <div className="v2form__row">
        <label className="v2sr" htmlFor="v2-name">Имя</label>
        <input id="v2-name" value={name} onChange={(e) => setName(e.target.value)}
               placeholder="Имя" autoComplete="name" aria-required="true"
               aria-invalid={bad === 'name'} aria-describedby={bad === 'name' ? 'v2-err' : undefined} />
        <label className="v2sr" htmlFor="v2-contact">Телефон, почта или Telegram</label>
        <input id="v2-contact" value={contact} onChange={(e) => setContact(e.target.value)}
               placeholder="Телефон, почта или @telegram" autoComplete="tel" aria-required="true"
               aria-invalid={bad === 'contact'} aria-describedby={bad === 'contact' ? 'v2-err' : undefined} />
      </div>
      <label className="v2sr" htmlFor="v2-pain">Что делается руками</label>
      <textarea id="v2-pain" value={pain} onChange={(e) => setPain(e.target.value)} rows={3}
        aria-required="true" aria-invalid={bad === 'pain'}
        aria-describedby={bad === 'pain' ? 'v2-err' : undefined}
        placeholder="Что делается руками? Например: «менеджер каждое утро сводит прайсы четырёх поставщиков в Excel»" />
      {err && <p className="v2form__err" id="v2-err" role="alert">{err}</p>}
      <button className="v2btn v2btn--go" type="submit">Собрать заявку</button>
    </form>
  )
}

/* REAL PAGES, ROUTED ON THE HASH - and the hash is not a shortcut, it is the only thing that
   works here. This deploys to GitHub Pages, which serves static files and cannot rewrite
   /uslugi back to index.html, so a pushState route would 404 the moment anyone reloaded or
   opened a link directly. A hash route is handled entirely in the browser and survives both.
   Client-side rather than separate HTML entries because the strand is a 14-25MB download: a
   second entry point would re-fetch and re-decode it on every page change. This way the
   header stays live and switching is instant. */
const PAGES = [
  { id: '', nav: 'Главная' },
  { id: 'about', nav: 'О нас' },
  { id: 'services', nav: 'Услуги' },
  { id: 'tools', nav: 'Инструменты' },
  { id: 'works', nav: 'Работы' },
  { id: 'contacts', nav: 'Контакты' },
] as const
type PageId = (typeof PAGES)[number]['id']

function usePage(): PageId {
  const read = () => {
    const h = location.hash.replace(/^#\/?/, '')
    return (PAGES.some((p) => p.id === h) ? h : '') as PageId
  }
  const [page, setPage] = useState<PageId>(read)
  useEffect(() => {
    const on = () => {
      setPage(read())
      /* a new page starts at its top, or you land halfway down someone else's scroll */
      scrollTo(0, 0)
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return page
}

/* THE MORPHING SLOGAN, brought over from the live page - his ask, and the right one: the first
   thing a visitor meets should say what we are, and one static line says it once. These three
   pairs are the argument in order: the devise, then what we are not, then what we are.
   All three obey the width the phone can take - the longest line is 16 characters, against the
   live page's БИЗНЕС-ПРОЦЕССЫ at 15, so the sizing that page arrived at still holds. */

export default function V2() {
  const page = usePage()
  const home = page === ''

  const [light, setLight] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle('v2light', light)
  }, [light])

  /* LIGHT IS ITS OWN GRADED FILE NOW, not `filter:invert(1)` over the dark one.
     He looked at light mode and said the doubled frames had only been done for dark. The frame
     rate was never the difference - both themes played the same 50fps file, and seek cost
     measured identical (2.71ms dark, 2.69ms light). What he was seeing was the grade: a raw
     invert turns a dark blue background into cream but also turns the strand's black body white
     and its white speculars black, so the metal reads as blue-violet mush and every bit of the
     scale texture we paid for with Real-ESRGAN disappears.

     So light is now cut from the same AI-upscaled 4K masters as dark, graded properly and
     interpolated to 50fps the same way: background lands at 248,236,229 against the theme's
     own 246,233,226, and the strand keeps crisp dark detail lines instead of mush.

     What is NOT possible, and it is worth writing down so nobody tries: a "dark strand on a
     light background" version cannot be graded out of this footage. Measured on the master,
     the strand's dark body sits at 0.05 luminance and the background at 0.10-0.12 - five
     hundredths apart, with nothing but the speculars separating them. Curves steep enough to
     split them band the background and crush the strand. That version needs the 3D scene
     re-rendered on a light set, which is the same answer as every other quality ceiling here.

     Cost: one extra download, and only if you actually switch themes. The file is fetched
     lazily on first switch, and currentTime is carried across so the strand does not jump. */

  /* THE CURTAIN. His reference component drops a full-screen panel in the colour of the theme
     you are switching TO, swaps the theme while the screen is covered, then lifts it - so you
     never see the change happen, only the reveal. The donor ships it with inline styles and an
     AppBar, a search field and an avatar; this page needs the mechanism and none of the
     furniture, so the phases live here and the styling is in v2.css beside the sky toggle.

     transform-origin:top with scaleY is the whole trick, and it is also why it is cheap: a
     scale is a compositor transform, not a paint, which is the project's rule for anything
     that moves. */
  const [phase, setPhase] = useState<'idle' | 'falling' | 'rising'>('idle')
  const curtainBg = useRef('#0f1e25')
  const DURATION = 550

  const switchTheme = useCallback((next: boolean) => {
    if (phase !== 'idle') return   /* ignore a second tap mid-animation */
    /* The curtain is off in BOTH directions now. He asked for it gone going into dark, then
       pointed out it was still there going into light - so it is out either way. The code
       stays, and the phases with it, because turning it back on is one line: delete this
       return. The panel itself is still styled in v2.css. */
    setLight(next)
    return
    /* the curtain wears the colour of the theme arriving, so the reveal is already correct */
    curtainBg.current = next ? '#f2e9e1' : '#0f1e25'
    setPhase('falling')
    window.setTimeout(() => {
      setLight(next)               /* swapped while the screen is covered */
      setPhase('rising')
      window.setTimeout(() => setPhase('idle'), DURATION + 60)
    }, DURATION)
  }, [phase])

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const want = light ? SRC_LIGHT : SRC_H264
    if (el.getAttribute('src') === want) return
    const at = el.currentTime
    el.setAttribute('src', want)
    el.load()
    /* the new file starts at 0; put it back where the strand was */
    const restore = () => { try { el.currentTime = at } catch { /* not seekable yet */ } }
    el.addEventListener('loadedmetadata', restore, { once: true })
  }, [light])
  const stageRef = useRef<HTMLElement | null>(null)
  const scrollP = useRef(0)      /* progress through the runway, 0..1 */
  const offscreen = useRef(false) /* header fully scrolled away - stop burning battery */
  const rawY = useRef(0)          /* unclamped scroll position - what the SCRUB reads */
  const travelPx = useRef(1)      /* runway length, so a full pass is still one pass */

  const nudge = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (!el) return
    /* iOS WILL NOT SEEK A VIDEO IT HAS NEVER BEEN ALLOWED TO PLAY, and the old arming here
       gave up too easily - which is exactly what he described: a blue screen with no strand,
       then one frame after the first scroll and nothing after that. One frame decoding while
       currentTime does nothing IS the un-armed signature.
       Three things were wrong. The first play() fired from the ref callback, before the element
       had metadata, so it could reject for a reason that had nothing to do with permission.
       The gesture retries were {once:true}, so a single early failure spent them both. And
       nothing ever checked whether arming had actually worked.
       Now: arm on canplay AND loadedmetadata as well as immediately, retry on every gesture
       until it takes, and confirm by watching for a real 'seeked' event before standing down.
       autoplay is on the element too - muted and playsInline, which iOS permits - so in the
       common case the browser arms it for us and none of this is needed. */
    let armed = false
    const arm = () => {
      if (armed) return
      el.play().then(() => { el.pause() }).catch(() => { /* wait for a real gesture */ })
    }
    const done = () => { armed = true }
    el.addEventListener('seeked', done, { once: true })
    el.addEventListener('loadedmetadata', arm)
    el.addEventListener('canplay', arm)
    arm()
    addEventListener('touchstart', arm, { passive: true })
    addEventListener('pointerdown', arm, { passive: true })
    addEventListener('click', arm)
  }, [])

  useEffect(() => {
    let raf = 0
    let alive = true

    /* Progress through the STAGE, not through the whole document. That is what turns this
       from a page-length effect into a header: the clip is finished by the time the stage has
       been scrolled past, and everything below it is an ordinary page. */
    const onScroll = () => {
      const stage = stageRef.current
      if (!stage) return
      const rect = stage.getBoundingClientRect()
      const travel = stage.offsetHeight - innerHeight
      scrollP.current = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0
      offscreen.current = rect.bottom <= 0
      /* THE SCRUB READS RAW SCROLL, NOT THIS CLAMPED PROGRESS - and that clamp was the real
         "stuck at the end". scrollP is pinned to [0,1] because the overlay and the chapters
         need a bounded 0..1 to fade along, which is right for them. But feeding it to the
         scrub meant that the moment the runway was used up, the DELTA became exactly zero:
         the strand was not jammed against a limit, it was receiving no input at all, and no
         amount of folding can reverse a delta that is not there.
         Raw scroll distance never runs out. Scaled by the same travel, so the feel of the
         scrub is identical - a full runway is still one pass of the clip. */
      /* CLAMPED AT ZERO, and that is the rubber-band bug he hit: at the very top, grabbing the
         page and pulling drags scrollY NEGATIVE on iOS and macOS. The scrub reads raw scroll
         precisely so it never runs out of input - which also means it happily follows scrollY
         into negative numbers, and a rubber-band oscillates, so the strand was being seeked
         forwards and backwards several times a second with the finger barely moving. That is
         decoder thrash, and it reads exactly as he described it: the whole video lagging hard
         the moment you grab the top. There is no content above zero, so there is nothing to
         scrub to - clamp it. */
      rawY.current = Math.max(0, scrollY)
      travelPx.current = Math.max(1, travel)
      /* the overlay hands the screen to the strand over the first fifth of the runway - one
         custom property, read by opacity and a small translate, both compositor-only. */
      const p = scrollP.current
      stage.style.setProperty('--over', String(Math.max(0, 1 - p * 5)))
      /* Each chapter owns a slice of the runway and fades in and out across it. A trapezoid,
         not a triangle: it reaches full opacity and HOLDS there for the middle of its slice,
         so there is time to actually read it instead of one legible instant. */
      const band = (a: number, b: number) => {
        const f = (b - a) * HOLD_FADE
        return String(Math.max(0, Math.min(1, Math.min((p - a) / f, (b - p) / f))))
      }
      /* CONTIGUOUS AND OVERLAPPING - his ask: the container is always there, cards do not
         appear out of nothing and vanish into nothing. The slices now tile the whole runway
         after the overlay hands off. EXACTLY ADJACENT, not overlapping - the 4% overlap
         tried first put two texts in the same glass at once, which read as a glitch on the
         phone. Adjacent slices hand off with one quick fade instead. */
      const c1 = band(0.16, 0.47), c2 = band(0.47, 0.74), c3 = band(0.74, 1.01)
      stage.style.setProperty('--c1', c1)
      stage.style.setProperty('--c2', c2)
      stage.style.setProperty('--c3', c3)
      /* the beam animates only on the panel actually being read - two of the three are always
         parked, which is the whole reason this costs nothing next to the video */
      const chs = stage.querySelectorAll('.v2ch')
      ;[c1, c2, c3].forEach((v, i) => chs[i]?.classList.toggle('is-live', Number(v) > 0.05))
      /* the bar earns its backdrop once you are off the very top */
      document.documentElement.style.setProperty('--nav', scrollY > 40 ? '1' : '0')
    }

    /* THE STRAND IS ALIVE NOW - his idea. The clip is no longer an absolute function of
       scroll position; it is a creature with one clock:

         - while you scroll, your scroll DELTA drives the frames, continuing from whatever
           frame is on screen right now;
         - while you don't, the clip plays itself, forward then backward, ping-ponging
           between intact and destroyed, forever. The page never moves - only the frames do.

       The handoff between the two is a VELOCITY BLEND, not a timer: the loop's share grows
       as the measured scroll speed dies. That is deliberately also the fix for the iOS
       momentum tail he kept reporting - the last laggy crawl of a flick is slower than V0,
       so by then the loop already owns most of the motion and the crawl disappears into it.

       Two anchors keep the story readable: the last EDGE of runway at each end pulls the
       frame toward its meaning - top = intact, bottom = destroyed - but only while you are
       actually scrolling there ((1 - idle) weight). At rest the anchors let go, so the loop
       plays even on the untouched hero: land at the top, the strand settles intact, then
       quietly starts building and unbuilding on its own. */
    const DIAG = location.search.includes('loop=diag')
    let reversed = false
    let turnTimer = 0 as unknown as ReturnType<typeof setTimeout>
    /* REDUCED MOTION HAS TO REACH THE IDLE LOOP, and until now it did not. The CSS
       collapses the scroll runway, which stops the SCRUB - but the strand also plays
       itself, and that loop runs off its own clock, not off scroll. A visitor who has
       asked the system for less motion was still handed a full-viewport video
       animating on its own the moment the page opened. The scrub stays (it is a
       direct response to their own input, which is not what the setting is about);
       the self-playing loop does not. */
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches
    let mirrored = false
    let flipTimer = 0 as unknown as ReturnType<typeof setTimeout>
    let pos = 0      /* the frame on screen, 0..1 - DERIVED from phase, never set directly */
    let phase = 0    /* unbounded; pos is a triangle wave of it, so there is no boundary */
    let dir = 1    /* idle playback direction; scrubbing re-aims it so release carries on */
    let lastY = 0
    let quiet = 9  /* seconds since the last real INPUT - the only thing that arms the loop */
    let touching = false
    let last = performance.now()
    let lastSeek = 0
    const dbg = location.search.includes('dbg=1')
      ? Object.assign(document.body.appendChild(document.createElement('div')), {
          style: 'position:fixed;left:0;right:0;bottom:0;z-index:99;background:#000c;color:#0f0;'
               + 'font:11px/1.5 ui-monospace,monospace;padding:6px 8px;white-space:pre-wrap' })
      : null

    const tick = (now: number) => {
      if (!alive) return
      raf = requestAnimationFrame(tick)
      const el = videoRef.current
      if (!el || !el.duration || Number.isNaN(el.duration)) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const dp = ((rawY.current - lastY) / travelPx.current) * SCROLL_GAIN
      lastY = rawY.current
      if (offscreen.current) return

      /* THE SCROLL REFLECTS TOO - it does not run out of strand any more.
         His report: the loop walks the strand to the destroyed end while he is only halfway
         down the runway, and from there scrolling further does nothing at all - "it is just
         stuck at the end while we scroll". That was the clamp. Once the loop is free to move
         pos on its own, pos and the scroll position are no longer the same number, so pinning
         pos to [0,1] guarantees dead scroll whenever the loop has arrived first.
         Folding instead of clamping means the strand simply turns around and rebuilds, and
         keeps turning for as long as you keep scrolling. Every scroll produces motion, always,
         which is the property he actually wants. The while loop handles a flick big enough to
         cross the whole clip more than once. */
      /* ONE CONTINUOUS PHASE. No walls, no bounce counters, no direction flags to disagree.
         His report was "it lags very bad, like up and down, and does not go in reverse" - and
         "up and down" is the diagnosis. There were TWO reflection rules meeting at the same
         boundary: the scroll folded when it crossed 1, and the pendulum independently flipped
         its own direction there. Near the end they took turns rewriting pos every frame, so it
         ping-ponged across the boundary instead of turning around once. That is the jitter,
         and no amount of tuning either rule fixes a conflict between them.

         So the boundary is gone. phase runs unbounded and pos is a TRIANGLE WAVE of it:
         walk phase forward and pos rises to 1, turns, falls to 0, turns, forever. Reversing at
         the end is not a rule any more - it is the shape of the function, so it cannot fail,
         cannot double-fire, and cannot fight anything. Scrolling adds to phase. The loop adds
         to phase. Both hands push the same wheel in the same units.

         The bell keeps the turn from being a corner - speed follows |sin| of the phase, which
         is zero exactly at the turnaround - and the 0.55 floor keeps it from dwelling there,
         which was the earlier "holds for half a second" complaint. */
      phase += dp
      if (dp !== 0) dir = dp > 0 ? 1 : -1
      if (touching) quiet = 0; else quiet += dt
      /* THE LOOP NEVER FULLY STOPS - that dead stop was the hitch at the START of a scroll.
         Touching pinned idle to zero, so the ~39 frames a second the loop was contributing
         vanished the instant a finger landed, while the finger itself had produced almost no
         delta yet. The strand stalled for a moment and then picked up: his "it stops for a
         split second and only then the video picks up".
         A floor of 0.22 removes it, and it is safe now for a reason that was not true earlier:
         dir follows the sign of dp, so the loop always pushes the SAME way the finger is
         moving. It can add to a scroll, never oppose one - the old "goes down while I scroll
         up" failure is structurally impossible in the phase model. */
      const idle = Math.max(0.22, Math.min(1, Math.max(0, (quiet - 0.02) / 0.12)))

      const tri = ((phase % 2) + 2) % 2          /* 0..2, one full there-and-back */
      const bell = Math.max(Math.abs(Math.sin(tri * Math.PI)), 0.55)
      if (!REDUCE) phase += dir * (Math.PI / (2 * el.duration)) * LOOP_SPEED * bell * dt * idle
      const t2 = ((phase % 2) + 2) % 2
      pos = t2 <= 1 ? t2 : 2 - t2

      /* NO FLIP OF ANY KIND right now, and the list of what was tried is worth keeping.
         Mirroring reversed the diagonal, so the return leg read as a rewind. Rotating
         180 fixed the diagonal but as an instant swap it was a hard cut. Animating that
         rotation turned the whole frame, which swings the video's corners into view -
         a rotating rectangle cannot fill a rectangle. A baked dissolve read as a fade
         and a restart. Motion interpolation refused outright: asked to bridge a gap of
         59.85 when a normal frame step is 8.6, it produced zero new frames, only exact
         copies of the two ends.

         What is left is his own idea and it is the right one: stop forcing the join at
         293 -> 1 and find the two frames in the clip that genuinely match. Measured, the
         best pair is 162 -> 1 at 26.29, which is 4.8x a normal step against the 8.4x
         that 293 -> 1 costs. Better, not yet invisible - the search continues. */

      if (dbg) dbg.textContent =
        `pos ${pos.toFixed(3)}  phase ${phase.toFixed(2)}  dir ${dir}  dp ${dp.toFixed(4)}` +
        `  idle ${idle.toFixed(2)}  quiet ${quiet.toFixed(2)}  touch ${touching ? 1 : 0}` +
        `  off ${offscreen.current ? 1 : 0}  y ${Math.round(rawY.current)}`

      if (now - lastSeek < SEEK_MS) return
      const t = Math.round(pos * (el.duration - 0.05) * FPS) / FPS
      if (Math.abs(el.currentTime - t) >= HALF_FRAME) { el.currentTime = t; lastSeek = now }
    }

    /* The touch scroll lock is gone. It did what it promised - driving scrollY from the
       finger directly so iOS inertia never started, and the strand stopped dead when you let
       go - but he tried it and it made the page feel rigid, which is worse than the crawl it
       removed. Native scrolling back, momentum and all. */
    /* the input listeners the handoff above depends on. touchend deliberately does NOT reset
       quiet - the moment the finger leaves, the loop is allowed to start covering the glide. */
    const down = () => { touching = true; quiet = 0 }
    const up = () => { touching = false }
    const wheeled = (e: Event) => {
      /* macOS keeps sending wheel events through its own momentum, with deltas that decay
         toward nothing. Treating those as input would hold the loop off for the whole
         glide on a trackpad, which is the same braking he feels on the phone. */
      if (Math.abs((e as WheelEvent).deltaY) > 4) quiet = 0
    }
    addEventListener('touchstart', down, { passive: true })
    addEventListener('touchmove', down, { passive: true })
    addEventListener('touchend', up, { passive: true })
    addEventListener('touchcancel', up, { passive: true })
    addEventListener('wheel', wheeled, { passive: true })
    addEventListener('keydown', wheeled)

    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll, { passive: true })
    /* belt and braces to the line above: manual restoration stops the browser putting the
       scroll back, this puts it at the top even if something else already moved it. */
    scrollTo(0, 0)
    onScroll()
    raf = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      removeEventListener('touchstart', down)
      removeEventListener('touchmove', down)
      removeEventListener('touchend', up)
      removeEventListener('touchcancel', up)
      removeEventListener('wheel', wheeled)
      removeEventListener('keydown', wheeled)
    }
  }, [])

  return (
    <>
      {/* THE HEADER. The clip used to be position:fixed, which pins it to the screen forever -
          there was no "after". Sticky inside a tall section holds it for exactly the length of
          that section and then lets it scroll away like anything else. */}
      {/* The sky toggle from his reference, ported to plain CSS. The donor ships it as a
          styled-components file; this project animates with CSS and rAF and does not carry
          that dependency, so the markup and the mechanism are kept and the styling moves into
          v2.css. That is the same adaptation the handoff's 21st.dev convention asks for. */}
      {/* the curtain sits above the page and below the switch, so the control stays visible
          and clickable while the screen is covered */}
      <div aria-hidden="true"
           className={'v2curtain' + (phase === 'falling' ? ' is-down' : '')}
           style={{ background: curtainBg.current,
                    transition: phase === 'idle' ? 'none' : `transform ${DURATION}ms cubic-bezier(.76,0,.24,1)` }} />

      <label className="theme-switch">
        <input type="checkbox" className="theme-switch__checkbox"
               aria-label="Светлая тема"
               checked={light} onChange={(e) => switchTheme(e.target.checked)} />
        <div className="theme-switch__container">
          <div className="theme-switch__clouds" />
          <div className="theme-switch__stars-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 55" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M135.831 3.00688C135.055 3.85027 134.111 4.29946 133 4.35447C134.111 4.40947 135.055 4.85867 135.831 5.71123C136.607 6.55462 136.996 7.56303 136.996 8.72727C136.996 7.95722 137.172 7.25134 137.525 6.59129C137.886 5.93124 138.372 5.39954 138.98 5.00535C139.598 4.60199 140.268 4.39114 141 4.35447C139.88 4.2903 138.936 3.85027 138.16 3.00688C137.384 2.16348 136.996 1.16425 136.996 0C136.996 1.16425 136.607 2.16348 135.831 3.00688ZM31 23.3545C32.1114 23.2995 33.0551 22.8503 33.8313 22.0069C34.6075 21.1635 34.9956 20.1642 34.9956 19C34.9956 20.1642 35.3837 21.1635 36.1599 22.0069C36.9361 22.8503 37.8798 23.2903 39 23.3545C38.2679 23.3911 37.5976 23.602 36.9802 24.0053C36.3716 24.3995 35.8864 24.9312 35.5248 25.5913C35.172 26.2513 34.9956 26.9572 34.9956 27.7273C34.9956 26.563 34.6075 25.5546 33.8313 24.7112C33.0551 23.8587 32.1114 23.4095 31 23.3545ZM0 36.3545C1.11136 36.2995 2.05513 35.8503 2.83131 35.0069C3.6075 34.1635 3.99559 33.1642 3.99559 32C3.99559 33.1642 4.38368 34.1635 5.15987 35.0069C5.93605 35.8503 6.87982 36.2903 8 36.3545C7.26792 36.3911 6.59757 36.602 5.98015 37.0053C5.37155 37.3995 4.88644 37.9312 4.52481 38.5913C4.172 39.2513 3.99559 39.9572 3.99559 40.7273C3.99559 39.563 3.6075 38.5546 2.83131 37.7112C2.05513 36.8587 1.11136 36.4095 0 36.3545ZM56.8313 24.0069C56.0551 24.8503 55.1114 25.2995 54 25.3545C55.1114 25.4095 56.0551 25.8587 56.8313 26.7112C57.6075 27.5546 57.9956 28.563 57.9956 29.7273C57.9956 28.9572 58.172 28.2513 58.5248 27.5913C58.8864 26.9312 59.3716 26.3995 59.9802 26.0053C60.5976 25.602 61.2679 25.3911 62 25.3545C60.8798 25.2903 59.9361 24.8503 59.1599 24.0069C58.3837 23.1635 57.9956 22.1642 57.9956 21C57.9956 22.1642 57.6075 23.1635 56.8313 24.0069ZM81 25.3545C82.1114 25.2995 83.0551 24.8503 83.8313 24.0069C84.6075 23.1635 84.9956 22.1642 84.9956 21C84.9956 22.1642 85.3837 23.1635 86.1599 24.0069C86.9361 24.8503 87.8798 25.2903 89 25.3545C88.2679 25.3911 87.5976 25.602 86.9802 26.0053C86.3716 26.3995 85.8864 26.9312 85.5248 27.5913C85.172 28.2513 84.9956 28.9572 84.9956 29.7273C84.9956 28.563 84.6075 27.5546 83.8313 26.7112C83.0551 25.8587 82.1114 25.4095 81 25.3545ZM136 36.3545C137.111 36.2995 138.055 35.8503 138.831 35.0069C139.607 34.1635 139.996 33.1642 139.996 32C139.996 33.1642 140.384 34.1635 141.16 35.0069C141.936 35.8503 142.88 36.2903 144 36.3545C143.268 36.3911 142.598 36.602 141.98 37.0053C141.372 37.3995 140.886 37.9312 140.525 38.5913C140.172 39.2513 139.996 39.9572 139.996 40.7273C139.996 39.563 139.607 38.5546 138.831 37.7112C138.055 36.8587 137.111 36.4095 136 36.3545ZM101.831 49.0069C101.055 49.8503 100.111 50.2995 99 50.3545C100.111 50.4095 101.055 50.8587 101.831 51.7112C102.607 52.5546 102.996 53.563 102.996 54.7273C102.996 53.9572 103.172 53.2513 103.525 52.5913C103.886 51.9312 104.372 51.3995 104.98 51.0053C105.598 50.602 106.268 50.3911 107 50.3545C105.88 50.2903 104.936 49.8503 104.16 49.0069C103.384 48.1635 102.996 47.1642 102.996 46C102.996 47.1642 102.607 48.1635 101.831 49.0069Z" fill="currentColor" />
            </svg>
          </div>
          <div className="theme-switch__circle-container">
            <div className="theme-switch__sun-moon-container">
              <div className="theme-switch__moon">
                <div className="theme-switch__spot" />
                <div className="theme-switch__spot" />
                <div className="theme-switch__spot" />
              </div>
            </div>
          </div>
        </div>
      </label>

      {/* THE BAR NEVER LEAVES. It used to live inside the pinned stage and fade with the
          overlay, so it vanished a fifth of the way down and the page lost its navigation for
          the rest of the scroll. Fixed and outside the stage, it is the one thing on screen
          that is always true. It earns a tinted, blurred backdrop only once you have scrolled
          off the top, so the very first screen stays pure footage. */}
      <header className="v2nav">
        <a className="v2logo" href="#/">Solutions<b>101</b></a>
        <nav className="v2links">
          {/* ГЛАВНАЯ IS IN THE LIST. It used to be filtered out because the logo links home -
              but a logo is not a navigation item, and he proved it: he opened an inner page and
              could not find the way back. The one page everybody needs to return to cannot be
              the only one without a link. */}
          {PAGES.map((p) => (
            <a key={p.id} href={`#/${p.id}`}
               className={page === p.id ? 'is-on' : undefined}
               aria-current={page === p.id ? 'page' : undefined}>{p.nav}</a>
          ))}
        </nav>
        <a className="v2btn v2btn--go v2btn--sm" href="#/contacts">Оставить заявку</a>
      </header>

      {/* The strand belongs to the front page. On the inner pages it would be three and a
          half screens of scrolling between the reader and the thing they clicked for. */}
      {home && (
      <section className="v2stage" ref={stageRef} style={{ height: `${RUNWAY * 100}svh` }}>
        <div className="v2pin">
          <div className="v2bg">
            <video ref={nudge} src={SRC_H264} muted autoPlay playsInline preload="auto"
                   aria-hidden="true" tabIndex={-1} />
          </div>

          <div className="v2scrim" aria-hidden="true" />
          <div className="v2scrim v2scrim--mid" aria-hidden="true" />

          {/* THE STRAND IS THE STAGE, NOT THE SHOW. It was carrying the whole first screen
              alone and he was right that it read as empty - a visitor who lands on beautiful
              footage with no words does not learn who we are, which is the one job the brief
              gives this screen. So the navigation and the promise sit ON the footage, the way
              his reference does it, and both fade out as the strand takes over the scroll. */}
          {/* THE CHAPTERS. His ask: give the runway something to read from start to end. The
              strand takes 385svh to come apart and until now that was three and a half screens
              of footage with nothing to do, which is a lot to ask of anyone's patience.
              Each panel owns a slice of the scroll and fades through it, so the scroll earns
              its length: the strand is what you watch, these are what you learn. Short by
              instruction - ноль воды is the one rule Rainur repeated six times. */}
          <div className={location.search.includes('nopanel=1') ? 'v2chapters v2chapters--flat' : 'v2chapters'} aria-hidden="false">
            <article className="v2ch v2ch--1"><div className="v2glass">
              <p className="v2eyebrow">Что мы делаем</p>
              <h2>Собираем инструмент под вашу компанию</h2>
              <p>CRM под ваши этапы. Телефония с записью и автообзвоном. Боты, которые отвечают
                 по вашему прайсу. Сборщики, которые сводят прайсы поставщиков в одну таблицу.</p>
            </div></article>
            <article className="v2ch v2ch--2"><div className="v2glass">
              <p className="v2eyebrow">Как это устроено</p>
              <h2>Сначала прототип, деньги потом</h2>
              <p>Показываем работающую версию бесплатно. Нравится — 50% и мы доводим до сдачи.
                 Исходный код, документация и обучение сотрудников остаются у вас.</p>
            </div></article>
            <article className="v2ch v2ch--3"><div className="v2glass">
              <p className="v2eyebrow">Почему это работает</p>
              <h2>100% практики, ноль теории</h2>
              <p>Мы не продаём курсы и не консультируем. Отдаём готовое и настроенное.
                 С нашими инструментами уже работает логистическая компания «Негабарит-12».</p>
            </div></article>
          </div>

          <div className="v2over">
            <p className="v2eyebrow">Автоматизация бизнес-процессов</p>
            {/* the h1 stays for search engines and screen readers - the melt is two divs the
                library paints into, and neither carries the sentence in a readable form */}
            <h1 className="v2h1">Меняем <em>ДНК</em> вашего бизнеса</h1>
            <p className="v2lede">
              Процессы компании — это её ДНК. Мы переписываем их под вас: CRM, телефония,
              боты, сборщики данных. Прототип показываем до оплаты.
            </p>
            <div className="v2cta">
              <a className="v2btn v2btn--go" href="#request">Оставить заявку</a>
              <a className="v2btn v2btn--ghost" href="#tools">Посмотреть инструменты</a>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* and the real page begins. Each page is its own composition now - PAGES.md built.
          Sections carry GAIA-style numbering: real sequence, monospace eyebrow. */}
      <main className={home ? 'v2main' : 'v2main v2main--inner'}>

        {home && <>
        <div className="v2wrap">
          {/* proof before prose - the tiles count up once, from the honesty list only */}
          <dl className="v2figs">{FIGS.map((f) => <Fig f={f} key={f.b} />)}</dl>
        </div>

        <section className="v2sec" id="do"><div className="v2wrap">
          <p className="v2eyebrow">01 / Что мы делаем</p>
          <h2 className="v2h2">Пять инструментов, которые закрывают почти всё</h2>
          <div className="v2svcs">{SVC.map((s, i) => <SvcRow s={s} i={i} key={s.k} />)}</div>
        </div></section>

        <section className="v2sec" id="how"><div className="v2wrap">
          <p className="v2eyebrow">02 / Как мы работаем</p>
          <h2 className="v2h2">Сначала прототип, деньги потом</h2>
          <Process />
        </div></section>

        <section className="v2sec" id="clients"><div className="v2wrap">
          <p className="v2eyebrow">02 / С нами работают</p>
          <div className="v2clients"><span>Негабарит-12</span><em>логистика — работают с нашими инструментами</em></div>
          <p className="v2note">Список короткий, потому что честный. Он будет пополняться.</p>
        </div></section>

        <section className="v2sec v2sec--cta" id="request"><div className="v2wrap">
          <p className="v2eyebrow">04 / Заявка</p>
          <h2 className="v2h2">Расскажите, что делается руками</h2>
          <p className="v2lede">Ответим в течение рабочего дня. Прототип покажем бесплатно —
             платите, только если он вам подходит.</p>
          <Enquiry />
        </div></section>
        </>}

        {page === 'about' && <>
        <section className="v2sec" id="about"><div className="v2wrap">
          <p className="v2eyebrow">01 / Кто мы</p>
          <h1 className="v2h2">Не консультируем. Делаем.</h1>
          <div className="v2two">
            <p>У конкурентов 30% практики и 70% теории. У нас — 100% практики: мы не продаём
               курсы и не пишем стратегии. Мы отдаём работающий инструмент, настроенный под
               вашу компанию, с исходным кодом и обучением сотрудников.</p>
            <p>Команда из 3–4 человек, образование — Лондон. Пишем сами, не перепродаём
               подрядчиков: тот, кто говорит с вами о задаче, её и делает.</p>
          </div>
        </div></section>

        <section className="v2sec" id="why"><div className="v2wrap">
          <p className="v2eyebrow">02 / Почему маленькая команда — это фича</p>
          <ul className="v2why">
            <li>Дизайн и разработка в одних руках: кто придумал интерфейс, тот его и построил.</li>
            <li>Решения принимаются за день, а не циклами согласований.</li>
            <li>Инструмент существует ради денег: выиграть клиентов, срезать ручной труд, открыть выручку.</li>
            <li>Прототип бесплатно — потому что уверены, что он вам подойдёт.</li>
          </ul>
        </div></section>

        <section className="v2sec" id="industries"><div className="v2wrap">
          <p className="v2eyebrow">03 / Отрасли</p>
          <h2 className="v2h2">Работаем со всеми</h2>
          <p className="v2lede">Инструмент собирается под процесс, а не под отрасль — поэтому
             заходим и туда, где до нас никто ничего не автоматизировал.</p>
          <div className="v2inds">
            {['Логистика', 'Оптовая торговля', 'Строительство', 'Юридические фирмы', 'Производство', 'Услуги'].map((t) => (
              <div className="v2glass v2ind" key={t}>{t}</div>
            ))}
          </div>
        </div></section>
        </>}

        {page === 'services' && (
        <section className="v2sec" id="services"><div className="v2wrap">
          <p className="v2eyebrow">01 / Услуги</p>
          <h1 className="v2h2">По типу клиента, а не по технологии</h1>
          <p className="v2lede">Найдите свою отрасль — задачи в ней мы уже решали или решаем.</p>
          {INDUSTRIES.map((ind) => (
            <div className="v2branch" key={ind.t}>
              <h3 className="v2branch__head">{ind.t}</h3>
              <ul className="v2branch__list">
                {ind.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
          <p className="v2note">Вашей отрасли нет в списке? Это список сделанного, а не
             границы. Опишите процесс в <a href="#contacts">заявке</a> — разбор бесплатный.</p>
        </div></section>
        )}

        {page === 'tools' && <>
        <section className="v2sec" id="tools"><div className="v2wrap">
          <p className="v2eyebrow">01 / Инструменты</p>
          <h1 className="v2h2">Что можно взять по отдельности</h1>
          <p className="v2lede">Каждый инструмент ставится сам по себе и работает без
             остальных. Цена зависит от объёма, поэтому она — вилка, а не «от»: бот на три
             сценария и бот, считающий по прайсу из 4000 позиций, — разные работы.</p>
          <ul className="v2tools">
            {TOOLS.map((t) => (
              <li key={t.t}><b>{t.t}</b><span>{t.d}</span></li>
            ))}
          </ul>
        </div></section>
        <section className="v2sec v2sec--cta"><div className="v2wrap">
          <p className="v2eyebrow">02 / Цена</p>
          <h2 className="v2h2">Прототип — бесплатно</h2>
          <p className="v2lede">Точную вилку называем после бесплатного разбора — час
             разговора о том, что у вас делается руками. Дальше 50% вперёд, остаток по
             сдаче. Исходный код, документация и обучение входят в цену.</p>
          <div className="v2cta"><a className="v2btn v2btn--go" href="#contacts">На разбор</a></div>
        </div></section>
        </>}

        {page === 'works' && <>
        <section className="v2sec" id="works"><div className="v2wrap">
          <p className="v2eyebrow">01 / Работы</p>
          <h1 className="v2h2">Что уже стоит и работает</h1>
          <div className="v2grid">
            <article className="v2card">
              <h3>Аукцион автозапчастей</h3>
              <p>Торговая площадка: лоты, ставки в реальном времени, сделка уезжает в 1С
                 без перепечатывания. Работает у продавца автозапчастей.</p>
              <p className="v2card__win">Подключена к 1С</p>
            </article>
            <article className="v2card">
              <h3>Учёт взаиморасчётов</h3>
              <p>Строительная группа: три юрлица, мультивалюта, 48 контрагентов.
                 Долги и переплаты видны по каждому, платёжный календарь показывает, что горит.</p>
              <p className="v2card__win">Собрано за один день</p>
            </article>
            <article className="v2card">
              <h3>Сборщик прайсов</h3>
              <p>Двенадцать форматов прайс-листов от поставщиков — xls, pdf, письма, выгрузки —
                 читаются и сводятся в одну таблицу без участия человека.</p>
              <p className="v2card__win">Никто не переносит цифры руками</p>
            </article>
            <article className="v2card">
              <h3>Телефония и автообзвон</h3>
              <p>Звонки с записью, автоматический обзвон базы, проверка контрагента по
                 реквизитам до сделки. Всё привязано к карточке клиента.</p>
              <p className="v2card__win">Заявка не теряется в мессенджерах</p>
            </article>
          </div>
        </div></section>
        <section className="v2sec" id="clients"><div className="v2wrap">
          <p className="v2eyebrow">02 / С нами работают</p>
          <div className="v2clients"><span>Негабарит-12</span><em>логистика — работают с нашими инструментами</em></div>
          <p className="v2note">Список короткий, потому что честный. Он будет пополняться.</p>
        </div></section>

        <section className="v2sec v2sec--cta" id="request"><div className="v2wrap">
          <p className="v2eyebrow">04 / Заявка</p>
          <h2 className="v2h2">Расскажите, что делается руками</h2>
          <p className="v2lede">Ответим в течение рабочего дня. Прототип покажем бесплатно —
             платите, только если он вам подходит.</p>
          <Enquiry />
        </div></section>
        </>}

        {page === 'about' && <>
        <section className="v2sec" id="about"><div className="v2wrap">
          <p className="v2eyebrow">01 / Кто мы</p>
          <h2 className="v2h2">Не консультируем. Делаем.</h2>
          <div className="v2two">
            <p>У конкурентов 30% практики и 70% теории. У нас — 100% практики: мы не продаём
               курсы и не пишем стратегии. Мы отдаём работающий инструмент, настроенный под
               вашу компанию, с исходным кодом и обучением сотрудников.</p>
            <p>Команда из 3–4 человек, образование — Лондон. Пишем сами, не перепродаём
               подрядчиков: тот, кто говорит с вами о задаче, её и делает.</p>
          </div>
        </div></section>

        <section className="v2sec" id="why"><div className="v2wrap">
          <p className="v2eyebrow">02 / Почему маленькая команда — это фича</p>
          <ul className="v2why">
            <li>Дизайн и разработка в одних руках: кто придумал интерфейс, тот его и построил.</li>
            <li>Решения принимаются за день, а не циклами согласований.</li>
            <li>Инструмент существует ради денег: выиграть клиентов, срезать ручной труд, открыть выручку.</li>
            <li>Прототип бесплатно — потому что уверены, что он вам подойдёт.</li>
          </ul>
        </div></section>

        <section className="v2sec" id="industries"><div className="v2wrap">
          <p className="v2eyebrow">03 / Отрасли</p>
          <h2 className="v2h2">Работаем со всеми</h2>
          <p className="v2lede">Инструмент собирается под процесс, а не под отрасль — поэтому
             заходим и туда, где до нас никто ничего не автоматизировал.</p>
          <div className="v2inds">
            {['Логистика', 'Оптовая торговля', 'Строительство', 'Юридические фирмы', 'Производство', 'Услуги'].map((t) => (
              <div className="v2glass v2ind" key={t}>{t}</div>
            ))}
          </div>
        </div></section>
        </>}

        {page === 'services' && (
        <section className="v2sec" id="services"><div className="v2wrap">
          <p className="v2eyebrow">01 / Услуги</p>
          <h2 className="v2h2">По типу клиента, а не по технологии</h2>
          <p className="v2lede">Найдите свою отрасль — задачи в ней мы уже решали или решаем.</p>
          {INDUSTRIES.map((ind) => (
            <div className="v2branch" key={ind.t}>
              <h3 className="v2branch__head">{ind.t}</h3>
              <ul className="v2branch__list">
                {ind.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </div>
          ))}
          <p className="v2note">Вашей отрасли нет в списке? Это список сделанного, а не
             границы. Опишите процесс в <a href="#contacts">заявке</a> — разбор бесплатный.</p>
        </div></section>
        )}

        {page === 'tools' && <>
        <section className="v2sec" id="tools"><div className="v2wrap">
          <p className="v2eyebrow">01 / Инструменты</p>
          <h2 className="v2h2">Что можно взять по отдельности</h2>
          <p className="v2lede">Каждый инструмент ставится сам по себе и работает без
             остальных. Цена зависит от объёма, поэтому она — вилка, а не «от»: бот на три
             сценария и бот, считающий по прайсу из 4000 позиций, — разные работы.</p>
          <ul className="v2tools">
            {TOOLS.map((t) => (
              <li key={t.t}><b>{t.t}</b><span>{t.d}</span></li>
            ))}
          </ul>
        </div></section>
        <section className="v2sec v2sec--cta"><div className="v2wrap">
          <p className="v2eyebrow">02 / Цена</p>
          <h2 className="v2h2">Прототип — бесплатно</h2>
          <p className="v2lede">Точную вилку называем после бесплатного разбора — час
             разговора о том, что у вас делается руками. Дальше 50% вперёд, остаток по
             сдаче. Исходный код, документация и обучение входят в цену.</p>
          <div className="v2cta"><a className="v2btn v2btn--go" href="#contacts">На разбор</a></div>
        </div></section>
        </>}

        {page === 'works' && <>
        <section className="v2sec" id="works"><div className="v2wrap">
          <p className="v2eyebrow">01 / Работы</p>
          <h2 className="v2h2">Что уже стоит и работает</h2>
          <div className="v2grid">
            <article className="v2card">
              <h3>Аукцион автозапчастей</h3>
              <p>Торговая площадка: лоты, ставки в реальном времени, сделка уезжает в 1С
                 без перепечатывания. Работает у продавца автозапчастей.</p>
              <p className="v2card__win">Подключена к 1С</p>
            </article>
            <article className="v2card">
              <h3>Учёт взаиморасчётов</h3>
              <p>Строительная группа: три юрлица, мультивалюта, 48 контрагентов.
                 Долги и переплаты видны по каждому, платёжный календарь показывает, что горит.</p>
              <p className="v2card__win">Собрано за один день</p>
            </article>
            <article className="v2card">
              <h3>Сборщик прайсов</h3>
              <p>Двенадцать форматов прайс-листов от поставщиков — xls, pdf, письма, выгрузки —
                 читаются и сводятся в одну таблицу без участия человека.</p>
              <p className="v2card__win">Никто не переносит цифры руками</p>
            </article>
            <article className="v2card">
              <h3>Телефония и автообзвон</h3>
              <p>Звонки с записью, автоматический обзвон базы, проверка контрагента по
                 реквизитам до сделки. Всё привязано к карточке клиента.</p>
              <p className="v2card__win">Заявка не теряется в мессенджерах</p>
            </article>
          </div>
        </div></section>
        <section className="v2sec" id="clients"><div className="v2wrap">
          <p className="v2eyebrow">02 / С нами работают</p>
          <div className="v2clients"><span>Негабарит-12</span><em>логистика</em></div>
        </div></section>
        </>}

        {page === 'contacts' && (
        <section className="v2sec" id="request"><div className="v2wrap">
          <p className="v2eyebrow">01 / Заявка</p>
          <h1 className="v2h2">Расскажите, что делается руками</h1>
          <p className="v2lede">Ответим в течение рабочего дня. Первый разговор — час,
             бесплатно, без обязательств.</p>
          <Enquiry />
        </div></section>
        )}

        <footer className="v2sec v2foot" id="contacts"><div className="v2wrap">
          <div className="v2two">
            <div>
              <p className="v2eyebrow">Контакты</p>
              <p className="v2foot__big">Solutions<b>101</b></p>
              <p className="v2note">Автоматизация бизнес-процессов</p>
            </div>
            <ul className="v2contacts">
              <li><span>Telegram</span><a href="https://t.me/">указать</a></li>
              <li><span>WhatsApp</span><a href="https://wa.me/">указать</a></li>
              <li><span>Почта</span><a href="mailto:">указать</a></li>
              <li><span>Телефон</span><a href="tel:">указать</a></li>
            </ul>
          </div>
        </div></footer>
      </main>
    </>
  )
}
