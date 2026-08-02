/* Hero graphics, exactly the settings confirmed on the bench:
   ice palette, Nunito, fast travel with the medium spread, tubes tight and one notch brighter.
   Shared by the starfield, the tube scene and the morphing slogan - do not retune. */

/* The violet #8E7BE8 is gone on his word: the slogan and the ribbons now walk three cold stops,
   ice to cyan to blue. sp and p0 are derived from the length, so the spacing follows by itself. */
export const ICE = ['#DFF6FF', '#7FD8FF', '#5C82C9']
export const FLOW = 3.5
export const GLOW = { l: 0.43, i: 135 }

/* a phone gets a lighter field and no WebGL at all: the tube scene was the thing that
   killed mobile, and 700 stars redrawn every frame is more than a phone should pay.
   no WebGL scene where there is no mouse: phones and tablets paid for it in heat and frame
   drops, and the ribbons follow nothing there anyway */
export function isSmallDevice(): boolean {
  return (
    matchMedia('(hover:none)').matches ||
    matchMedia('(pointer:coarse)').matches ||
    matchMedia('(max-width:600px)').matches ||
    !!(navigator.deviceMemory && navigator.deviceMemory <= 4)
  )
}
