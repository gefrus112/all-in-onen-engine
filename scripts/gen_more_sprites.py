"""Generate more sprites for Lapia Studio — structures, nature, props, vehicles, food."""
import os
import struct
import zlib
import math

OUT = "/home/z/my-project/public/sprites"
EXTRA_CATS = ["structures", "nature", "props", "vehicles", "food", "characters", "weapons"]

def make_png(path, w, h, pixels):
    def chunk(name, data):
        c = name + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    raw = b""
    for y in range(h):
        raw += b"\x00"
        for x in range(w):
            r, g, b, a = pixels[y*w + x]
            raw += bytes([r, g, b, a])
    idat = zlib.compress(raw, 9)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(sig)
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", idat))
        f.write(chunk(b"IEND", b""))

def rgba(r, g, b, a=255): return (r, g, b, a)
def blank(w, h): return [rgba(0,0,0,0)] * (w*h)
def set_px(p, w, x, y, c): p[y*w + x] = c
def rect(p, w, h, x0, y0, rw, rh, c):
    for y in range(y0, y0+rh):
        for x in range(x0, x0+rw):
            if 0 <= x < w and 0 <= y < h: set_px(p, w, x, y, c)
def circle(p, w, h, cx, cy, r, c, fill=True):
    for y in range(h):
        for x in range(w):
            d = ((x-cx)**2 + (y-cy)**2) ** 0.5
            if d <= r: set_px(p, w, x, y, c)
            elif d <= r + 1 and not fill: set_px(p, w, x, y, c)
def hline(p, w, h, x0, x1, y, c):
    for x in range(x0, x1+1):
        if 0 <= x < w and 0 <= y < h: set_px(p, w, x, y, c)
def vline(p, w, h, x, y0, y1, c):
    for y in range(y0, y1+1):
        if 0 <= x < w and 0 <= y < h: set_px(p, w, x, y, c)
def tri(p, w, h, pts, c):
    for y in range(h):
        for x in range(w):
            inside = False
            j = len(pts) - 1
            for i in range(len(pts)):
                xi, yi = pts[i]; xj, yj = pts[j]
                if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 0.0001) + xi):
                    inside = not inside
                j = i
            if inside: set_px(p, w, x, y, c)

# ===== STRUCTURES (32x32) =====
def gen_house(name, wall_color, roof_color, door_color=rgba(110, 70, 30)):
    w = h = 32
    p = blank(w, h)
    # Walls
    rect(p, w, h, 4, 14, 24, 16, wall_color)
    # Roof (triangle)
    tri(p, w, h, [(2, 14), (30, 14), (16, 2)], roof_color)
    # Door
    rect(p, w, h, 13, 20, 6, 10, door_color)
    set_px(p, w, 17, 25, rgba(220, 200, 80))
    # Windows
    rect(p, w, h, 7, 17, 5, 5, rgba(150, 200, 240))
    vline(p, w, h, 9, 17, 21, rgba(100, 100, 110))
    hline(p, w, h, 7, 11, 19, rgba(100, 100, 110))
    rect(p, w, h, 20, 17, 5, 5, rgba(150, 200, 240))
    vline(p, w, h, 22, 17, 21, rgba(100, 100, 110))
    hline(p, w, h, 20, 24, 19, rgba(100, 100, 110))
    # Chimney
    rect(p, w, h, 22, 4, 4, 8, rgba(140, 80, 50))
    make_png(f"{OUT}/structures/{name}.png", w, h, p)

gen_house("house_red", rgba(220, 200, 160), rgba(180, 60, 60))
gen_house("house_blue", rgba(220, 200, 160), rgba(60, 100, 180))
gen_house("house_green", rgba(220, 200, 160), rgba(80, 160, 60))
gen_house("house_purple", rgba(220, 200, 160), rgba(150, 80, 200))
gen_house("house_stone", rgba(180, 180, 190), rgba(100, 100, 110))
gen_house("house_wood", rgba(160, 120, 70), rgba(100, 70, 40))

def gen_castle():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 2, 12, 28, 18, rgba(140, 140, 150))
    # Battlements
    for x in range(2, 30, 4):
        rect(p, w, h, x, 8, 2, 4, rgba(140, 140, 150))
    # Towers
    rect(p, w, h, 0, 4, 8, 26, rgba(120, 120, 130))
    rect(p, w, h, 24, 4, 8, 26, rgba(120, 120, 130))
    # Tower roofs
    tri(p, w, h, [(0, 4), (8, 4), (4, 0)], rgba(180, 60, 60))
    tri(p, w, h, [(24, 4), (32, 4), (28, 0)], rgba(180, 60, 60))
    # Gate
    rect(p, w, h, 13, 18, 6, 12, rgba(40, 30, 20))
    # Arch top
    for x in range(13, 19):
        for y in range(18, 21):
            if (x-15.5)**2 + (y-21)**2 <= 2.5:
                set_px(p, w, x, y, rgba(40, 30, 20))
    # Flag
    vline(p, w, h, 15, 0, 8, rgba(80, 60, 40))
    rect(p, w, h, 16, 1, 5, 3, rgba(220, 50, 50))
    make_png(f"{OUT}/structures/castle.png", w, h, p)

