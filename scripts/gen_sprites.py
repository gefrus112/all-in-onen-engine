"""Generate sprite asset library for Lapia Studio."""
import os
import struct
import zlib

OUT = "/home/z/my-project/public/sprites"

def make_png(path, w, h, pixels):
    """pixels: list of (r,g,b,a) per pixel, row-major."""
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

def rgba(r, g, b, a=255):
    return (r, g, b, a)

def blank(w, h):
    return [rgba(0,0,0,0)] * (w*h)

def set_px(pixels, w, x, y, color):
    pixels[y*w + x] = color

def rect(pixels, w, h, x0, y0, rw, rh, color):
    for y in range(y0, y0+rh):
        for x in range(x0, x0+rw):
            if 0 <= x < w and 0 <= y < h:
                set_px(pixels, w, x, y, color)

def circle(pixels, w, h, cx, cy, r, color, fill=True):
    for y in range(h):
        for x in range(w):
            d = ((x-cx)**2 + (y-cy)**2) ** 0.5
            if d <= r:
                set_px(pixels, w, x, y, color)
            elif d <= r + 1 and not fill:
                set_px(pixels, w, x, y, color)

def hline(pixels, w, h, x0, x1, y, color):
    for x in range(x0, x1+1):
        if 0 <= x < w and 0 <= y < h:
            set_px(pixels, w, x, y, color)

def vline(pixels, w, h, x, y0, y1, color):
    for y in range(y0, y1+1):
        if 0 <= x < w and 0 <= y < h:
            set_px(pixels, w, x, y, color)

# PLAYER SPRITES (32x32)
def gen_player(name, body_color, head_color, accent):
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 10, 4, 12, 10, head_color)
    rect(p, w, h, 12, 8, 2, 2, rgba(0, 0, 0))
    rect(p, w, h, 18, 8, 2, 2, rgba(0, 0, 0))
    rect(p, w, h, 8, 14, 16, 12, body_color)
    rect(p, w, h, 8, 22, 16, 2, accent)
    rect(p, w, h, 4, 16, 4, 8, body_color)
    rect(p, w, h, 24, 16, 4, 8, body_color)
    rect(p, w, h, 10, 26, 4, 6, rgba(60, 50, 40))
    rect(p, w, h, 18, 26, 4, 6, rgba(60, 50, 40))
    make_png(f"{OUT}/player/{name}.png", w, h, p)

gen_player("knight", rgba(80, 130, 220), rgba(240, 200, 170), rgba(220, 180, 80))
gen_player("mage", rgba(140, 80, 200), rgba(240, 200, 170), rgba(240, 200, 80))
gen_player("archer", rgba(80, 180, 100), rgba(240, 200, 170), rgba(140, 100, 60))
gen_player("rogue", rgba(60, 60, 70), rgba(240, 200, 170), rgba(180, 60, 80))
gen_player("wizard", rgba(80, 60, 180), rgba(240, 200, 170), rgba(240, 240, 100))
gen_player("robot", rgba(150, 150, 170), rgba(200, 200, 220), rgba(80, 220, 100))

