import { useTubeScene } from '@/hooks/useTubeScene'

/* The tubes live in their own fixed layer at the root, beside the starfield: the library sizes
   its canvas from the PARENT box, so the wrapper is what keeps the surface viewport-sized. */
export function TubeLayer({ ready, heroVisible }: { ready: boolean; heroVisible: boolean }) {
  const layerRef = useTubeScene(ready, heroVisible)
  return <div id="tubelayer" ref={layerRef} />
}
