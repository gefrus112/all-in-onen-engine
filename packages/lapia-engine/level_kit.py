"""
lapia-engine :: level_kit
Tilemap loading + procedural level generation (platformer caves, rooms, mazes).
Generates plain Python data — portable between the desktop engine and the
browser studio shim.
"""
import random


class TileMap:
    def __init__(self, w, h, tile_size=32):
        self.w = w
        self.h = h
        self.tile_size = tile_size
        self.solid = set()  # set of (tx, ty)

    def add(self, tx, ty):
        self.solid.add((tx, ty))

    def remove(self, tx, ty):
        self.solid.discard((tx, ty))

    def is_solid(self, tx, ty):
        return (tx, ty) in self.solid

    def add_ground(self, ty=None, thickness=1):
        ty = self.h - 2 if ty is None else ty
        for x in range(self.w):
            for d in range(thickness):
                self.add(x, ty + d)

    def add_platform(self, tx, ty, length):
        for x in range(tx, min(self.w, tx + length)):
            self.add(x, ty)

    def add_walls(self):
        for y in range(self.h):
            self.add(0, y)
            self.add(self.w - 1, y)

    def to_lapia_shim(self):
        """Data shape used by the studio's default platformer demo."""
        return {
            "tile_size": self.tile_size,
            "w": self.w,
            "h": self.h,
            "solid": lambda tx, ty: (tx, ty) in self.solid,
        }


def generate_caves(w, h, fill=0.44, seed=None, smoothing=4):
    """Cellular-automata cave generation. Returns a TileMap."""
    rng = random.Random(seed)
    m = TileMap(w, h)
    grid = {(x, y) for x in range(w) for y in range(h) if rng.random() < fill}
    for _ in range(smoothing):
        nxt = set()
        for x in range(w):
            for y in range(h):
                n = sum((x + dx, y + dy) in grid for dx in (-1, 0, 1) for dy in (-1, 0, 1))
                if n >= 5:
                    nxt.add((x, y))
        grid = nxt
    m.solid = grid
    return m


def generate_rooms(w, h, rooms=6, seed=None):
    """Simple dungeon rooms connected by corridors. Returns a TileMap."""
    rng = random.Random(seed)
    m = TileMap(w, h)
    rects = []
    for _ in range(rooms):
        rw, rh = rng.randint(5, 10), rng.randint(4, 7)
        rx, ry = rng.randint(1, w - rw - 2), rng.randint(1, h - rh - 2)
        rects.append((rx, ry, rw, rh))
    for (rx, ry, rw, rh) in rects:
        for x in range(rx, rx + rw):
            for y in range(ry, ry + rh):
                m.add(x, y)
    for i in range(1, len(rects)):
        ax, ay = rects[i - 1][0] + rects[i - 1][2] // 2, rects[i - 1][1] + rects[i - 1][3] // 2
        bx, by = rects[i][0] + rects[i][2] // 2, rects[i][1] + rects[i][3] // 2
        for x in range(min(ax, bx), max(ax, bx) + 1):
            m.add(x, ay)
        for y in range(min(ay, by), max(ay, by) + 1):
            m.add(bx, y)
    return m


def generate_maze(w, h, seed=None):
    """Odd-sized recursive backtracker maze. Returns a TileMap."""
    rng = random.Random(seed)
    m = TileMap(w, h)
    for x in range(w):
        for y in range(h):
            m.add(x, y)
    def carve(x, y):
        m.remove(x, y)
        dirs = [(2, 0), (-2, 0), (0, 2), (0, -2)]
        rng.shuffle(dirs)
        for dx, dy in dirs:
            nx, ny = x + dx, y + dy
            if 1 <= nx < w - 1 and 1 <= ny < h - 1 and m.is_solid(nx, ny):
                m.remove(x + dx // 2, y + dy // 2)
                carve(nx, ny)
    carve(1, 1)
    return m
