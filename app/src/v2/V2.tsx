import { useCallback, useEffect, useRef, useState } from 'react'
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
   degraded originals that made interpolation a dirty word on this page. The 4K tier stays 25fps
   because 50fps at 3840x2160 is a ~95MB download, which no hero video can justify. */
const DPR = Math.min(devicePixelRatio || 1, 3)
const NEED = Math.max(innerWidth * DPR, (innerHeight * DPR * 16) / 9)
const TIER =
  innerWidth < 700 ? 'sm'        /* phones - decode cost rules here, see above */
  : innerWidth < 1100 ? 'md'     /* tablets */
  : NEED > 3200 ? '4k'           /* an actual 4K display */
  : 'hq'                         /* laptops and ordinary monitors */
/* TWO CODECS PER TIER, and the browser picks - which is also what keeps Windows and Android
   working. HEVC is offered first and H.264 second, as two <source> children; any browser that
   cannot decode HEVC skips that line and takes the H.264, which is the most universally
   supported video codec there is. Nothing is sniffed, nothing is guessed - the failure mode is
   a browser choosing the file it already told us it can play.
   HEVC is worth the second encode because it is roughly half the bytes at the same quality and
   is hardware-decoded on every Apple device, and half the bytes is exactly what paid for 50fps
   everywhere: the phone's 25fps H.264 was 8.9MB, its 50fps HEVC is 8.6MB. Twice the frame rate
   for slightly fewer bytes.
   The 4K tier stays 25fps - interpolating 3840x2160 to 50 buys motion nobody sitting at a 4K
   monitor is studying, at a download that no hero video can justify. */
/* SMALL SCREENS GET SMOOTHNESS, BIG SCREENS GET SHARPNESS - and that split is forced by
   arithmetic, not taste. There are only 293 REAL frames; 50fps means inventing every second
   one, and an invented frame is the same mush this page spent the morning deleting. Measured
   on identical crops: a real frame's PNG carries 13% more detail than the interpolated frame
   at the same instant, and the scale texture on the strand visibly smears.
   At 720p on a phone that softness is invisible and the motion is what the eye tracks, so
   phones and tablets take the 50fps files. On a 1440p laptop it is plainly visible - he saw it
   unprompted - so laptops and 4K displays take REAL frames only at 25fps. Nothing invented on
   any screen that could resolve the difference. */
const FPS = TIER === 'sm' || TIER === 'md' ? 50 : 25
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
const SRC_HEVC =
  TIER === 'sm' ? '/dna-loop-sm.hevc.mp4?v=7'
  : TIER === 'md' ? '/dna-loop.hevc.mp4?v=7'
  /* 2800, not 3200, because HEVC is cheap enough that a retina laptop can have the 4K master
     and stop being upscaled at all - his Mac asks for 2880. A plain 1080p monitor asks for
     1920 and takes the 1440p file, because sending it 4K would be bytes it cannot paint. */
  : NEED > 2800 ? '/dna-loop-4k.hevc.mp4?v=7'
  : '/dna-loop-hq.hevc.mp4?v=7'
const SRC_H264 =
  TIER === 'sm' ? '/dna-loop-sm.mp4?v=7'
  : TIER === 'md' ? '/dna-loop.mp4?v=7'
  : '/dna-loop-hq.mp4?v=7'

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
const SERVICES = [
  { t: 'Счета, акты, сверка',
    d: 'Документы собираются из состояния сделки, долги и переплаты видны по каждому контрагенту, платёжный календарь сам показывает, что горит.',
    w: 'Закрытие месяца за день вместо недели' },
  { t: 'Заявки, клиенты, звонки',
    d: 'CRM под ваши этапы, телефония с записью разговоров, автообзвон по базе, проверка компании по реквизитам перед сделкой.',
    w: 'Ни одна заявка не теряется в мессенджерах' },
  { t: 'Сбор данных',
    d: 'Сайты конкурентов, прайсы поставщиков в двенадцати форматах, почта, выгрузки из 1С и маркетплейсов — всё стекается в одну таблицу само.',
    w: 'Никто не переносит цифры руками' },
  { t: 'Отчёты руководителю',
    d: 'Один экран с деньгами, долгами, загрузкой и просрочками. Письмо в тот час, когда показатель вышел за границу, а не через месяц на планёрке.',
    w: 'Цифры утром, а не в конце квартала' },
  { t: 'Боты и ИИ',
    d: 'Отвечают клиенту по вашему прайсу и остаткам, читают счета и договоры, заполняют формы, заносят контакт в базу и передают человеку сложное.',
    w: 'Первая линия работает ночью и в выходные' },
  { t: 'Склад и доставка',
    d: 'Заказы, остатки, маршруты и статусы отгрузок на одной доске. Клиент видит, где его груз, без звонка менеджеру.',
    w: 'Меньше звонков, меньше потерянных заказов' },
]

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

