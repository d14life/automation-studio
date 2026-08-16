# Steel "101 solutions" — keyframe prompts (reference-driven)

Ice reference: `~/Downloads/6f941d46-5489-416c-8347-99013601fa3d.png` — composition only, never the material.

The reference carries letterforms, layout, camera, lighting, black background. Prompts only say what **changes**.

## Generation order — backwards

Subtracting a letter is far more reliable than adding one. Build the full frame first, then strip it down.

| Step | Attach | Get |
|---|---|---|
| 1 | ice PNG | MASTER (steel logo, clean floor) |
| 2 | MASTER | F4 (final, cracked floor) |
| 3 | F4 | F3 (101, no word) |
| 4 | F3 | F2 (10) |
| 5 | F2 | F1 (1) |
| 6 | F1 | F0 (empty) |

## Segment map

| Video | Segment | START → END |
|---|---|---|
| 1 | A — "1" slams | F0 → F1 |
| 1 | B — "0" slams | F1 → F2 |
| 1 | C — "1" slams | F2 → F3 |
| 2 | D — "solutions" drops | F3 → F4 |

F1/F2/F3 each sit on two seams. Generate once, reuse the same file both sides. Never regenerate a seam frame.

## Prompts

**1. MASTER** — attach the ice PNG, or any earlier render whose framing is already correct
```
Same letters, same layout, same camera, same framing, same black background. Full redesign in Apple's design language — "less, but better." Each letter is a single continuous precision-milled unibody, one seamless piece with no visible screws, no bolts, no rivets, no panel seams, no exposed vents or mechanisms. Every internal corner and junction between strokes is a soft continuous squircle radius, not a hard angle — the whole form reads as one organic, machined mass. Surface is a fine satin bead-blasted aluminium finish, uniform micro-texture, soft diffuse graduated sheen with no harsh specular lines. Edges have a subtle continuous rounded chamfer, barely visible, flowing into the face rather than cutting it. Material integrity over ornament: the only variation is in the sheen and the radius, nothing applied or attached.

One hidden detail, and only one: on the "0", a small flush circular lens or sensor element set perfectly into the face, seamless with the surrounding metal, a faint dark glass centre with no visible bezel or ring — barely noticeable until you look for it.

The word "solutions" stays a separate free-floating monolith in front of the numerals, same finish, same rules, with a clear gap of air between it and the 101 — casts its own soft shadow, never touches. Full logo fully inside the frame with margin on all sides, nothing cropped.
```

What sells this version: continuous squircle radius everywhere a hard angle used to be, and soft graduated sheen instead of a crisp highlight line — "less" reads as one mass, not a slab. If it comes back too plain, push contrast through lighting and shadow depth, not by adding parts back.

Earlier directions, kept for reference:
- **Fabricated/industrial** — `each letter built from separate steel plates bolted and welded together — panel seams, countersunk hex bolts, raised weld beads, mixed brushed and blued steel, grime and oil in the recesses, heat discolouration around the welds.`
- **CNC precision-machined (hard chamfer)** — `CNC-machined titanium and anodized aluminium unibody assembled from precisely fitted sections — hairline panel gaps of uniform width, diamond-cut polished chamfers along every edge catching one clean bright specular line, factory new, immaculate.`
- **Two-material titanium rail** (iPhone 15 Pro Max) — `a contoured natural-titanium rail around every letter, bead-blasted matte, soft graduated sheen, rounded not chamfered; front face a separate soft-touch frosted matte panel, cooler and flatter in tone, with a subtle seam where face meets rail.`

**2. F4 (final)** — attach MASTER
```
Same image. Only change the floor: the black stone is shattered under the numerals, radiating fracture lines and lifted shards spreading across it, low grey dust settling. The letters and the word are untouched and in the same positions.
```

**3. F3** — attach F4
```
Same image. Remove the word "solutions" completely — nothing floats in front of the numerals. The 101, the cracked floor and the dust stay exactly as they are.
```

**4. F2** — attach F3
```
Same image. Remove the right-hand numeral 1 and its impact crater — that third of the frame is now empty black void with intact floor. The left 1 and the 0 and their craters stay exactly as they are.
```

**5. F1** — attach F2
```
Same image. Remove the numeral 0 and its impact crater — the centre and right of the frame are now empty black void with intact floor. The left 1 and its crater stay exactly as they are.
```

**6. F0** — attach F1
```
Same image. Remove the numeral 1 and its impact crater. Empty frame — no letters, floor completely intact, no cracks, no shards, no dust. Just the black stone floor, the black void, and the pool of key light where the letters will land.
```

## Finish swap — change one line in MASTER

- **Brushed forged steel** (above) — closest tonal match to the ice, reads best on black.
- **Polished chrome** — `the ice becomes mirror-polished chrome steel: black void reflected in the faces, blazing razor-sharp highlights along every edge.`
- **Cast tool steel** — `the ice becomes dark cast tool steel: matte gunmetal with a fine sand-cast grain, near-black in the recesses, bright raw-cut bevels.`

## Rule

Both sides of a seam must be the **same file**, not two generations of the same prompt.