# ENEMIES
def gen_slime(name, color):
    w = h = 32
    p = blank(w, h)
    for y in range(8, h):
        for x in range(w):
            d = ((x-16)**2 + (y-24)**2) ** 0.5
            if d <= 12 and y > 8:
                set_px(p, w, x, y, color)
            elif d <= 13 and y > 8:
                set_px(p, w, x, y, rgba(color[0]//2, color[1]//2, color[2]//2, 255))
    circle(p, w, h, 12, 16, 2, rgba(255, 255, 255))
    circle(p, w, h, 20, 16, 2, rgba(255, 255, 255))
    circle(p, w, h, 12, 16, 1, rgba(0, 0, 0))
    circle(p, w, h, 20, 16, 1, rgba(0, 0, 0))
    hline(p, w, h, 13, 19, 19, rgba(0, 0, 0))
    make_png(f"{OUT}/enemies/{name}.png", w, h, p)

gen_slime("slime_green", rgba(100, 200, 80))
gen_slime("slime_blue", rgba(80, 160, 220))
gen_slime("slime_red", rgba(220, 80, 80))
gen_slime("slime_purple", rgba(160, 80, 200))
gen_slime("slime_gold", rgba(240, 200, 80))

def gen_bat(name, body_color):
    w = h = 32
    p = blank(w, h)
    circle(p, w, h, 16, 16, 6, body_color)
    for x in range(2, 14):
        for y in range(10, 22):
            if (x-8)**2 + ((y-16)/1.5)**2 < 36:
                set_px(p, w, x, y, body_color)
    for x in range(18, 30):
        for y in range(10, 22):
            if (x-24)**2 + ((y-16)/1.5)**2 < 36:
                set_px(p, w, x, y, body_color)
    circle(p, w, h, 13, 14, 1, rgba(255, 50, 50))
    circle(p, w, h, 19, 14, 1, rgba(255, 50, 50))
    set_px(p, w, 15, 19, rgba(255, 255, 255))
    set_px(p, w, 17, 19, rgba(255, 255, 255))
    make_png(f"{OUT}/enemies/{name}.png", w, h, p)

gen_bat("bat_black", rgba(40, 30, 60))
gen_bat("bat_purple", rgba(120, 60, 160))

def gen_ghost(name, color):
    w = h = 32
    p = blank(w, h)
    for y in range(4, 22):
        for x in range(4, 28):
            if (x-16)**2 + (y-12)**2 < 144 and y < 22:
                set_px(p, w, x, y, color)
    for x in range(4, 28):
        y = 22 if (x // 4) % 2 == 0 else 24
        for yy in range(22, y+1):
            set_px(p, w, x, yy, color)
    circle(p, w, h, 11, 11, 2, rgba(255, 255, 255))
    circle(p, w, h, 21, 11, 2, rgba(255, 255, 255))
    circle(p, w, h, 11, 11, 1, rgba(0, 0, 0))
    circle(p, w, h, 21, 11, 1, rgba(0, 0, 0))
    make_png(f"{OUT}/enemies/{name}.png", w, h, p)

gen_ghost("ghost_white", rgba(240, 240, 250, 230))
gen_ghost("ghost_pink", rgba(255, 180, 200, 230))

def gen_spider(name, color):
    w = h = 32
    p = blank(w, h)
    circle(p, w, h, 16, 14, 6, color)
    circle(p, w, h, 16, 8, 4, color)
    for ex, ey in [(12,6),(14,5),(18,5),(20,6),(13,8),(19,8),(15,9),(17,9)]:
        set_px(p, w, ex, ey, rgba(255, 50, 50))
    for i in range(8):
        for j in range(8):
            x = 8 + i * 5
            y = 12 + j
            if 0 <= x < w and 0 <= y < h:
                set_px(p, w, x, y, color)
    make_png(f"{OUT}/enemies/{name}.png", w, h, p)

gen_spider("spider_black", rgba(40, 30, 40))

# TILES
def gen_grass():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 0, 0, 32, 32, rgba(110, 75, 50))
    rect(p, w, h, 0, 0, 32, 8, rgba(80, 180, 80))
    for x in range(0, 32, 2):
        set_px(p, w, x, 8, rgba(100, 220, 100))
        set_px(p, w, x+1, 9, rgba(100, 220, 100))
    for x in range(0, 32, 4):
        set_px(p, w, x, 14, rgba(80, 50, 30))
        set_px(p, w, x+2, 22, rgba(140, 90, 60))
    make_png(f"{OUT}/tiles/grass.png", w, h, p)

def gen_dirt():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 0, 0, 32, 32, rgba(120, 80, 50))
    for x in range(0, 32, 4):
        set_px(p, w, x, 8, rgba(100, 60, 30))
        set_px(p, w, x+2, 16, rgba(140, 100, 60))
        set_px(p, w, x, 24, rgba(100, 60, 30))
    make_png(f"{OUT}/tiles/dirt.png", w, h, p)

def gen_stone():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 0, 0, 32, 32, rgba(120, 120, 130))
    hline(p, w, h, 4, 14, 12, rgba(80, 80, 90))
    hline(p, w, h, 18, 24, 28, rgba(80, 80, 90))
    vline(p, w, h, 12, 14, 22, rgba(80, 80, 90))
    vline(p, w, h, 24, 6, 14, rgba(80, 80, 90))
    make_png(f"{OUT}/tiles/stone.png", w, h, p)

