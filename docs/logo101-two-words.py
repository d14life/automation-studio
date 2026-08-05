"""Fracture BOTH words and export them as one GLB.

Run:  blender -b --python two_words_v2.py

Two fixes over the previous version.

THE COUNTS MUST MATCH. The 101 was fracturing into fewer cells than Solutions
(271 against 327), and the page pairs one rock with one rock. Scrolling back
toward the 101 every Solutions fragment shrinks, but there were not enough 101
fragments to grow in their place, so the surplus simply vanished - which is
exactly what it looked like. Solutions assembled perfectly because that
direction IS one-to-one. Asking Blender for a number is only a request: cells
whose seed lands in empty space between glyphs produce nothing and are dropped,
and a wider-set word drops more of them. So instead of guessing the request,
both words are fractured generously and then the longer list is MERGED down -
the smallest cell is joined into its nearest neighbour, repeatedly, until the
two counts are identical. Merging rather than deleting, because deleting a cell
leaves a hole in a word that has to read as solid.

BOLDNESS COMES FROM THE FONT, NOT FROM AN OFFSET. Fattening the outline with
TextCurve.offset thickens the strokes but expands them INWARD as well, and it
sealed the counter of the 0 into a hairline slit. Arial Black is genuinely
heavy and its counters are drawn open, so the 101 gets weight without losing
the hole.
"""
import bpy, bmesh, random, json
from mathutils import Vector
from mathutils import noise as mnoise
from mathutils.bvhtree import BVHTree

SEED   = 7
FONT_A = "/System/Library/Fonts/Supplemental/Arial Black.ttf"   # heavy, open counters
FONT_B = "/System/Library/Fonts/Supplemental/Impact.ttf"
OUT    = bpy.path.abspath("//words_v10.glb")
META   = bpy.path.abspath("//words_v10.json")

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


def build_word(body, pieces, prefix, extrude, target_h, font, spacing=1.0, bold=0.0):
    """Extrude the text, fracture it into Voronoi cells, return the objects."""
    bpy.ops.object.text_add()
    t = bpy.context.object
    t.data.body = body
    t.data.align_x = 'CENTER'; t.data.align_y = 'CENTER'
    t.data.extrude = extrude
    # THE LETTERFORM IS DRAWN PROPERLY; THE ROCK SUPPLIES THE ANGULARITY. Dropping
    # curve resolution to 2 did make straight edges, but it also turned the O and the
    # S into crude polygons - the shapes looked badly drawn because they were. The
    # outlines go back to a clean 6 segments, still with no bevel, and the broken-stone
    # look now comes from roughen() below, which is where it belongs.
    t.data.resolution_u = 6
    t.data.space_character = spacing
    # a little extra weight ON TOP of an already-heavy face. Safe here in a way it
    # was not with Impact: Arial Black draws its counters wide enough that 0.018 of
    # inward growth still leaves the 0 with a clear hole.
    t.data.offset = bold
    try:
        t.data.font = bpy.data.fonts.load(font)
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
        roughen(me, extrude * 0.20, cuts=0)
        out.append(ob)

    bpy.data.objects.remove(src, do_unlink=True)
    print(f"[words] {body}: {len(out)} raw cells")
    return out


def roughen(me, amp, cuts=1):
    """Turn a clean Voronoi polyhedron into something shaped like a rock.

    A bisected cell is a convex solid of perfectly flat faces - which is a crystal,
    not a stone. Subdividing and then pushing every vertex through a noise field
    breaks the faces into irregular planes and chips the edges, so the piece has real
    form instead of relying on the texture to sell it.

    The displacement is a function of POSITION, never of the vertex normal. Two
    neighbouring cells share the vertices along their cut face; a normal points a
    different way in each of them and would tear the pair apart, while a position
    field moves both by exactly the same vector and the word stays watertight."""
    bm = bmesh.new(); bm.from_mesh(me)
    if cuts:
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=cuts, use_grid_fill=True)
    # cuts=0 now. The subdivision existed to give a SMOOTH noise field something to
    # bend, and it tripled the mesh - which is the lag. cell_vector needs no such
    # thing: it only needs a cell's vertices to fall in different lattice cells, so
    # raising the frequency past the size of a fragment does the same job on the
    # original vertices at a quarter of the geometry.
    # cell_vector, NOT noise. Smooth noise moves neighbouring vertices by nearly the
    # same amount, so the surface rolls - which is a wrinkled sponge, not a stone.
    # cell_vector is constant inside each cell of a lattice and jumps at the borders,
    # so a whole patch of surface shifts as one RIGID PLATE and the boundary between
    # two patches is a hard step. Flat facets meeting at sharp edges - which is what
    # broken rock actually is. Two frequencies: big planes, then small chips on them.
    for v in bm.verts:
        p = v.co.copy()
        big = mnoise.cell_vector(p * 42.0)
        chip = mnoise.cell_vector(p * 95.0)
        v.co = p + big * amp + chip * (amp * 0.22)
    bm.normal_update()
    bm.to_mesh(me); bm.free()


def centre_of(ob):
    bb = [Vector(c) for c in ob.bound_box]
    return sum(bb, Vector()) / len(bb)


def bbox_volume(ob):
    bb = [Vector(c) for c in ob.bound_box]
    d = [max(v[i] for v in bb) - min(v[i] for v in bb) for i in range(3)]
    return max(d[0], 1e-6) * max(d[1], 1e-6) * max(d[2], 1e-6)


def merge_into_nearest(lst):
    """Join the smallest cell into its nearest neighbour. One fewer piece, same solid."""
    lst.sort(key=bbox_volume)
    small = lst[0]
    c0 = centre_of(small)
    rest = lst[1:]
    tgt = min(rest, key=lambda o: (centre_of(o) - c0).length_squared)
    # every cell was created at the origin in word space, so the meshes share a frame
    # and from_mesh APPENDS - no transform juggling needed
    bm = bmesh.new()
    bm.from_mesh(tgt.data)
    bm.from_mesh(small.data)
    bm.to_mesh(tgt.data)
    bm.free()
    bpy.data.objects.remove(small, do_unlink=True)
    return rest


def equalise(a, b):
    """Merge the longer list down until both hold the same number of pieces."""
    while len(a) != len(b):
        if len(a) > len(b):
            a = merge_into_nearest(a)
        else:
            b = merge_into_nearest(b)
    print(f"[words] equalised to {len(a)} pieces each")
    return a, b


def recentre(objs):
    allv = [ob.matrix_world @ v.co for ob in objs for v in ob.data.vertices]
    c = sum(allv, Vector()) / len(allv)
    for ob in objs:
        ob.location -= c


random.seed(SEED)
a = build_word("101",       440, "a", 0.085, 0.62, FONT_A, spacing=1.06, bold=0.018)
random.seed(SEED + 11)
b = build_word("Solutions", 330, "b", 0.060, 0.40, FONT_B)

a, b = equalise(a, b)
recentre(a); recentre(b)

# the exporter takes names from the objects, and the page reads the a/b prefix off
# them to tell the two words apart - so renumber after the merge or the ids collide
for i, ob in enumerate(a):
    ob.name = f"a{i:03d}"; ob.data.name = ob.name
for i, ob in enumerate(b):
    ob.name = f"b{i:03d}"; ob.data.name = ob.name

for ob in a + b:
    ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB',
                          use_selection=True, export_apply=True, export_yup=True)

json.dump({"a": len(a), "b": len(b)}, open(META, "w"))
print(f"[words] wrote {OUT}  a={len(a)} b={len(b)}")