gen_castle()

def gen_shop():
    w = h = 32
    p = blank(w, h)
    # Walls
    rect(p, w, h, 2, 14, 28, 16, rgba(200, 180, 140))
    # Awning
    for x in range(2, 30):
        c = rgba(220, 80, 80) if (x // 4) % 2 == 0 else rgba(240, 240, 240)
        for y in range(11, 15):
            set_px(p, w, x, y, c)
    # Door
    rect(p, w, h, 13, 20, 6, 10, rgba(80, 50, 30))
    # Windows
    rect(p, w, h, 5, 18, 5, 5, rgba(150, 200, 240))
    rect(p, w, h, 22, 18, 5, 5, rgba(150, 200, 240))
    # Sign
    rect(p, w, h, 10, 6, 12, 4, rgba(120, 80, 40))
    make_png(f"{OUT}/structures/shop.png", w, h, p)

gen_shop()

def gen_tent():
    w = h = 32
    p = blank(w, h)
    tri(p, w, h, [(4, 28), (28, 28), (16, 6)], rgba(180, 80, 60))
    # Door slit
    tri(p, w, h, [(13, 28), (19, 28), (16, 18)], rgba(40, 30, 20))
    # Pole
    vline(p, w, h, 16, 0, 8, rgba(100, 70, 40))
    # Flag
    rect(p, w, h, 17, 2, 4, 2, rgba(240, 200, 60))
    make_png(f"{OUT}/structures/tent.png", w, h, p)

gen_tent()

# ===== NATURE (32x32) =====
def gen_tree(name, leaf_color, trunk_color=rgba(100, 60, 30)):
    w = h = 32
    p = blank(w, h)
    # Trunk
    rect(p, w, h, 14, 18, 4, 12, trunk_color)
    # Leaves (multiple circles)
    circle(p, w, h, 16, 14, 10, leaf_color)
    circle(p, w, h, 10, 18, 6, leaf_color)
    circle(p, w, h, 22, 18, 6, leaf_color)
    circle(p, w, h, 16, 6, 6, leaf_color)
    # Highlights
    circle(p, w, h, 12, 10, 2, rgba(255, 255, 200, 180))
    make_png(f"{OUT}/nature/{name}.png", w, h, p)

gen_tree("tree_oak", rgba(80, 160, 70))
gen_tree("tree_maple", rgba(220, 120, 50))
gen_tree("tree_pine", rgba(40, 100, 50))
gen_tree("tree_cherry", rgba(255, 180, 200))
gen_tree("tree_palm", rgba(60, 180, 100))
gen_tree("tree_dead", rgba(100, 80, 60))

def gen_bush(name, color):
    w = h = 32
    p = blank(w, h)
    circle(p, w, h, 10, 18, 8, color)
    circle(p, w, h, 20, 18, 8, color)
    circle(p, w, h, 16, 14, 8, color)
    # Berries
    for bx, by in [(8, 16), (22, 16), (14, 12), (18, 20)]:
        set_px(p, w, bx, by, rgba(220, 50, 80))
        set_px(p, w, bx+1, by, rgba(220, 50, 80))
    make_png(f"{OUT}/nature/{name}.png", w, h, p)

gen_bush("bush_green", rgba(80, 140, 60))
gen_bush("bush_red", rgba(160, 60, 60))

def gen_flower(name, petal_color):
    w = h = 32
    p = blank(w, h)
    # Stem
    vline(p, w, h, 16, 14, 30, rgba(60, 140, 60))
    # Leaves
    rect(p, w, h, 17, 20, 4, 3, rgba(60, 140, 60))
    rect(p, w, h, 11, 24, 4, 3, rgba(60, 140, 60))
    # Petals
    circle(p, w, h, 16, 10, 5, petal_color)
    circle(p, w, h, 12, 8, 3, petal_color)
    circle(p, w, h, 20, 8, 3, petal_color)
    circle(p, w, h, 12, 12, 3, petal_color)
    circle(p, w, h, 20, 12, 3, petal_color)
    # Center
    circle(p, w, h, 16, 10, 2, rgba(240, 200, 60))
    make_png(f"{OUT}/nature/{name}.png", w, h, p)

gen_flower("flower_red", rgba(220, 60, 80))
gen_flower("flower_yellow", rgba(240, 200, 60))
gen_flower("flower_purple", rgba(160, 80, 200))
gen_flower("flower_white", rgba(240, 240, 240))

def gen_mushroom(name, cap_color):
    w = h = 32
    p = blank(w, h)
    # Stem
    rect(p, w, h, 13, 16, 6, 12, rgba(240, 230, 200))
    # Cap
    circle(p, w, h, 16, 14, 8, cap_color)
    rect(p, w, h, 8, 14, 16, 4, cap_color)
    # Spots
    set_px(p, w, 12, 12, rgba(255, 255, 255))
    set_px(p, w, 13, 12, rgba(255, 255, 255))
    set_px(p, w, 18, 11, rgba(255, 255, 255))
    set_px(p, w, 19, 11, rgba(255, 255, 255))
    set_px(p, w, 16, 8, rgba(255, 255, 255))
    make_png(f"{OUT}/nature/{name}.png", w, h, p)

gen_mushroom("mushroom_red", rgba(220, 60, 60))
gen_mushroom("mushroom_brown", rgba(140, 90, 50))

def gen_rock():
    w = h = 32
    p = blank(w, h)
    circle(p, w, h, 16, 18, 10, rgba(130, 130, 140))
    circle(p, w, h, 12, 14, 4, rgba(160, 160, 170))
    circle(p, w, h, 20, 20, 3, rgba(100, 100, 110))
    make_png(f"{OUT}/nature/rock.png", w, h, p)

gen_rock()

def gen_crystal(name, color):
    w = h = 32
    p = blank(w, h)
    tri(p, w, h, [(10, 28), (22, 28), (16, 6)], color)
    # Highlight
    tri(p, w, h, [(13, 24), (15, 24), (14, 14)], rgba(255, 255, 255, 150))
    # Smaller crystals
    tri(p, w, h, [(4, 28), (10, 28), (7, 18)], color)
    tri(p, w, h, [(22, 28), (28, 28), (25, 20)], color)
    make_png(f"{OUT}/nature/{name}.png", w, h, p)

gen_crystal("crystal_blue", rgba(80, 180, 240))
gen_crystal("crystal_purple", rgba(180, 80, 240))
gen_crystal("crystal_green", rgba(80, 240, 140))

def gen_cactus():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 13, 8, 6, 22, rgba(80, 160, 80))
    # Arms
    rect(p, w, h, 8, 14, 4, 4, rgba(80, 160, 80))
    rect(p, w, h, 8, 14, 2, 6, rgba(80, 160, 80))
    rect(p, w, h, 20, 16, 4, 4, rgba(80, 160, 80))
    rect(p, w, h, 22, 16, 2, 6, rgba(80, 160, 80))
    # Spines
    for y in range(10, 28, 4):
        set_px(p, w, 13, y, rgba(240, 240, 200))
        set_px(p, w, 18, y, rgba(240, 240, 200))
    make_png(f"{OUT}/nature/cactus.png", w, h, p)

