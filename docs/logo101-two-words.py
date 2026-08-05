"""Fracture BOTH words and export them as one GLB.

Run:  blender -b --python two_words.py

Why this replaces the previous approach: scattering the 101's fragments onto
points sampled from the Solutions surface produces a CLOUD, not a word. A cloud
of debris arranged word-shaped still reads as debris - he saw it immediately.

The fix is that both ends must be real solid geometry. So "Solutions" is
fractured exactly the way "101" is, and the page holds two meshes: the 101
assembles at one end of the scroll and blows apart toward the middle, while
Solutions arrives from its own explosion and assembles at the other end. Each
word is genuinely solid because each is genuinely a fractured solid.
"""
import bpy, bmesh, random, json
from mathutils import Vector
from mathutils.bvhtree import BVHTree

SEED   = 7
FONT   = "/System/Library/Fonts/Supplemental/Impact.ttf"
OUT    = bpy.path.abspath("//words_flat.glb")
META   = bpy.path.abspath("//words_flat.json")

bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, base, metal, rough, emit=None, es=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = base
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = emit
        b.inputs["Emission Strength"].default_value = es
    return m

SKIN = mat("skin", (0.055, 0.075, 0.09, 1), 0.95, 0.24)
CORE = mat("core", (0.10, 0.55, 0.85, 1), 0.25, 0.42, (0.30, 0.78, 1.0, 1), 2.6)


def build_word(body, pieces, prefix, extrude, target_h):
    """Extrude the text, fracture it into `pieces` Voronoi cells, return the objects."""
    bpy.ops.object.text_add()
    t = bpy.context.object
    t.data.body = body
    t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'
    # ANGULAR, NOT ROUND. A rounded bevel and 12-segment curves give fragments with
    # smooth curved faces, which read as pebbles. Real fractured stone is flat planes
    # meeting at sharp edges - so no bevel at all, and the glyph outlines are coarse
    # polygons rather than smooth curves.
    t.data.resolution_u = 2
    t.data.extrude = extrude
    try:
        t.data.font = bpy.data.fonts.load(FONT)
    except Exception:
        pass
    bpy.ops.object.convert(target='MESH')
    src = bpy.context.object
    src.name = prefix + "_src"

    bm = bmesh.new(); bm.from_mesh(src.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bm.to_mesh(src.data); bm.free()

    # normalise height so both words read at the same scale on the page
    bb = [Vector(c) for c in src.bound_box]
    h = max(v.y for v in bb) - min(v.y for v in bb)
    s = target_h / max(h, 1e-6)
    src.scale = (s, s, s)
    bpy.context.view_layer.update()
    bpy.ops.object.transform_apply(scale=True)

    bb = [Vector(c) for c in src.bound_box]
    lo = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    hi = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    bvh = BVHTree.FromObject(src, bpy.context.evaluated_depsgraph_get())

    # uneven seeds: some regions splinter, others come off as slabs
    attract = [Vector((random.uniform(lo.x, hi.x), random.uniform(lo.y, hi.y),
                       random.uniform(lo.z, hi.z))) for _ in range(6)]
    pts = []
    while len(pts) < pieces:
        p = Vector((random.uniform(lo.x, hi.x), random.uniform(lo.y, hi.y),
                    random.uniform(lo.z, hi.z)))
        if random.random() < 0.62:
            p = random.choice(attract).lerp(p, random.uniform(0.12, 0.62))
        pts.append(p)

    out = []
    for i, p in enumerate(pts):
        bm = bmesh.new(); bm.from_mesh(src.data)
        for j, q in enumerate(pts):
            if i == j or (q - p).length < 1e-6 or not bm.faces:
                continue
            n = (q - p).normalized()
            ret = bmesh.ops.bisect_plane(
                bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces),
                plane_co=(p + q) * 0.5, plane_no=n,
                clear_outer=True, use_snap_center=False)
            cut = [e for e in ret.get('geom_cut', []) if isinstance(e, bmesh.types.BMEdge)]
            if cut:
                bmesh.ops.holes_fill(bm, edges=cut)
        if not bm.faces or len(bm.verts) < 4:
            bm.free(); continue
        me = bpy.data.meshes.new(f"{prefix}{len(out):03d}")
        bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new(f"{prefix}{len(out):03d}", me)
        bpy.context.collection.objects.link(ob)
        ob.data.materials.append(SKIN); ob.data.materials.append(CORE)
        for f in me.polygons:
            hit = bvh.find_nearest(f.center)
            d = hit[3] if hit and hit[3] is not None else 9e9
            f.material_index = 0 if d < extrude * 0.14 else 1
        out.append(ob)

    bpy.data.objects.remove(src, do_unlink=True)

    # centre the word on the origin
    allv = [ob.matrix_world @ v.co for ob in out for v in ob.data.vertices]
    c = sum(allv, Vector()) / len(allv)
    for ob in out:
        ob.location -= c
    print(f"[words] {body}: {len(out)} pieces")
    return out


random.seed(SEED)
a = build_word("101",       330, "a", 0.085, 0.58)
random.seed(SEED + 11)
b = build_word("Solutions", 330, "b", 0.060, 0.40)

for ob in a + b:
    ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB',
                          use_selection=True, export_apply=True, export_yup=True)

json.dump({"a": len(a), "b": len(b)}, open(META, "w"))
print(f"[words] wrote {OUT}  a={len(a)} b={len(b)}")
