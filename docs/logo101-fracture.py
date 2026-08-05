"""Build "101" as extruded 3D type, Voronoi-fracture it, and export a GLB.

Run:  blender -b --python fracture.py

Why the fracture is written out longhand instead of calling the Cell Fracture
addon: that addon has moved between bundled/extension status across Blender
versions, and a build step that silently depends on an addon being enabled is a
build step that breaks on someone else's machine. Bisecting against half-space
planes is twenty lines, uses nothing but bmesh, and gives real Voronoi cells.

The important part is the MATERIAL SPLIT. Faces that sit on the original surface
are the skin; faces created by a cut are the inside. They are told apart by
distance to a BVH of the original mesh, which is exact rather than heuristic -
and it is the whole point of the effect, because the inside is what glows when
the skin comes off.
"""
import bpy, bmesh, random, math
from mathutils import Vector
from mathutils.bvhtree import BVHTree

SEED      = 7
PIECES    = 78          # chunks of deliberately mixed size, see CLUSTER below
CLUSTER   = 0.62        # 0 = evenly spread points (uniform chunks), 1 = heavily clustered
EXTRUDE   = 0.085
BEVEL     = 0.016
OUT       = bpy.path.abspath("//logo101.glb")

random.seed(SEED)

# ── clean slate ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)

# ── the mark ─────────────────────────────────────────────────────────────────
bpy.ops.object.text_add()
txt = bpy.context.object
txt.data.body = "101"
txt.data.align_x = 'CENTER'
txt.data.align_y = 'CENTER'
txt.data.extrude = EXTRUDE
txt.data.bevel_depth = BEVEL
txt.data.bevel_resolution = 2
txt.data.size = 1.0
# a heavy grotesque reads as a logo; fall back silently if the font is absent
for path in ("/System/Library/Fonts/Supplemental/Impact.ttf",
             "/System/Library/Fonts/HelveticaNeue.ttc",
             "/System/Library/Fonts/SFNS.ttf"):
    try:
        txt.data.font = bpy.data.fonts.load(path)
        break
    except Exception:
        continue

bpy.ops.object.convert(target='MESH')
src = bpy.context.object
src.name = "logo_src"

# weld and triangulate-free cleanup so the boolean-free bisect behaves
bm = bmesh.new(); bm.from_mesh(src.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bm.to_mesh(src.data); bm.free()

bb = [src.matrix_world @ Vector(c) for c in src.bound_box]
lo = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
hi = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
print(f"[101] bounds {lo} .. {hi}")

# BVH of the untouched surface - the reference for "is this face skin or inside?"
bvh_src = BVHTree.FromObject(src, bpy.context.evaluated_depsgraph_get())

# ── materials ────────────────────────────────────────────────────────────────
def mat(name, base, metal, rough, emit=None, emit_strength=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = base
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = emit
        b.inputs["Emission Strength"].default_value = emit_strength
    return m

# the skin: near-black metal, like the DNA strand
skin = mat("skin", (0.055, 0.075, 0.09, 1), 0.95, 0.24)
# the inside: what the skin was hiding. Accent-lit so a fracture reads instantly.
core = mat("core", (0.10, 0.55, 0.85, 1), 0.25, 0.42, (0.30, 0.78, 1.0, 1), 2.6)

# ── seed points, deliberately uneven ─────────────────────────────────────────
# Uniform points give uniform chunks, which looks like a grid exploding. Pulling
# a share of the points toward random attractors makes some regions shatter into
# splinters while others break off as slabs - which is what real fracture does.
attract = [Vector((random.uniform(lo.x, hi.x),
                   random.uniform(lo.y, hi.y),
                   random.uniform(lo.z, hi.z))) for _ in range(5)]
pts = []
while len(pts) < PIECES:
    p = Vector((random.uniform(lo.x, hi.x),
                random.uniform(lo.y, hi.y),
                random.uniform(lo.z, hi.z)))
    if random.random() < CLUSTER:
        a = random.choice(attract)
        p = a.lerp(p, random.uniform(0.12, 0.62))
    pts.append(p)

# ── the fracture ─────────────────────────────────────────────────────────────
pieces = []
for i, p in enumerate(pts):
    bm = bmesh.new()
    bm.from_mesh(src.data)

    # keep only the half-space nearer to p than to every other seed
    for j, q in enumerate(pts):
        if i == j:
            continue
        d = q - p
        if d.length < 1e-6:
            continue
        n = d.normalized()
        plane_co = (p + q) * 0.5
        if not bm.faces:
            break
        ret = bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces),
                                     plane_co=plane_co, plane_no=n,
                                     clear_outer=True, use_snap_center=False)
        # CAP ONLY THE CUT. Filling every open boundary instead - which is what the
        # first version did - also caps the letterforms' own holes: the counter
        # inside the zero closes, the gaps between glyphs close, and 78 careful
        # Voronoi cells add up to a featureless slab. It rendered beautifully and
        # was not a 101. bisect_plane hands back exactly the edges it created;
        # fill those and nothing else.
        cut_edges = [e for e in ret.get('geom_cut', []) if isinstance(e, bmesh.types.BMEdge)]
        if cut_edges:
            bmesh.ops.holes_fill(bm, edges=cut_edges)

    if not bm.faces or len(bm.verts) < 4:
        bm.free()
        continue

    me = bpy.data.meshes.new(f"piece{i:03d}")
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(f"piece{i:03d}", me)
    bpy.context.collection.objects.link(ob)
    ob.data.materials.append(skin)
    ob.data.materials.append(core)

    # SKIN vs INSIDE, decided by distance to the original surface
    for f in me.polygons:
        c = f.center
        hit = bvh_src.find_nearest(c)
        dist = hit[3] if hit and hit[3] is not None else 9e9
        f.material_index = 0 if dist < 0.012 else 1
    pieces.append(ob)

print(f"[101] pieces built: {len(pieces)}")

bpy.data.objects.remove(src, do_unlink=True)

# centre the whole mark on the origin so the web side needs no offsets
allv = []
for ob in pieces:
    for v in ob.data.vertices:
        allv.append(ob.matrix_world @ v.co)
cx = sum(v.x for v in allv) / len(allv)
cy = sum(v.y for v in allv) / len(allv)
cz = sum(v.z for v in allv) / len(allv)
for ob in pieces:
    ob.location -= Vector((cx, cy, cz))

# ── export ───────────────────────────────────────────────────────────────────
# Each piece stays its own object on purpose: the web side reads every object's
# own centre as the point it flies away from, which is exactly the data a
# fracture carries and exactly what a merged mesh would throw away.
for ob in pieces:
    ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB',
                          use_selection=True, export_apply=True,
                          export_yup=True)
print(f"[101] wrote {OUT}")