gen_cactus()

def gen_log():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 4, 14, 24, 12, rgba(120, 80, 50))
    rect(p, w, h, 4, 14, 24, 2, rgba(100, 70, 40))
    # Rings
    circle(p, w, h, 8, 20, 4, rgba(160, 120, 80))
    circle(p, w, h, 8, 20, 2, rgba(120, 80, 50))
    circle(p, w, h, 24, 20, 4, rgba(160, 120, 80))
    circle(p, w, h, 24, 20, 2, rgba(120, 80, 50))
    make_png(f"{OUT}/nature/log.png", w, h, p)

gen_log()

# ===== PROPS (32x32) =====
def gen_chest():
    w = h = 32
    p = blank(w, h)
    # Body
    rect(p, w, h, 6, 14, 20, 14, rgba(120, 80, 40))
    # Lid
    rect(p, w, h, 6, 8, 20, 6, rgba(140, 100, 60))
    # Lock
    rect(p, w, h, 14, 14, 4, 4, rgba(240, 200, 80))
    # Bands
    hline(p, w, h, 6, 25, 25, rgba(80, 50, 20))
    vline(p, w, h, 10, 8, 27, rgba(80, 50, 20))
    vline(p, w, h, 22, 8, 27, rgba(80, 50, 20))
    make_png(f"{OUT}/props/chest.png", w, h, p)

gen_chest()

def gen_sign(name, board_color=rgba(160, 120, 70)):
    w = h = 32
    p = blank(w, h)
    # Post
    rect(p, w, h, 14, 14, 4, 16, rgba(80, 50, 30))
    # Board
    rect(p, w, h, 6, 4, 20, 12, board_color)
    rect(p, w, h, 6, 4, 20, 2, rgba(120, 80, 50))
    # Text marks
    hline(p, w, h, 9, 8, 19, rgba(60, 40, 20))
    hline(p, w, h, 9, 11, 16, rgba(60, 40, 20))
    make_png(f"{OUT}/props/{name}.png", w, h, p)

gen_sign("sign_wood")
gen_sign("sign_arrow", rgba(160, 120, 70))

def gen_lamp():
    w = h = 32
    p = blank(w, h)
    # Post
    vline(p, w, h, 15, 8, 30, rgba(60, 50, 40))
    vline(p, w, h, 16, 8, 30, rgba(60, 50, 40))
    vline(p, w, h, 17, 8, 30, rgba(60, 50, 40))
    # Top
    rect(p, w, h, 12, 4, 8, 4, rgba(60, 50, 40))
    # Lamp
    circle(p, w, h, 16, 8, 4, rgba(240, 220, 120))
    circle(p, w, h, 16, 8, 2, rgba(255, 255, 200))
    make_png(f"{OUT}/props/lamp.png", w, h, p)

