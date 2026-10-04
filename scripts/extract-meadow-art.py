"""Turn the client's supplied dog illustrations into web-ready meadow assets.

The source illustrations arrive as JPEGs on a solid black background. This keys
that background out, auto-segments the multi-pose sheet into individual dogs,
trims, and exports transparent WebP into src/assets/meadow/.

Usage:
    python3 -m pip install Pillow
    python3 scripts/extract-meadow-art.py <source-dir> [out-dir]

Source files expected in <source-dir> (as supplied by the client, 2026-09-19):
    WhatsApp Image 2026-09-19 at 14.04.01.jpeg      six-pose puppy sheet
    WhatsApp Image 2026-09-19 at 14.03.59 (1).jpeg  adult dad, blue collar
    WhatsApp Image 2026-09-19 at 14.03.58.jpeg      adult mom, bow + pink collar

The six puppy crops are keyed by their bounding boxes on the sheet, which is why
every puppy pose shares one drawing style and one scale. MeadowDog.tsx relies on
those source widths to size the poses consistently — if the sheet is ever
re-exported, update the `units` values there to match.
"""
from PIL import Image
from collections import deque
import os, sys

BG_MAX = 34          # a pixel this dark, reachable from the border, is background
FEATHER_HI = 78      # below this, we're on the anti-aliased rim

def alpha_mask(im):
    """Flood fill the connected near-black region inward from every border."""
    w, h = im.size
    px = im.load()
    bg = bytearray(w * h)
    q = deque()
    def push(x, y):
        i = y * w + x
        if not bg[i]:
            r, g, b = px[x, y]
            if max(r, g, b) <= BG_MAX:
                bg[i] = 1
                q.append((x, y))
    for x in range(w):
        push(x, 0); push(x, h - 1)
    for y in range(h):
        push(0, y); push(w - 1, y)
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                push(nx, ny)
    return bg

def to_rgba(im, bg):
    """Alpha 0 on background, ramped on the rim, 255 inside. Un-premultiply the
    rim against black so the outline keeps its colour instead of fringing dark."""
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            if bg[y * w + x]:
                op[x, y] = (0, 0, 0, 0)
                continue
            r, g, b = px[x, y]
            m = max(r, g, b)
            if m < FEATHER_HI:
                a = max(0, min(255, int((m - BG_MAX) * 255 / (FEATHER_HI - BG_MAX))))
                if a > 0:
                    k = 255 / a
                    r, g, b = min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k))
                op[x, y] = (r, g, b, a)
            else:
                op[x, y] = (r, g, b, 255)
    return out

def components(rgba, min_area=4000):
    """Label connected opaque regions; return their bounding boxes, biggest first."""
    w, h = rgba.size
    ap = rgba.load()
    seen = bytearray(w * h)
    boxes = []
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if seen[i] or ap[sx, sy][3] < 40:
                continue
            q = deque([(sx, sy)]); seen[i] = 1
            x0 = x1 = sx; y0 = y1 = sy; area = 0
            while q:
                x, y = q.popleft(); area += 1
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not seen[j] and ap[nx, ny][3] >= 40:
                            seen[j] = 1; q.append((nx, ny))
            if area >= min_area:
                boxes.append((area, (x0, y0, x1 + 1, y1 + 1)))
    boxes.sort(reverse=True)
    return [b for _, b in boxes]

def export(rgba, dst, target_w):
    rgba = rgba.crop(rgba.getbbox())
    ratio = target_w / rgba.width
    rgba = rgba.resize((target_w, max(1, round(rgba.height * ratio))), Image.LANCZOS)
    rgba.save(dst, "WEBP", quality=92, method=6)
    return rgba.size, os.path.getsize(dst)

def load_keyed(path):
    im = Image.open(path).convert("RGB")
    return to_rgba(im, alpha_mask(im))


# --- puppy crops on the six-pose sheet, verified against the source ---
SHEET_POSES = {
    "puppy-walk":   (517, 539, 1002, 909),
    "puppy-stand":  (1091, 69, 1496, 463),
    "puppy-lie":    (519, 182, 1048, 424),
    "puppy-sit":    (64, 506, 386, 924),
    "puppy-curl":   (47, 135, 476, 427),
    "puppy-sprawl": (1037, 660, 1497, 904),
}
PUPPY_WIDTH = 240   # ~2x the largest on-screen puppy
ADULT_WIDTH = 440   # ~2x the largest on-screen adult

