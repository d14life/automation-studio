import { useEffect, useRef } from 'react'
import { FLOW, ICE, isSmallDevice } from './heroTuning'

/* two lines, same timings, started in the same tick: they melt into the next phrase together */
export const SLOGAN_LINE_1 = ['АВТОМАТИЗИРУЕМ', 'БЫСТРО', 'ТОЛЬКО ПРАКТИКА']
export const SLOGAN_LINE_2 = ['БИЗНЕС-ПРОЦЕССЫ', 'НЕ ЗНАЧИТ ПЛОХО', 'НОЛЬ ТЕОРИИ']

/** Morphing slogan on #liq1 / #liq2. `heroVisible` gates the melt, it never rebuilds it. */
export function useLiquidSlogan(ready: boolean, heroVisible: boolean): void {
  const activeRef = useRef(heroVisible)
  useEffect(() => { activeRef.current = heroVisible }, [heroVisible])

  useEffect(() => {
    if (!ready) return
    const L1 = document.getElementById('liq1') as LiquidTextHost | null
    const L2 = document.getElementById('liq2') as LiquidTextHost | null
    if (!L1 || !L2) return
    const SMALL = isSmallDevice()
    const MORPH: LiquidTextOptions = {
      morphTime: SMALL ? 0.9 : 4.5,
      cooldownTime: SMALL ? 1.7 : 0.45,
      colors: ICE,
      flow: FLOW,
      drift: FLOW * 3,
      spread: ICE.length * 0.08,
      simple: SMALL,
      activeWhen: () => activeRef.current,
    }
    const stop1 = window.LiquidText(L1, SLOGAN_LINE_1, MORPH)
    const stop2 = window.LiquidText(L2, SLOGAN_LINE_2, MORPH)
    return () => { stop1(); stop2() }
  }, [ready])
}