gen_lamp()

def gen_torch():
    w = h = 32
    p = blank(w, h)
    # Stick
    vline(p, w, h, 15, 12, 28, rgba(100, 70, 40))
    vline(p, w, h, 16, 12, 28, rgba(100, 70, 40))
    # Flame
    circle(p, w, h, 16, 8, 5, rgba(255, 160, 40))
    circle(p, w, h, 16, 8, 3, rgba(255, 220, 80))
    set_px(p, w, 16, 8, rgba(255, 255, 200))
    make_png(f"{OUT}/props/torch.png", w, h, p)

gen_torch()

def gen_candle():
    w = h = 32
    p = blank(w, h)
    # Body
    rect(p, w, h, 13, 14, 6, 14, rgba(240, 230, 200))
    # Wick
    vline(p, w, h, 16, 10, 14, rgba(40, 30, 20))
    # Flame
    circle(p, w, h, 16, 8, 3, rgba(255, 180, 40))
    set_px(p, w, 16, 8, rgba(255, 255, 200))
    make_png(f"{OUT}/props/candle.png", w, h, p)

gen_candle()

def gen_barrel():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 8, 8, 16, 20, rgba(140, 90, 50))
    # Bands
    hline(p, w, h, 8, 12, 23, rgba(80, 50, 30))
    hline(p, w, h, 8, 23, 23, rgba(80, 50, 30))
    # Top
    hline(p, w, h, 8, 8, 23, rgba(160, 110, 60))
    # Vertical slats
    for x in range(8, 24, 4):
        vline(p, w, h, x, 9, 27, rgba(100, 60, 30))
    make_png(f"{OUT}/props/barrel.png", w, h, p)

gen_barrel()

def gen_crate():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 4, 8, 24, 22, rgba(160, 110, 60))
    # X pattern
    for i in range(24):
        x = 4 + i; y = 8 + i
        if 4 <= x < 28 and 8 <= y < 30: set_px(p, w, x, y, rgba(100, 60, 30))
        x = 27 - i; y = 8 + i
        if 4 <= x < 28 and 8 <= y < 30: set_px(p, w, x, y, rgba(100, 60, 30))
    # Border
    rect(p, w, h, 4, 8, 24, 22, rgba(100, 60, 30)) if False else None
    hline(p, w, h, 4, 8, 27, rgba(100, 60, 30))
    hline(p, w, h, 4, 29, 27, rgba(100, 60, 30))
    vline(p, w, h, 4, 8, 29, rgba(100, 60, 30))
    vline(p, w, h, 27, 8, 29, rgba(100, 60, 30))
    make_png(f"{OUT}/props/crate.png", w, h, p)

gen_crate()