# Each adult is split into a body and a waggable tail. The cut follows the rump
# outline as (height fraction, width fraction) points; the tail layer keeps an
# overlap that stays hidden behind the body so the joint never comes apart.
# MeadowDog/storybook.css pin the rotation origin to the joint listed here.
DAD_TAIL = dict(cut=[(.24, .165), (.40, .115), (.56, .095), (.70, .145)],
                side="left", band=(.22, .71))      # pivot 15% 31%
MOM_TAIL = dict(cut=[(.30, .745), (.42, .83), (.55, .865), (.66, .855), (.73, .83)],
                side="right", band=(.28, .73))     # pivot 76% 40%


def split_tail(im, cut, side, band, overlap=0.11):
    """Return (body, tail) layers for an already-sized adult illustration."""
    w, h = im.size
    px = im.load()
    body = im.copy(); bp = body.load()
    tail = Image.new("RGBA", (w, h)); tp = tail.load()
    y0, y1 = band

    def cut_x(yf):
        if yf <= cut[0][0]: return cut[0][1]
        if yf >= cut[-1][0]: return cut[-1][1]
        for (ya, xa), (yb, xb) in zip(cut, cut[1:]):
            if ya <= yf <= yb:
                t = (yf - ya) / (yb - ya) if yb != ya else 0
                return xa + (xb - xa) * t
        return cut[-1][1]

    for y in range(h):
        yf = y / h
        if not (y0 <= yf <= y1):
            continue
        cx = cut_x(yf) * w
        # Overlap is widest at the joint and tapers to nothing at the tip:
        # far-from-pivot pixels travel furthest and would swing into view.
        ox = overlap * w * max(0.0, 1.0 - (yf - y0) / (y1 - y0))
        for x in range(w):
            if px[x, y][3] == 0:
                continue
            beyond = x < cx if side == "left" else x > cx
            within = x < cx + ox if side == "left" else x > cx - ox
            if within:
                tp[x, y] = px[x, y]
            if beyond:
                bp[x, y] = (0, 0, 0, 0)
    # The cut can leave a speck of tail behind (or a speck of body on the tail)
    # where an outline crosses it. Each layer should be one connected shape, so
    # anything that is not the main island is a leftover.
    return keep_largest(body), keep_largest(tail)


def keep_largest(im):
    """Erase every opaque island except the biggest one."""
    w, h = im.size
    px = im.load()
    seen = bytearray(w * h)
    best, best_size = None, 0
    islands = []
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if seen[i] or px[sx, sy][3] == 0:
                continue
            q = deque([(sx, sy)]); seen[i] = 1; cells = []
            while q:
                x, y = q.popleft(); cells.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not seen[j] and px[nx, ny][3] > 0:
                            seen[j] = 1; q.append((nx, ny))
            islands.append(cells)
            if len(cells) > best_size:
                best, best_size = cells, len(cells)
    for cells in islands:
        if cells is not best:
            for x, y in cells:
                px[x, y] = (0, 0, 0, 0)
    return im

def main(src_dir, out_dir="src/assets/meadow"):
    os.makedirs(out_dir, exist_ok=True)
    sheet = load_keyed(os.path.join(src_dir, "WhatsApp Image 2026-09-19 at 14.04.01.jpeg"))
    total = 0
    for name, box in SHEET_POSES.items():
        size, n = export(sheet.crop(box), os.path.join(out_dir, name + ".webp"), PUPPY_WIDTH)
        total += n
        print(f"{name:14} {size[0]}x{size[1]}  {n/1024:.1f} KB")
    for name, src, tail in [("dog-dad", "WhatsApp Image 2026-09-19 at 14.03.59 (1).jpeg", DAD_TAIL),
                            ("dog-mom", "WhatsApp Image 2026-09-19 at 14.03.58.jpeg", MOM_TAIL)]:
        adult = load_keyed(os.path.join(src_dir, src))
        adult = adult.crop(adult.getbbox())
        ratio = ADULT_WIDTH / adult.width
        adult = adult.resize((ADULT_WIDTH, max(1, round(adult.height * ratio))), Image.LANCZOS)
        for suffix, layer in zip(("-body", "-tail"), split_tail(adult, **tail)):
            path = os.path.join(out_dir, name + suffix + ".webp")
            layer.save(path, "WEBP", quality=92, method=6)
            n = os.path.getsize(path); total += n
            print(f"{name + suffix:14} {layer.size[0]}x{layer.size[1]}  {n/1024:.1f} KB")
    print(f"total {total/1024:.1f} KB")

if __name__ == "__main__":
    main(*sys.argv[1:])