def gen_water():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 0, 0, 32, 32, rgba(60, 130, 220))
    for y in [8, 16, 24]:
        for x in range(0, 32, 4):
            set_px(p, w, x, y, rgba(150, 200, 250))
            set_px(p, w, x+1, y, rgba(150, 200, 250))
    make_png(f"{OUT}/tiles/water.png", w, h, p)

def gen_lava():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 0, 0, 32, 32, rgba(220, 80, 30))
    for y in [8, 16, 24]:
        for x in range(0, 32, 4):
            set_px(p, w, x, y, rgba(255, 200, 50))
            set_px(p, w, x+1, y, rgba(255, 200, 50))
    make_png(f"{OUT}/tiles/lava.png", w, h, p)

def gen_sand():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 0, 0, 32, 32, rgba(230, 210, 140))
    for x in range(0, 32, 6):
        set_px(p, w, x, 6, rgba(200, 180, 110))
        set_px(p, w, x+3, 14, rgba(200, 180, 110))
        set_px(p, w, x+1, 22, rgba(200, 180, 110))
    make_png(f"{OUT}/tiles/sand.png", w, h, p)

def gen_snow():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 0, 0, 32, 32, rgba(240, 245, 255))
    for x in range(0, 32, 5):
        set_px(p, w, x, 8, rgba(220, 230, 245))
        set_px(p, w, x+2, 18, rgba(220, 230, 245))
        set_px(p, w, x+1, 26, rgba(220, 230, 245))
    make_png(f"{OUT}/tiles/snow.png", w, h, p)

def gen_wood():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 0, 0, 32, 32, rgba(140, 90, 50))
    hline(p, w, h, 0, 10, 31, rgba(100, 60, 30))
    hline(p, w, h, 0, 20, 31, rgba(100, 60, 30))
    circle(p, w, h, 8, 16, 2, rgba(80, 50, 30))
    circle(p, w, h, 24, 16, 2, rgba(80, 50, 30))
    make_png(f"{OUT}/tiles/wood.png", w, h, p)

def gen_brick():
    w = h = 32
    p = blank(w, h)
    rect(p, w, h, 0, 0, 32, 32, rgba(180, 80, 70))
    hline(p, w, h, 0, 10, 31, rgba(220, 220, 200))
    hline(p, w, h, 0, 21, 31, rgba(220, 220, 200))
    vline(p, w, h, 15, 0, 10, rgba(220, 220, 200))
    for y in range(11, 21):
        set_px(p, w, 15, y, rgba(180, 80, 70))
    vline(p, w, h, 15, 21, 31, rgba(220, 220, 200))
    make_png(f"{OUT}/tiles/brick.png", w, h, p)

gen_grass(); gen_dirt(); gen_stone(); gen_water(); gen_lava(); gen_sand(); gen_snow(); gen_wood(); gen_brick()

# COINS
def gen_coin(name, color, glow_color=None):
    w = h = 16
    p = blank(w, h)
    if glow_color:
        circle(p, w, h, 8, 8, 8, glow_color)
    circle(p, w, h, 8, 8, 6, color)
    circle(p, w, h, 6, 6, 2, rgba(255, 255, 255, 200))
    make_png(f"{OUT}/coins/{name}.png", w, h, p)

