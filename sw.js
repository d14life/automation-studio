/* THE STRAND, KEPT. Nothing else.
 *
 * GitHub Pages builds its ETag as "mtime-size", and a deploy rewrites every file's mtime -
 * measured on 5 August: the video's ETag went 6a72a13a-2656316 -> 6a72a2da-2656316 across a
 * deploy that did not touch the file. Different ETag means the browser's HTTP cache is void
 * and all 40MB come down again. Pages serves fixed headers, so this cannot be fixed with
 * configuration; it has to be fixed with storage the ETag does not reach. Cache Storage is
 * keyed by URL alone, so once the strand is in here a deploy cannot evict it.
 *
 * THREE RULES THIS FILE KEEPS, because a service worker on the root scope can break a whole
 * site and this one sits under both index.html and v2.html:
 *
 *   1. It touches ONE pattern. Anything that is not /dna-loop*.mp4 is not intercepted at all -
 *      no HTML, no JS, no CSS, no fonts. A stale-page bug is the classic service worker
 *      disaster and the only real defence is to never hold the page.
 *   2. A miss is a no-op. If the video is not already cached this handler does not call
 *      respondWith, so the browser does exactly what it does today: normal range requests,
 *      streaming, first paint unchanged. It can make a repeat visit faster; it cannot make a
 *      first visit slower.
 *   3. The cache is filled only when the page says so, and the page only says so once the
 *      video has finished buffering - so the copy is pulled while the file is still fresh in
 *      the HTTP cache, which makes it a local copy rather than a second download.
 *
 * KILL SWITCH: if this ever misbehaves, replace the body of this file with
 *   self.addEventListener('install', () => self.registration.unregister())
 * and deploy. Every browser drops it on its next update check.
 */
const CACHE = 'dna-v1'
const MINE = /\/dna-loop[\w.-]*\.mp4$/

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

/* The 40MB sits in memory only while the worker is alive - the browser kills an idle worker
   and reclaims it. Without this every seek would re-read the whole blob out of Cache Storage,
   and at 50 seeks a second that is not a cache, it is a treadmill. */
let memo = null   /* {key, buf} */

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  if (url.origin !== location.origin || !MINE.test(url.pathname)) return
  e.respondWith(fromCacheOrNetwork(e.request))
})

async function fromCacheOrNetwork(req) {
  const key = req.url
  try {
    let buf = memo && memo.key === key ? memo.buf : null
    if (!buf) {
      const hit = await caches.open(CACHE).then(c => c.match(key))
      if (!hit) return fetch(req)          /* rule 2: not cached, behave exactly as before */
      buf = await hit.arrayBuffer()
      memo = { key, buf }
    }
    return slice(req, buf)
  } catch {
    return fetch(req)                       /* any surprise at all: hand it back to the network */
  }
}

/* A <video> asks for byte ranges, so a cached copy has to answer 206 the way the server would.
   Getting this wrong does not degrade playback, it stops it - so the parse is explicit about
   all three forms the header takes and refuses anything it does not recognise. */
function slice(req, buf) {
  const size = buf.byteLength
  const head = { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes' }
  const range = req.headers.get('range')
  if (!range) {
    return new Response(buf, { status: 200, headers: { ...head, 'Content-Length': String(size) } })
  }
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim())
  if (!m || (m[1] === '' && m[2] === '')) return fetch(req)

  let start, end
  if (m[1] === '') {                        /* "bytes=-500": the LAST 500 bytes, not the first */
    const n = parseInt(m[2], 10)
    start = Math.max(0, size - n)
    end = size - 1
  } else {
    start = parseInt(m[1], 10)
    end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1)
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
    return new Response(null, { status: 416, headers: { ...head, 'Content-Range': `bytes */${size}` } })
  }
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: { ...head,
      'Content-Length': String(end - start + 1),
      'Content-Range': `bytes ${start}-${end}/${size}` },
  })
}

/* Filled on the page's word, never on our own. The key is the full URL INCLUDING ?v= - that
   query is the deliberate cache-buster for when the footage itself is re-encoded, and stripping
   it would make a new render unreachable behind an old copy. Every other entry is dropped at
   the same time, so bumping ?v= replaces rather than accumulates. */
self.addEventListener('message', e => {
  const url = e.data && e.data.cache
  if (typeof url !== 'string' || !MINE.test(new URL(url, location.origin).pathname)) return
  e.waitUntil((async () => {
    const c = await caches.open(CACHE)
    const key = new URL(url, location.origin).href
    if (await c.match(key)) return
    const res = await fetch(key)
    if (!res.ok || res.status === 206) return   /* only ever store a whole file */
    await c.put(key, res.clone())
    for (const old of await c.keys()) if (old.url !== key) await c.delete(old)
  })())
})
