#!/usr/bin/env python3
"""Generate a self-contained p.2 logo SVG (outlined, no font dependency)."""
import os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Identity

f = TTFont("Poppins-Black.ttf")
gs = f.getGlyphSet()
cmap = f.getBestCmap()
hmtx = f["hmtx"]

BASELINE = 1050

def _pen(ch, tx):
    gname = cmap[ord(ch)]
    t = Identity.translate(tx, BASELINE).scale(1, -1)
    sp = SVGPathPen(gs)
    gs[gname].draw(TransformPen(sp, t))
    bp = BoundsPen(gs)
    gs[gname].draw(TransformPen(bp, t))
    return sp.getCommands(), hmtx[gname][0], bp.bounds

# ---- layout knobs ----
GAP      = float(os.environ.get("GAP", 332))
HEART_CX = float(os.environ.get("HEART_CX", 783))
HEART_CY = float(os.environ.get("HEART_CY", 995))
HEART_SQ = float(os.environ.get("HEART_SQ", 271))
HEART_ROT = 45
TWO_MINX = 25
PAD = float(os.environ.get("PAD", 0))
NORMALIZE = os.environ.get("NORMALIZE", "1") == "1"

p_d, p_adv, p_b = _pen("p", 0)
two_tx = int(round(p_adv + GAP - TWO_MINX))
two_d, two_adv, two_b = _pen("2", two_tx)

HEART_SRC = ("M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 "
            "5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 "
            "5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z")
# heart path visual ink center ~ (12, 11.9); recenter on that so rotation pivots on the shape
s = HEART_SQ / 24.0
heart_tf = f"translate({HEART_CX} {HEART_CY}) rotate({HEART_ROT}) scale({s:.6f}) translate(-12 -11.9)"

# heart ink bbox (measured empirically): ~221 wide/tall for SQ 271, centred on (CX,CY)
hink = 221.0
hb = (HEART_CX-hink/2, HEART_CY-hink/2, HEART_CX+hink/2, HEART_CY+hink/2)
minx = min(p_b[0], two_b[0], hb[0]); miny = min(p_b[1], two_b[1], hb[1])
maxx = max(p_b[2], two_b[2], hb[2]); maxy = max(p_b[3], two_b[3], hb[3])

if NORMALIZE:
    ox, oy = -minx + PAD, -miny + PAD
    W, H = (maxx - minx) + 2*PAD, (maxy - miny) + 2*PAD
    og = f"{ox:g} {oy:g}"
    open_g, close_g = (f'<g transform="translate({og})">', '</g>') if og != "0 0" else ("", "")
    vb = f"0 0 {W:g} {H:g}"
else:
    open_g = close_g = ""
    vb = f"{minx-PAD:.2f} {miny-PAD:.2f} {(maxx-minx)+2*PAD:.2f} {(maxy-miny)+2*PAD:.2f}"

print(f"bbox x {minx:.1f}..{maxx:.1f} y {miny:.1f}..{maxy:.1f}  viewBox='{vb}'", file=sys.stderr)

COLOR = sys.argv[1] if len(sys.argv) > 1 else "currentColor"
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" fill="{COLOR}" '
       f'role="img" aria-label="p.2">'
       f'{open_g}<path d="{p_d}"/>'
       f'<path transform="{heart_tf}" d="{HEART_SRC}"/>'
       f'<path d="{two_d}"/>{close_g}</svg>\n')
sys.stdout.write(svg)