gen_coin("coin_gold", rgba(255, 215, 0), rgba(255, 240, 100, 80))
gen_coin("coin_silver", rgba(200, 200, 220), rgba(240, 240, 255, 80))
gen_coin("coin_copper", rgba(200, 130, 80), rgba(240, 180, 100, 80))
gen_coin("gem_emerald", rgba(80, 220, 140), rgba(140, 255, 200, 80))
gen_coin("gem_ruby", rgba(220, 50, 80), rgba(255, 120, 150, 80))
gen_coin("gem_sapphire", rgba(80, 130, 240), rgba(140, 180, 255, 80))
gen_coin("gem_diamond", rgba(180, 230, 255), rgba(220, 240, 255, 100))

# POWER-UPS
def gen_heart():
    w = h = 16
    p = blank(w, h)
    for y in range(h):
        for x in range(w):
            dx1 = x - 5; dy1 = y - 6
            dx2 = x - 10; dy2 = y - 6
            if dx1*dx1 + dy1*dy1 < 12 or dx2*dx2 + dy2*dy2 < 12:
                set_px(p, w, x, y, rgba(220, 50, 80))
            if y >= 7 and x >= 4 and x <= 11 and (x - 7.5) + (y - 7) <= 5 and (7.5 - x) + (y - 7) <= 5:
                set_px(p, w, x, y, rgba(220, 50, 80))
    set_px(p, w, 4, 5, rgba(255, 200, 200))
    make_png(f"{OUT}/powerups/heart.png", w, h, p)

def gen_potion(name, color):
    w = h = 16
    p = blank(w, h)
    rect(p, w, h, 5, 6, 6, 8, rgba(220, 220, 230, 200))
    rect(p, w, h, 6, 8, 4, 5, color)
    rect(p, w, h, 7, 2, 2, 4, rgba(180, 180, 200, 220))
    rect(p, w, h, 7, 1, 2, 1, rgba(140, 90, 50))
    set_px(p, w, 6, 9, rgba(255, 255, 255, 200))
    make_png(f"{OUT}/powerups/{name}.png", w, h, p)

def gen_speed_boot():
    w = h = 16
    p = blank(w, h)
    rect(p, w, h, 3, 8, 10, 6, rgba(120, 80, 50))
    rect(p, w, h, 3, 5, 4, 3, rgba(120, 80, 50))
    rect(p, w, h, 2, 13, 12, 2, rgba(60, 40, 20))
    for x in range(8, 14):
        set_px(p, w, x, 6, rgba(255, 255, 100))
        set_px(p, w, x, 7, rgba(255, 255, 100))
    make_png(f"{OUT}/powerups/speed_boot.png", w, h, p)

def gen_shield():
    w = h = 16
    p = blank(w, h)
    for y in range(2, 14):
        for x in range(3, 13):
            width_at_y = 9 - max(0, y - 8)
            if abs(x - 7.5) <= width_at_y / 2 and y < 14:
                set_px(p, w, x, y, rgba(200, 200, 220))
                if abs(x - 7.5) <= (width_at_y / 2) - 1 and y < 13:
                    set_px(p, w, x, y, rgba(100, 150, 220))
    rect(p, w, h, 7, 5, 1, 6, rgba(255, 255, 255))
    rect(p, w, h, 5, 7, 5, 1, rgba(255, 255, 255))
    make_png(f"{OUT}/powerups/shield.png", w, h, p)

def gen_key():
    w = h = 16
    p = blank(w, h)
    circle(p, w, h, 5, 5, 3, rgba(240, 200, 80), fill=False)
    hline(p, w, h, 7, 14, 10, rgba(240, 200, 80))
    hline(p, w, h, 7, 15, 10, rgba(240, 200, 80))
    vline(p, w, h, 12, 13, 14, rgba(240, 200, 80))
    vline(p, w, h, 14, 13, 14, rgba(240, 200, 80))
    make_png(f"{OUT}/powerups/key.png", w, h, p)

gen_heart()
gen_potion("potion_red", rgba(220, 50, 50))
gen_potion("potion_blue", rgba(50, 100, 220))
gen_potion("potion_green", rgba(50, 200, 80))
gen_potion("potion_purple", rgba(160, 50, 200))
gen_speed_boot()
gen_shield()
gen_key()

