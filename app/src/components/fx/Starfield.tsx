import { useStarfield } from '@/hooks/useStarfield'

/* the starfield is fixed behind the whole document, so every section flies through space.
   The div is empty on purpose: anim3.js appends its own canvas to it. */
export function Starfield({ ready }: { ready: boolean }) {
  const hostRef = useStarfield(ready)
  return <div id="space" ref={hostRef} />
}
