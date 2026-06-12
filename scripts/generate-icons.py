#!/usr/bin/env python3
"""Generate the extension icons (16/32/48/128) into public/icons/.

Pure standard library only (zlib for PNG compression) so the script runs
anywhere without ImageMagick, Pillow, or cairosvg installed.

Design: a rounded-square background with a diagonal indigo->emerald gradient
and a bold white checkmark -- the "Correct" action, the core of
"Correct & Translate". Each size is rendered with 4x supersampling and box
downsampling for clean anti-aliased edges that stay legible at 16px.

Run: python3 scripts/generate-icons.py
"""

from __future__ import annotations

import math
import os
import struct
import zlib

SIZES = (16, 32, 48, 128)
SS = 4  # supersampling factor

# Brand colors (RGB). Diagonal gradient from indigo to emerald.
GRAD_TL = (91, 108, 240)   # #5b6cf0 indigo
GRAD_BR = (34, 197, 94)    # #22c55e emerald
CHECK = (255, 255, 255)    # white checkmark


def _lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def _smoothstep(edge0: float, edge1: float, x: float) -> float:
    """Anti-aliasing coverage in [0,1] across a ~1px transition band."""
    if edge0 == edge1:
        return 0.0 if x < edge0 else 1.0
    t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)


def _rounded_rect_sdf(px: float, py: float, w: float, h: float, r: float) -> float:
    """Signed distance from point to a rounded rectangle centered in w x h.
    Negative inside, positive outside."""
    cx, cy = w / 2.0, h / 2.0
    qx = abs(px - cx) - (w / 2.0 - r)
    qy = abs(py - cy) - (h / 2.0 - r)
    ax, ay = max(qx, 0.0), max(qy, 0.0)
    outside = math.hypot(ax, ay)
    inside = min(max(qx, qy), 0.0)
    return outside + inside - r


def _dist_to_segment(px: float, py: float, ax: float, ay: float,
                     bx: float, by: float) -> float:
    """Shortest distance from point P to segment AB."""
    dx, dy = bx - ax, by - ay
    seg2 = dx * dx + dy * dy
    if seg2 == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / seg2
    t = max(0.0, min(1.0, t))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(px - cx, py - cy)


def _composite(bg: tuple, fg: tuple, alpha: float) -> tuple:
    return tuple(int(round(_lerp(bg[i], fg[i], alpha))) for i in range(3))


def render(size: int) -> bytes:
    """Render one icon at `size` px, returning RGBA bytes (size*size*4)."""
    S = size * SS
    radius = 0.225 * S          # rounded corner radius
    aa = float(SS)              # ~1 device pixel anti-alias band

    # Checkmark polyline in normalized coords, scaled to S.
    p0 = (0.27 * S, 0.52 * S)
    p1 = (0.43 * S, 0.69 * S)
    p2 = (0.74 * S, 0.32 * S)
    stroke = 0.115 * S          # half-width handled below
    half = stroke / 2.0

    # Supersampled RGBA buffer.
    buf = bytearray(S * S * 4)
    for y in range(S):
        fy = y + 0.5
        for x in range(S):
            fx = x + 0.5
            # Rounded-square background mask.
            d = _rounded_rect_sdf(fx, fy, S, S, radius)
            bg_cov = _smoothstep(aa, -aa, d)  # 1 inside, 0 outside
            if bg_cov <= 0.0:
                continue  # fully transparent
            # Diagonal gradient color.
            t = (fx + fy) / (2.0 * S)
            color = tuple(int(round(_lerp(GRAD_TL[i], GRAD_BR[i], t)))
                          for i in range(3))
            # Checkmark coverage (distance to the two segments).
            dc = min(
                _dist_to_segment(fx, fy, p0[0], p0[1], p1[0], p1[1]),
                _dist_to_segment(fx, fy, p1[0], p1[1], p2[0], p2[1]),
            )
            check_cov = _smoothstep(half + aa, half - aa, dc)
            if check_cov > 0.0:
                color = _composite(color, CHECK, check_cov)
            a = int(round(255 * bg_cov))
            o = (y * S + x) * 4
            buf[o] = color[0]
            buf[o + 1] = color[1]
            buf[o + 2] = color[2]
            buf[o + 3] = a

    return _downsample(buf, S, size)


def _downsample(buf: bytearray, S: int, size: int) -> bytes:
    """Box-average SS x SS blocks, premultiplying alpha for correct edges."""
    out = bytearray(size * size * 4)
    n = SS * SS
    for y in range(size):
        for x in range(size):
            pr = pg = pb = pa = 0.0
            for sy in range(SS):
                for sx in range(SS):
                    o = ((y * SS + sy) * S + (x * SS + sx)) * 4
                    a = buf[o + 3] / 255.0
                    pr += buf[o] * a
                    pg += buf[o + 1] * a
                    pb += buf[o + 2] * a
                    pa += a
            oo = (y * size + x) * 4
            if pa > 0:
                out[oo] = int(round(pr / pa))
                out[oo + 1] = int(round(pg / pa))
                out[oo + 2] = int(round(pb / pa))
            out[oo + 3] = int(round(255 * pa / n))
    return bytes(out)


def write_png(path: str, rgba: bytes, size: int) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (struct.pack(">I", len(data)) + tag + data +
                struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    # Prepend a filter byte (0 = none) to each scanline.
    raw = bytearray()
    stride = size * 4
    for y in range(size):
        raw.append(0)
        raw.extend(rgba[y * stride:(y + 1) * stride])

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # RGBA, 8-bit
    png = (b"\x89PNG\r\n\x1a\n" +
           chunk(b"IHDR", ihdr) +
           chunk(b"IDAT", zlib.compress(bytes(raw), 9)) +
           chunk(b"IEND", b""))
    with open(path, "wb") as f:
        f.write(png)


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(here, "..", "public", "icons")
    out_dir = os.path.abspath(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    for size in SIZES:
        rgba = render(size)
        path = os.path.join(out_dir, f"icon-{size}.png")
        write_png(path, rgba, size)
        print(f"wrote {path} ({size}x{size})")


if __name__ == "__main__":
    main()