# PROJECTILES
def gen_projectile(name, color, glow_color):
    w = h = 8
    p = blank(w, h)
    circle(p, w, h, 4, 4, 4, glow_color)
    circle(p, w, h, 4, 4, 2, color)
    set_px(p, w, 4, 4, rgba(255, 255, 255))
    make_png(f"{OUT}/projectiles/{name}.png", w, h, p)

gen_projectile("fireball", rgba(255, 100, 30), rgba(255, 200, 80, 100))
gen_projectile("iceball", rgba(100, 180, 255), rgba(180, 220, 255, 100))
gen_projectile("lightning", rgba(255, 240, 100), rgba(255, 255, 200, 100))
gen_projectile("poison", rgba(120, 220, 80), rgba(180, 255, 140, 100))
gen_projectile("arrow", rgba(180, 140, 80), rgba(220, 200, 140, 80))

# PARTICLES
def gen_particle(name, color):
    w = h = 8
    p = blank(w, h)
    for y in range(h):
        for x in range(w):
            d = ((x-4)**2 + (y-4)**2) ** 0.5
            if d <= 4:
                a = int(255 * (1 - d/4))
                set_px(p, w, x, y, (color[0], color[1], color[2], a))
    make_png(f"{OUT}/particles/{name}.png", w, h, p)

gen_particle("spark_orange", (255, 180, 80))
gen_particle("spark_blue", (100, 180, 255))
gen_particle("spark_green", (100, 220, 100))
gen_particle("spark_purple", (200, 100, 220))
gen_particle("smoke_gray", (140, 140, 140))
gen_particle("magic_pink", (255, 150, 220))

# UI ICONS
def gen_ui_heart():
    w = h = 16
    p = blank(w, h)
    for y in range(h):
        for x in range(w):
            dx1 = x - 5; dy1 = y - 6
            dx2 = x - 10; dy2 = y - 6
            if dx1*dx1 + dy1*dy1 < 12 or dx2*dx2 + dy2*dy2 < 12:
                set_px(p, w, x, y, rgba(220, 50, 80))
            if y >= 7 and x >= 4 and x <= 11 and (x - 7.5) + (y - 7) <= 5 and (7.5 - x) + (y - 7) <= 5:
                set_px(p, w, x, y, rgba(220, 50, 80))
    make_png(f"{OUT}/ui/heart.png", w, h, p)

def gen_ui_star():
    import math
    w = h = 16
    p = blank(w, h)
    pts = []
    for i in range(10):
        r = 7 if i % 2 == 0 else 3
        a = math.pi / 2 + i * math.pi / 5 - math.pi / 5
        pts.append((8 + math.cos(a) * r, 8 - math.sin(a) * r))
    for y in range(h):
        for x in range(w):
            inside = False
            j = len(pts) - 1
            for i in range(len(pts)):
                xi, yi = pts[i]; xj, yj = pts[j]
                if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 0.0001) + xi):
                    inside = not inside
                j = i
            if inside:
                set_px(p, w, x, y, rgba(255, 220, 60))
    make_png(f"{OUT}/ui/star.png", w, h, p)

def gen_ui_coin():
    w = h = 16
    p = blank(w, h)
    circle(p, w, h, 8, 8, 6, rgba(255, 215, 0))
    circle(p, w, h, 8, 8, 4, rgba(220, 180, 0))
    set_px(p, w, 8, 5, rgba(140, 90, 0))
    set_px(p, w, 8, 11, rgba(140, 90, 0))
    make_png(f"{OUT}/ui/coin.png", w, h, p)

def gen_ui_flag():
    w = h = 16
    p = blank(w, h)
    vline(p, w, h, 3, 1, 14, rgba(100, 80, 60))
    rect(p, w, h, 4, 2, 8, 5, rgba(220, 50, 50))
    make_png(f"{OUT}/ui/flag.png", w, h, p)

gen_ui_heart()
gen_ui_star()
gen_ui_coin()
gen_ui_flag()

print("Generated all sprite assets!")