export default function V2() {
  const page = usePage()
  const home = page === ''
  /* Light and dark are the SAME clip. The donor's light hero is not a second video, it is the
     same footage with `invert` over a pale background - so the switch costs one CSS filter and
     no extra download. The strand is white on cream in light, dark on near-black in dark. */
  const [light, setLight] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle('v2light', light)
  }, [light])

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
  const stageRef = useRef<HTMLElement | null>(null)
  const scrollP = useRef(0)      /* progress through the runway, 0..1 */
  const offscreen = useRef(false) /* header fully scrolled away - stop burning battery */
  const rawY = useRef(0)          /* unclamped scroll position - what the SCRUB reads */
  const travelPx = useRef(1)      /* runway length, so a full pass is still one pass */

  const nudge = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (!el) return
    /* iOS will not let a video be SEEKED until it has been allowed to play at least once, and
       in Low Power Mode it will not autoplay at all - so play, immediately pause, and ask
       again on the first real gesture if it was refused. Same lesson as the live page. */
    const arm = () => {
      el.play().then(() => el.pause()).catch(() => { /* wait for a gesture */ })
    }
    arm()
    addEventListener('touchstart', arm, { once: true, passive: true })
    addEventListener('click', arm, { once: true })
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
      rawY.current = scrollY
      travelPx.current = Math.max(1, travel)
      /* the overlay hands the screen to the strand over the first fifth of the runway - one
         custom property, read by opacity and a small translate, both compositor-only. */
      const p = scrollP.current
      stage.style.setProperty('--over', String(Math.max(0, 1 - p * 5)))
      /* Each chapter owns a slice of the runway and fades in and out across it. A trapezoid,
         not a triangle: it reaches full opacity and HOLDS there for the middle of its slice,
         so there is time to actually read it instead of one legible instant. */
      const band = (a: number, b: number) => {
        const f = (b - a) * 0.28
        return String(Math.max(0, Math.min(1, Math.min((p - a) / f, (b - p) / f))))
      }
      stage.style.setProperty('--c1', band(0.20, 0.44))
      stage.style.setProperty('--c2', band(0.46, 0.70))
      stage.style.setProperty('--c3', band(0.72, 0.97))
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
    let pos = 0    /* fraction of the clip on screen, the one true state */
    let dir = 1    /* idle playback direction; scrubbing re-aims it so release carries on */
    let lastY = 0
    let quiet = 9  /* seconds since the last real INPUT - the only thing that arms the loop */
    let touching = false
    let last = performance.now()
    let lastSeek = 0

    const tick = (now: number) => {
      if (!alive) return
      raf = requestAnimationFrame(tick)
      const el = videoRef.current
      if (!el || !el.duration || Number.isNaN(el.duration)) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const dp = (rawY.current - lastY) / travelPx.current
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
      let raw = pos + dp
      let bounces = 0
      while (raw > 1 || raw < 0) { raw = raw > 1 ? 2 - raw : -raw; bounces++ }
      pos = raw

      /* A SCROLL EVENT IS NOT AN INPUT. This is the third attempt at the handoff and the first
         one that satisfies both things he asked for, because the two earlier ones each solved
         one and broke the other:

           - a VELOCITY blend read slow scrolling as stopped, so the loop overpowered his finger
             and kept destroying the strand while he scrolled up;
           - gating on scroll SILENCE fixed that, but silence only arrives once iOS momentum has
             finished, which is precisely the crawling tail he wanted hidden - "there is like a
             slight wait" and "the video should continue a bit before".

         Both fall out of the same mistake: treating scroll events as evidence the user is
         scrolling. During momentum the finger is already off the glass. The page is gliding,
         not being driven. So the loop is armed by INPUT - touch and wheel - and momentum, which
         fires scroll but neither of those, no longer holds it off. The strand starts moving
         while the page is still gliding, which is exactly the ask: the loop's motion covers the
         crawl instead of the crawl being the motion.
         And while a finger is actually down, idle is pinned to zero, so no amount of slow,
         deliberate scrolling can ever be overpowered again. */
      /* an odd number of bounces means the strand is now travelling the OTHER way, so the loop
         must carry on rebuilding rather than snapping back to destroying when you let go */
      if (dp !== 0) dir = (dp > 0 ? 1 : -1) * (bounces % 2 ? -1 : 1)
      if (touching) quiet = 0; else quiet += dt

      /* TWO GATES ON THE LOOP, for the two ways a human is still in charge:
         - quiet: seconds since real INPUT (finger, wheel). A finger on the glass pins the
           loop off entirely, so slow deliberate scrolling can never be overpowered.
         - calm: how fast the page is actually MOVING. This one is for the glide. The loop
           exists to cover the slow crawl at the END of a flick - but ramping it to full while
           the page was still flying meant two motions writing frames at once, which is the
           fast-scroll lag he reported on the phone. Fast glide -> the scrub owns the frames
           alone, exactly like the pre-loop days; as the glide decays toward the crawl the
           loop fades in and swallows the tail. Finger-down safety is untouched because calm
           only ever multiplies idle, never replaces it. */
      /* THE HANDOVER SITS AT THE TOP OF THE DECAY NOW. Twice was not enough - he still read the
         tail as lag - so the loop takes the page as calm at four times the old speed, and the
         window is squared so it reaches full strength almost as soon as the flick starts
         bleeding off rather than creeping up over the whole glide. In practice the strand is
         moving under its own power about a second earlier than it was.
         It is still a MULTIPLIER on the input gate, which is what keeps it safe: a finger on
         the glass pins idle to zero regardless, so none of this can overpower a real scroll.
         Only a page that is coasting untouched can be taken over. */
      /* He says he still cannot see a difference, and the reason is that SQUARING the window
         was undoing the threshold I kept raising: at half the cut-off speed a squared window is
         only a quarter open, so the loop stayed suppressed through most of the glide however
         high the number went. Dropped the square and raised the cut-off to 2.5, so the loop is
         already at 60% strength while the page is still travelling at a fair clip and reaches
         full long before the crawl. That is the "two seconds earlier" - the change is in the
         SHAPE of the ramp, not just where it starts.
         Safety is unchanged and does not depend on this number: a finger on the glass pins
         idle to zero through the other gate, so only a page coasting untouched is ever taken. */
      const calm = Math.min(1, Math.max(0, 1 - Math.abs(dp) / dt / 2.5))
      /* AT A PINNED END, THE RAMP BUYS NOTHING. The gates exist so the loop never fights the
         scrub - but once pos is clamped hard against 0 or 1, scrolling further that way moves
         nothing, so there is no fight left to lose. Waiting the full 0.25s there just parks
         the strand on the destroyed frame: his "it holds there for a good half a second"
         before it bounces. Pinned means the loop starts at once. */
      const pinned = (pos >= 1 && dir === 1) || (pos <= 0 && dir === -1)
      const idle = pinned ? 1 : Math.min(1, Math.max(0, (quiet - 0.05) / 0.2)) * calm

      /* THE LOOP IS A PENDULUM, NOT A METRONOME. Every complaint that survived the earlier
         fixes traced back to the loop being a second (and at one point third) controller
         fighting the scroll for one variable - anchors ambushing the strand on the way back
         up, native playback discarding momentum deltas so the flick's end stuttered, and a
         constant-speed loop slamming into the ends and reversing "too fast, not smooth".

         All of it is gone by construction now. The loop's position is a point on a cosine
         wave: pos = (1 - cos θ) / 2. Advancing θ at a constant rate makes the strand's speed
         a sine - naturally ZERO at both ends, full in the middle. The turnaround cannot be
         abrupt, because arriving at an end and slowing to a stop are the same thing. No
         reflection branch, no direction flip to mistime - the wave carries it through.

         The scrub stays a plain delta on pos, and each frame θ is re-derived from wherever
         pos actually is, so the two hands can never disagree: scrub moves the point along the
         wave, the loop continues the wave from that exact point. dp keeps adding during iOS
         momentum while idle ramps in, so the glide's crawl is covered by loop motion instead
         of being the only motion - and while a finger is down, idle is pinned to zero, so slow
         deliberate scrolling can never be overpowered.

         Native playback is gone on purpose. It saved decode work but discarded scroll deltas
         while cruising - his "it tried at the same time to finish my scroll and continue the
         video". One mechanism, eased seeks, everywhere: at 30Hz against files that decode
         sequentially at 610fps here, the whole loop costs a few percent of one core. */
      /* EASED, WITH A FLOOR. The pure cosine wave dwelt too long at the ends: its speed goes
         all the way to zero there, and at zero-ish speed the 25fps frame grid updates three
         to eight times a second - sparse updates that his eye correctly read as LAG, both
         when the loop arrived at an end by itself and when he scrolled it there. So the
         bell curve stays (2*sqrt(pos*(1-pos)) is the same sine ease in closed form), but
         speed never drops below 40% - which keeps frame updates above ~15 a second at the
         very turnaround. The flip is explicit again, but at 0.4 of an eased approach it is
         a soft catch, nothing like the full-speed slam he first complained about.
         The end-press guard stays: while a glide holds the strand against a clamp, the loop
         waits rather than flickering against it. */
      if (idle > 0 && !(pos >= 1 && dp > 0) && !(pos <= 0 && dp < 0)) {
        const bell = Math.max(2 * Math.sqrt(pos * (1 - pos)), 0.55)
        pos += dir * (Math.PI / (2 * el.duration)) * bell * dt * idle
        if (pos >= 1) { pos = 1; dir = -1 }
        if (pos <= 0) { pos = 0; dir = 1 }
      }

      /* NEVER SEEK FASTER THAN THE CLIP HAS FRAMES. rAF runs at 60Hz (120 on a ProMotion
         screen) and a fast scroll changes the target frame every single time, so this was
         firing up to 60 seeks a second at a clip that only holds 25 distinct frames a second -
         more than half of them decoding a picture identical to the one already on screen.
         Every seek also flushes the decode pipeline, and these frames are all-intra 2560x1440,
         which is the most expensive kind to decode cold. 30Hz is above the content rate, so
         nothing visible is lost and roughly half the decode work disappears. */
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
    const wheeled = () => { quiet = 0 }
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
          {PAGES.filter((p) => p.id !== '').map((p) => (
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
            <video ref={nudge} muted playsInline preload="auto">
              <source src={SRC_HEVC} type='video/mp4; codecs="hvc1"' />
              <source src={SRC_H264} type='video/mp4; codecs="avc1.640028"' />
            </video>
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
          <div className="v2chapters" aria-hidden="false">
            <article className="v2ch v2ch--1">
              <p className="v2eyebrow">Что мы делаем</p>
              <h2>Собираем инструмент под вашу компанию</h2>
              <p>CRM под ваши этапы. Телефония с записью и автообзвоном. Боты, которые отвечают
                 по вашему прайсу. Сборщики, которые сводят прайсы поставщиков в одну таблицу.</p>
            </article>
            <article className="v2ch v2ch--2">
              <p className="v2eyebrow">Как это устроено</p>
              <h2>Сначала прототип, деньги потом</h2>
              <p>Показываем работающую версию бесплатно. Нравится — 50% и мы доводим до сдачи.
                 Исходный код, документация и обучение сотрудников остаются у вас.</p>
            </article>
            <article className="v2ch v2ch--3">
              <p className="v2eyebrow">Почему это работает</p>
              <h2>100% практики, ноль теории</h2>
              <p>Мы не продаём курсы и не консультируем. Отдаём готовое и настроенное.
                 С нашими инструментами уже работает логистическая компания «Негабарит-12».</p>
            </article>
          </div>

          <div className="v2over">
            <p className="v2eyebrow">Автоматизация бизнес-процессов</p>
            <h1 className="v2h1">Быстро <em>не значит</em> плохо</h1>
            <p className="v2lede">
              Не консультируем и не учим теории — отдаём работающие инструменты
              под вашу компанию. Прототип показываем до оплаты.
            </p>
            <div className="v2cta">
              <a className="v2btn v2btn--go" href="#request">Оставить заявку</a>
              <a className="v2btn v2btn--ghost" href="#tools">Посмотреть инструменты</a>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* and the real page begins */}
      <main className={home ? 'v2main' : 'v2main v2main--inner'}>
        <div className="v2wrap">
          {/* The headline used to be repeated here, and once it moved onto the strand that
              made the visitor read the same sentence twice in a row. The page below the
              header opens on PROOF instead - which is also the order his reference uses and
              the order the brief asks for: promise on the picture, numbers underneath. */}
          <dl className="v2figs">
            <div className="v2fig">
              <dt><i>0</i> ₽</dt>
              <dd><b>за прототип</b><span>платите 50% после того, как увидите его в работе</span></dd>
            </div>
            <div className="v2fig">
              <dt><i>1</i> день</dt>
              <dd><b>на учёт взаиморасчётов</b><span>строительная группа, три юрлица и мультивалюта</span></dd>
            </div>
            <div className="v2fig">
              <dt><i>48</i></dt>
              <dd><b>контрагентов в одном учёте</b><span>долги и переплаты видны по каждому</span></dd>
            </div>
            <div className="v2fig">
              <dt><i>12</i></dt>
              <dd><b>форматов прайсов</b><span>сборщик читает их и сводит в одну таблицу</span></dd>
            </div>
          </dl>
        </div>

        {(home || page === 'about') && (
        <section className="v2sec" id="about"><div className="v2wrap">
          <p className="v2eyebrow">О нас</p>
          <h2 className="v2h2">Не консультируем. Делаем.</h2>
          <div className="v2two">
            <p>Мы небольшая команда разработчиков — четыре человека, лондонское техническое
               образование, каждый день пишем то, что потом работает у клиента в проде.
               Не курсы, не методички, не «стратегические сессии».</p>
            <p>Работаем по всем отраслям и под каждого — отдельно. Логистика, строительство,
               торговля, услуги: процессы у всех свои, поэтому коробочных решений мы не
               продаём. Сначала смотрим, как у вас устроено, потом собираем инструмент.</p>
          </div>
        </div></section>
        )}

        {(home || page === 'services') && (
        <section className="v2sec" id="services"><div className="v2wrap">
          <p className="v2eyebrow">Услуги</p>
          <h2 className="v2h2">Что умеем и что это снимает с вас</h2>
          <div className="v2grid">
            {SERVICES.map((s) => (
              <article className="v2card" key={s.t}>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <p className="v2card__win">{s.w}</p>
              </article>
            ))}
          </div>
        </div></section>
        )}

        {(home || page === 'tools') && (
        <section className="v2sec" id="tools"><div className="v2wrap">
          <p className="v2eyebrow">Инструменты</p>
          <h2 className="v2h2">Что можно взять по отдельности</h2>
          <p className="v2lede">Каждый инструмент ставится сам по себе и работает без
             остальных. Цена зависит от объёма — считаем на разборе, он бесплатный.</p>
          <ul className="v2tools">
            {TOOLS.map((t) => (
              <li key={t.t}><b>{t.t}</b><span>{t.d}</span></li>
            ))}
          </ul>
        </div></section>
        )}

        {(home || page === 'works') && (
        <section className="v2sec" id="works"><div className="v2wrap">
          <p className="v2eyebrow">Наши работы</p>
          <h2 className="v2h2">Что уже стоит и работает</h2>
          <div className="v2grid">
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
        )}

        {(home || page === 'works') && (
        <section className="v2sec" id="clients"><div className="v2wrap">
          <p className="v2eyebrow">С нами работают</p>
          <h2 className="v2h2">Кому мы уже что-то починили</h2>
          <div className="v2clients"><span>Негабарит-12</span><em>логистика</em></div>
          <p className="v2note">Список короткий, потому что честный. Он будет пополняться.</p>
        </div></section>
        )}

        {(home || page === 'contacts') && (
        <section className="v2sec v2sec--cta" id="request"><div className="v2wrap">
          <p className="v2eyebrow">Заявка</p>
          <h2 className="v2h2">Расскажите, что болит</h2>
          <p className="v2lede">Опишите процесс, который отнимает время. Ответим в течение
             рабочего дня, разбор и прототип — бесплатно.</p>
          <div className="v2cta">
            <a className="v2btn v2btn--go" href="#contacts">Написать нам</a>
          </div>
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
