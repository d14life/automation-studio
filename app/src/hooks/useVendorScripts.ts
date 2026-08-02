import { useEffect, useState } from 'react'

/* win.js and anim3.js are plain scripts, not modules: they publish globals. They are appended
   to <head> once per document and the promise is cached by src, so StrictMode's double effect
   (and any second caller) waits on the same load instead of inserting a second tag. */

const loading = new Map<string, Promise<void>>()

function loadScript(src: string): Promise<void> {
  let p = loading.get(src)
  if (p) return p
  p = new Promise<void>((resolve, reject) => {
    const found = document.querySelector<HTMLScriptElement>('script[src="' + src + '"]')
    if (found) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.async = false /* keep document order: win.js first, then anim3.js */
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('failed to load ' + src))
    document.head.appendChild(s)
  })
  loading.set(src, p)
  return p
}

/* the same query strings the static page used, so the cache behaves identically */
/* bump anim3's version on EVERY change to it - a stale cached copy has cost a whole evening before */
export const VENDOR_SCRIPTS = ['/win.js?v=1', '/anim3.js?v=7'] as const

/** Loads win.js + anim3.js once. Returns true when window.WinMgr / window.Starfield1 exist. */
export function useVendorScripts(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    Promise.all(VENDOR_SCRIPTS.map(loadScript))
      .then(() => { if (alive) setReady(true) })
      .catch((err: unknown) => { console.error(err) })
    return () => { alive = false }
  }, [])
  return ready
}