def gen_bookshelf():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 4, 4, 24, 24, rgba(100, 70, 40))
    # Shelves
    hline(p, w, h, 4, 12, 27, rgba(80, 50, 30))
    hline(p, w, h, 4, 18, 27, rgba(80, 50, 30))
    hline(p, w, h, 4, 24, 27, rgba(80, 50, 30))
    # Books
    colors = [rgba(220, 60, 80), rgba(60, 100, 220), rgba(80, 180, 80), rgba(240, 200, 60), rgba(160, 80, 200)]
    for shelf_y in [6, 13, 19, 25]:
        x = 6
        while x < 26:
            c = colors[(x // 2) % len(colors)]
            bh = 5
            for bx in range(x, min(x+2, 26)):
                for by in range(shelf_y, shelf_y + bh):
                    if by < 28: set_px(p, w, bx, by, c)
            x += 2
    make_png(f"{OUT}/props/bookshelf.png", w, h, p)

gen_bookshelf()

def gen_table():
    w = h = 32
    p = blank(w, h)
    # Top
    rect(p, w, h, 4, 12, 24, 4, rgba(140, 90, 50))
    # Legs
    vline(p, w, h, 6, 16, 28, rgba(100, 70, 40))
    vline(p, w, h, 25, 16, 28, rgba(100, 70, 40))
    make_png(f"{OUT}/props/table.png", w, h, p)

gen_table()

def gen_chair():
    w = h = 32
    p = blank(w, h)
    # Back
    rect(p, w, h, 8, 4, 4, 16, rgba(140, 90, 50))
    # Seat
    rect(p, w, h, 8, 16, 16, 4, rgba(140, 90, 50))
    # Legs
    vline(p, w, h, 8, 20, 28, rgba(100, 70, 40))
    vline(p, w, h, 23, 20, 28, rgba(100, 70, 40))
    make_png(f"{OUT}/props/chair.png", w, h, p)

gen_chair()

def gen_bed():
    w = h = 32
    p = blank(w, h)
    # Frame
    rect(p, w, h, 2, 14, 28, 14, rgba(120, 80, 40))
    # Mattress
    rect(p, w, h, 6, 12, 22, 6, rgba(220, 200, 180))
    # Pillow
    rect(p, w, h, 8, 12, 6, 4, rgba(255, 255, 240))
    # Blanket
    rect(p, w, h, 16, 14, 12, 6, rgba(100, 140, 220))
    make_png(f"{OUT}/props/bed.png", w, h, p)

gen_bed()

def gen_portal():
    w = h = 32
    p = blank(w, h)
    # Outer ring
    for y in range(h):
        for x in range(w):
            d = ((x-16)**2 + (y-16)**2) ** 0.5
            if 8 < d <= 12:
                set_px(p, w, x, y, rgba(120, 60, 200))
            elif d <= 8:
                t = d / 8
                r = int(80 + 100 * t)
                g = int(40 + 100 * t)
                b = int(180 + 60 * t)
                set_px(p, w, x, y, rgba(r, g, b))
    # Sparkles
    for sx, sy in [(10, 10), (22, 10), (16, 6), (16, 26)]:
        set_px(p, w, sx, sy, rgba(255, 255, 255))
    make_png(f"{OUT}/props/portal.png", w, h, p)

gen_portal()

# ===== VEHICLES (32x32) =====
def gen_car(name, body_color):
    w = h = 32
    p = blank(w, h)
    # Body
    rect(p, w, h, 2, 14, 28, 8, body_color)
    # Cabin
    rect(p, w, h, 8, 8, 16, 6, body_color)
    # Windows
    rect(p, w, h, 10, 9, 5, 4, rgba(150, 200, 240))
    rect(p, w, h, 17, 9, 5, 4, rgba(150, 200, 240))
    # Wheels
    circle(p, w, h, 8, 22, 4, rgba(40, 40, 50))
    circle(p, w, h, 24, 22, 4, rgba(40, 40, 50))
    circle(p, w, h, 8, 22, 2, rgba(120, 120, 130))
    circle(p, w, h, 24, 22, 2, rgba(120, 120, 130))
    # Headlights
    set_px(p, w, 29, 16, rgba(255, 255, 100))
    set_px(p, w, 29, 17, rgba(255, 255, 100))
    make_png(f"{OUT}/vehicles/{name}.png", w, h, p)

gen_car("car_red", rgba(220, 60, 60))
gen_car("car_blue", rgba(60, 100, 220))
gen_car("car_green", rgba(60, 180, 80))
gen_car("car_yellow", rgba(240, 200, 60))

def gen_boat():
    w = h = 32
    p = blank(w, h)
    # Hull
    tri(p, w, h, [(2, 20), (30, 20), (24, 28)], rgba(140, 90, 50))
    rect(p, w, h, 2, 18, 28, 4, rgba(140, 90, 50))
    # Mast
    vline(p, w, h, 16, 4, 20, rgba(100, 70, 40))
    # Sail
    tri(p, w, h, [(16, 4), (16, 18), (26, 18)], rgba(240, 240, 230))
    tri(p, w, h, [(16, 4), (16, 18), (6, 18)], rgba(220, 220, 200))
    make_png(f"{OUT}/vehicles/boat.png", w, h, p)

gen_boat()

def gen_plane():
    w = h = 32
    p = blank(w, h)
    # Body
    rect(p, w, h, 2, 14, 28, 4, rgba(200, 200, 210))
    # Nose
    tri(p, w, h, [(2, 14), (2, 18), (-2, 16)]) if False else None
    circle(p, w, h, 4, 16, 3, rgba(200, 200, 210))
    # Wings
    tri(p, w, h, [(10, 14), (22, 14), (16, 6)], rgba(180, 180, 200))
    tri(p, w, h, [(10, 18), (22, 18), (16, 26)], rgba(180, 180, 200))
    # Tail
    tri(p, w, h, [(26, 14), (30, 14), (28, 8)], rgba(180, 180, 200))
    tri(p, w, h, [(26, 18), (30, 18), (28, 24)], rgba(180, 180, 200))
    # Window
    set_px(p, w, 8, 16, rgba(100, 180, 240))
    set_px(p, w, 9, 16, rgba(100, 180, 240))
    make_png(f"{OUT}/vehicles/plane.png", w, h, p)

gen_plane()

def gen_train():
    w = h = 32
    p = blank(w, h)
    # Body
    rect(p, w, h, 2, 12, 24, 10, rgba(80, 100, 140))
    # Cab
    rect(p, w, h, 22, 8, 8, 6, rgba(60, 80, 120))
    # Chimney
    rect(p, w, h, 6, 6, 4, 6, rgba(40, 40, 50))
    # Wheels
    circle(p, w, h, 6, 22, 3, rgba(40, 40, 50))
    circle(p, w, h, 14, 22, 3, rgba(40, 40, 50))
    circle(p, w, h, 22, 22, 3, rgba(40, 40, 50))
    # Window
    rect(p, w, h, 24, 10, 4, 4, rgba(150, 200, 240))
    # Front
    rect(p, w, h, 0, 14, 4, 8, rgba(60, 80, 120))
    make_png(f"{OUT}/vehicles/train.png", w, h, p)

gen_train()

# ===== FOOD (16x16) =====
def gen_apple():
    w = h = 16
    p = blank(w, h)
    circle(p, w, h, 8, 9, 6, rgba(220, 50, 50))
    # Shine
    circle(p, w, h, 6, 7, 2, rgba(255, 200, 200, 180))
    # Stem
    vline(p, w, h, 8, 1, 4, rgba(100, 60, 30))
    # Leaf
    rect(p, w, h, 9, 2, 3, 2, rgba(80, 160, 60))
    make_png(f"{OUT}/food/apple.png", w, h, p)

def gen_banana():
    w = h = 16
    p = blank(w, h)
    for y in range(h):
        for x in range(w):
            # Curved shape
            if 3 <= y <= 12 and 2 <= x <= 13:
                dx = x - 7.5
                dy = y - 7.5
                d = (dx*dx + dy*dy) ** 0.5
                if 3 < d < 5:
                    set_px(p, w, x, y, rgba(240, 220, 60))
    # Stem
    set_px(p, w, 13, 4, rgba(100, 70, 30))
    set_px(p, w, 13, 5, rgba(100, 70, 30))
    make_png(f"{OUT}/food/banana.png", w, h, p)

def gen_bread():
    w = h = 16
    p = blank(w, h)
    # Bread shape
    for y in range(4, 12):
        for x in range(2, 14):
            d = ((x-8)**2 + ((y-8)/1.2)**2) ** 0.5
            if d < 5:
                set_px(p, w, x, y, rgba(220, 170, 100))
    # Slice lines
    vline(p, w, h, 6, 4, 11, rgba(180, 130, 70))
    vline(p, w, h, 10, 4, 11, rgba(180, 130, 70))
    make_png(f"{OUT}/food/bread.png", w, h, p)

def gen_cheese():
    w = h = 16
    p = blank(w, h)
    tri(p, w, h, [(2, 12), (14, 12), (8, 4)], rgba(240, 220, 80))
    # Holes
    set_px(p, w, 7, 9, rgba(200, 180, 60))
    set_px(p, w, 10, 10, rgba(200, 180, 60))
    set_px(p, w, 6, 11, rgba(200, 180, 60))
    make_png(f"{OUT}/food/cheese.png", w, h, p)

def gen_meat():
    w = h = 16
    p = blank(w, h)
    circle(p, w, h, 8, 8, 6, rgba(200, 80, 80))
    circle(p, w, h, 8, 8, 4, rgba(220, 120, 100))
    # Bone
    rect(p, w, h, 6, 12, 4, 3, rgba(240, 230, 200))
    make_png(f"{OUT}/food/meat.png", w, h, p)

def gen_fish():
    w = h = 16
    p = blank(w, h)
    # Body
    for y in range(4, 12):
        for x in range(2, 12):
            d = ((x-7)**2 + ((y-8)/1.3)**2) ** 0.5
            if d < 4:
                set_px(p, w, x, y, rgba(100, 180, 220))
    # Tail
    tri(p, w, h, [(12, 6), (12, 10), (15, 8)], rgba(80, 160, 200))
    # Eye
    set_px(p, w, 5, 7, rgba(40, 40, 40))
    make_png(f"{OUT}/food/fish.png", w, h, p)

def gen_pizza():
    w = h = 16
    p = blank(w, h)
    # Slice (triangle)
    tri(p, w, h, [(2, 13), (14, 13), (8, 2)], rgba(240, 200, 100))
    # Sauce
    tri(p, w, h, [(4, 12), (12, 12), (8, 5)], rgba(220, 80, 60))
    # Pepperoni
    set_px(p, w, 7, 9, rgba(180, 60, 40))
    set_px(p, w, 8, 9, rgba(180, 60, 40))
    set_px(p, w, 9, 10, rgba(180, 60, 40))
    set_px(p, w, 10, 10, rgba(180, 60, 40))
    make_png(f"{OUT}/food/pizza.png", w, h, p)

def gen_burger():
    w = h = 16
    p = blank(w, h)
    # Top bun
    for y in range(2, 6):
        for x in range(2, 14):
            d = ((x-8)**2 + ((y-6)*2)**2) ** 0.5
            if d < 5.5:
                set_px(p, w, x, y, rgba(220, 170, 100))
    # Patty
    rect(p, w, h, 2, 6, 12, 3, rgba(120, 70, 40))
    # Lettuce
    rect(p, w, h, 2, 9, 12, 2, rgba(100, 200, 80))
    # Bottom bun
    rect(p, w, h, 2, 11, 12, 3, rgba(200, 150, 80))
    make_png(f"{OUT}/food/burger.png", w, h, p)

def gen_cake():
    w = h = 16
    p = blank(w, h)
    # Bottom
    rect(p, w, h, 2, 10, 12, 4, rgba(240, 200, 220))
    # Top layer
    rect(p, w, h, 4, 6, 8, 4, rgba(240, 200, 220))
    # Cherry
    circle(p, w, h, 8, 4, 2, rgba(220, 50, 60))
    # Candle
    vline(p, w, h, 8, 2, 6, rgba(240, 240, 200))
    set_px(p, w, 8, 1, rgba(255, 180, 40))
    make_png(f"{OUT}/food/cake.png", w, h, p)

gen_apple(); gen_banana(); gen_bread(); gen_cheese(); gen_meat(); gen_fish(); gen_pizza(); gen_burger(); gen_cake()

# ===== CHARACTERS (32x32) =====
def gen_npc(name, body_color, hair_color):
    w = h = 32
    p = blank(w, h)
    # Head
    rect(p, w, h, 11, 4, 10, 9, rgba(240, 200, 170))
    # Hair
    rect(p, w, h, 11, 3, 10, 3, hair_color)
    rect(p, w, h, 11, 6, 2, 2, hair_color)
    rect(p, w, h, 19, 6, 2, 2, hair_color)
    # Eyes
    rect(p, w, h, 13, 8, 2, 2, rgba(40, 40, 60))
    rect(p, w, h, 17, 8, 2, 2, rgba(40, 40, 60))
    # Mouth
    hline(p, w, h, 14, 11, 17, rgba(140, 80, 60))
    # Body
    rect(p, w, h, 9, 14, 14, 12, body_color)
    # Arms
    rect(p, w, h, 5, 15, 4, 8, rgba(240, 200, 170))
    rect(p, w, h, 23, 15, 4, 8, rgba(240, 200, 170))
    # Belt
    rect(p, w, h, 9, 22, 14, 2, rgba(80, 50, 30))
    # Legs
    rect(p, w, h, 11, 26, 4, 6, rgba(60, 50, 40))
    rect(p, w, h, 17, 26, 4, 6, rgba(60, 50, 40))
    make_png(f"{OUT}/characters/{name}.png", w, h, p)

gen_npc("npc_villager", rgba(120, 100, 200), rgba(100, 60, 30))
gen_npc("npc_merchant", rgba(200, 160, 60), rgba(120, 80, 40))
gen_npc("npc_guard", rgba(120, 140, 160), rgba(60, 40, 30))
gen_npc("npc_child", rgba(220, 100, 100), rgba(180, 140, 60))
gen_npc("npc_elder", rgba(120, 100, 80), rgba(220, 220, 220))
gen_npc("npc_wizard", rgba(80, 60, 180), rgba(220, 220, 220))

def gen_animal(name, body_color, eye_color=rgba(40, 40, 40)):
    w = h = 32
    p = blank(w, h)
    # Body
    circle(p, w, h, 16, 18, 9, body_color)
    # Head
    circle(p, w, h, 16, 12, 7, body_color)
    # Ears (cat-like)
    tri(p, w, h, [(9, 6), (13, 6), (11, 2)], body_color)
    tri(p, w, h, [(19, 6), (23, 6), (21, 2)], body_color)
    # Eyes
    set_px(p, w, 13, 11, eye_color)
    set_px(p, w, 14, 11, eye_color)
    set_px(p, w, 18, 11, eye_color)
    set_px(p, w, 19, 11, eye_color)
    # Nose
    set_px(p, w, 16, 14, rgba(220, 100, 120))
    # Whiskers
    hline(p, w, h, 10, 14, 13, rgba(200, 200, 200))
    hline(p, w, h, 19, 14, 22, rgba(200, 200, 200))
    # Legs
    rect(p, w, h, 8, 24, 4, 4, body_color)
    rect(p, w, h, 20, 24, 4, 4, body_color)
    # Tail
    vline(p, w, h, 26, 14, 22, body_color)
    make_png(f"{OUT}/characters/{name}.png", w, h, p)

gen_animal("cat_orange", rgba(240, 160, 80))
gen_animal("cat_black", rgba(40, 30, 40))
gen_animal("cat_white", rgba(240, 240, 240))
gen_animal("dog_brown", rgba(140, 90, 50))
gen_animal("dog_gray", rgba(120, 120, 130))

def gen_chicken():
    w = h = 32
    p = blank(w, h)
    # Body
    circle(p, w, h, 16, 18, 8, rgba(255, 255, 255))
    # Head
    circle(p, w, h, 16, 10, 5, rgba(255, 255, 255))
    # Comb
    rect(p, w, h, 14, 4, 4, 3, rgba(220, 60, 60))
    # Beak
    tri(p, w, h, [(20, 10), (24, 11), (20, 13)], rgba(240, 180, 40))
    # Eye
    set_px(p, w, 17, 9, rgba(40, 40, 40))
    # Legs
    vline(p, w, h, 13, 26, 30, rgba(240, 180, 40))
    vline(p, w, h, 19, 26, 30, rgba(240, 180, 40))
    make_png(f"{OUT}/characters/chicken.png", w, h, p)

gen_chicken()

# ===== WEAPONS (32x32) =====
def gen_sword(name, blade_color=rgba(200, 210, 230), hilt_color=rgba(120, 80, 40)):
    w = h = 32
    p = blank(w, h)
    # Blade
    rect(p, w, h, 14, 2, 4, 20, blade_color)
    # Tip
    set_px(p, w, 15, 1, blade_color)
    set_px(p, w, 16, 1, blade_color)
    # Highlight
    vline(p, w, h, 15, 3, 20, rgba(240, 240, 250))
    # Crossguard
    rect(p, w, h, 9, 22, 14, 3, rgba(220, 180, 80))
    # Hilt
    rect(p, w, h, 14, 25, 4, 6, hilt_color)
    # Pommel
    circle(p, w, h, 16, 31, 2, rgba(220, 180, 80))
    make_png(f"{OUT}/weapons/{name}.png", w, h, p)

gen_sword("sword_iron")
gen_sword("sword_steel", rgba(180, 200, 230))
gen_sword("sword_gold", rgba(240, 200, 80))
gen_sword("sword_fire", rgba(255, 100, 30))

def gen_bow():
    w = h = 32
    p = blank(w, h)
    # Bow arc
    for y in range(h):
        for x in range(w):
            d = ((x-22)**2 + (y-16)**2) ** 0.5
            if 11 < d < 13 and x < 26:
                set_px(p, w, x, y, rgba(140, 90, 50))
    # String
    vline(p, w, h, 12, 4, 28, rgba(240, 240, 220))
    # Arrow
    hline(p, w, h, 4, 16, 22, rgba(160, 120, 80))
    tri(p, w, h, [(22, 14), (22, 18), (26, 16)], rgba(200, 200, 220))
    # Fletching
    tri(p, w, h, [(4, 14), (4, 18), (0, 16)], rgba(220, 80, 80))
    make_png(f"{OUT}/weapons/bow.png", w, h, p)

gen_bow()

def gen_axe():
    w = h = 32
    p = blank(w, h)
    # Handle
    vline(p, w, h, 14, 4, 28, rgba(140, 90, 50))
    vline(p, w, h, 15, 4, 28, rgba(140, 90, 50))
    # Head
    tri(p, w, h, [(8, 4), (24, 4), (16, 14)], rgba(180, 190, 210))
    rect(p, w, h, 8, 4, 16, 3, rgba(180, 190, 210))
    # Highlight
    hline(p, w, h, 9, 5, 14, rgba(240, 240, 250))
    make_png(f"{OUT}/weapons/axe.png", w, h, p)

gen_axe()

def gen_staff():
    w = h = 32
    p = blank(w, h)
    # Staff
    vline(p, w, h, 15, 8, 30, rgba(100, 70, 40))
    vline(p, w, h, 16, 8, 30, rgba(100, 70, 40))
    # Crystal
    circle(p, w, h, 16, 8, 5, rgba(120, 180, 240, 200))
    circle(p, w, h, 16, 8, 3, rgba(180, 220, 255, 230))
    set_px(p, w, 16, 8, rgba(255, 255, 255))
    make_png(f"{OUT}/weapons/staff.png", w, h, p)

gen_staff()

def gen_wand():
    w = h = 32
    p = blank(w, h)
    vline(p, w, h, 15, 8, 30, rgba(100, 70, 40))
    # Star tip
    pts = []
    for i in range(10):
        r = 6 if i % 2 == 0 else 3
        a = math.pi / 2 + i * math.pi / 5 - math.pi / 5
        pts.append((15 + math.cos(a) * r, 8 - math.sin(a) * r))
    for y in range(h):
        for x in range(w):
            inside = False
            j = len(pts) - 1
            for i in range(len(pts)):
                xi, yi = pts[i]; xj, yj = pts[j]
                if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 0.0001) + xi):
                    inside = not inside
                j = i
            if inside: set_px(p, w, x, y, rgba(240, 220, 80))
    make_png(f"{OUT}/weapons/wand.png", w, h, p)

gen_wand()

def gen_shield_weapon():
    w = h = 32
    p = blank(w, h)
    # Shield shape (pointed bottom)
    for y in range(4, 28):
        for x in range(6, 26):
            width_at_y = 9 - max(0, y - 18)
            if abs(x - 16) <= width_at_y:
                set_px(p, w, x, y, rgba(180, 180, 200))
                if abs(x - 16) <= width_at_y - 1 and y < 27:
                    set_px(p, w, x, y, rgba(120, 140, 180))
    # Cross
    rect(p, w, h, 14, 8, 4, 14, rgba(240, 200, 80))
    rect(p, w, h, 10, 12, 12, 4, rgba(240, 200, 80))
    make_png(f"{OUT}/weapons/shield.png", w, h, p)

gen_shield_weapon()

print("Generated all extra sprite assets!")
