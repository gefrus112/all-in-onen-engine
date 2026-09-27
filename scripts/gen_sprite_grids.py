"""Generate sprite grid screenshots for the README."""
import os
from PIL import Image, ImageDraw, ImageFont

SPRITES_DIR = "/home/z/my-project/public/sprites"
OUT_DIR = "/home/z/my-project/download"

CATEGORIES = [
    ("player", "Player Characters"),
    ("characters", "NPCs & Animals"),
    ("enemies", "Enemies"),
    ("structures", "Buildings"),
    ("nature", "Trees & Plants"),
    ("tiles", "Tiles"),
    ("coins", "Coins & Gems"),
    ("powerups", "Power-ups"),
    ("props", "Props"),
    ("food", "Food"),
    ("weapons", "Weapons"),
    ("vehicles", "Vehicles"),
    ("projectiles", "Projectiles"),
    ("particles", "Particles"),
    ("ui", "UI Icons"),
]

TILE_SIZE = 48
TILES_PER_ROW = 8
PADDING = 8
HEADER_HEIGHT = 32

def make_grid(category_slug, label, sprite_paths, out_path):
    if not sprite_paths:
        return
    n = len(sprite_paths)
    rows = (n + TILES_PER_ROW - 1) // TILES_PER_ROW
    width = TILES_PER_ROW * (TILE_SIZE + PADDING) + PADDING
    height = HEADER_HEIGHT + rows * (TILE_SIZE + PADDING) + PADDING
    img = Image.new("RGBA", (width, height), (30, 32, 40, 255))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
    except Exception:
        font = ImageFont.load_default()
    draw.text((PADDING, 8), f"{label}  ({n})", fill=(230, 235, 245, 255), font=font)
    for i, path in enumerate(sprite_paths):
        row = i // TILES_PER_ROW
        col = i % TILES_PER_ROW
        x = PADDING + col * (TILE_SIZE + PADDING)
        y = HEADER_HEIGHT + row * (TILE_SIZE + PADDING)
        try:
            sprite = Image.open(path).convert("RGBA")
            sprite.thumbnail((TILE_SIZE, TILE_SIZE))
            # Center
            sx = x + (TILE_SIZE - sprite.width) // 2
            sy = y + (TILE_SIZE - sprite.height) // 2
            img.paste(sprite, (sx, sy), sprite)
        except Exception as e:
            print(f"Failed to load {path}: {e}")
    img.save(out_path)
    print(f"  Saved {out_path} ({n} sprites)")

# Generate one image per category
for slug, label in CATEGORIES:
    cat_dir = os.path.join(SPRITES_DIR, slug)
    if not os.path.isdir(cat_dir):
        continue
    paths = sorted([
        os.path.join(cat_dir, f) for f in os.listdir(cat_dir) if f.endswith(".png")
    ])
    out = os.path.join(OUT_DIR, f"sprites-{slug}.png")
    make_grid(slug, label, paths, out)

# Generate a combined overview image (first sprite of each category)
print("\nGenerating combined overview...")
overview_paths = []
overview_labels = []
for slug, label in CATEGORIES:
    cat_dir = os.path.join(SPRITES_DIR, slug)
    if not os.path.isdir(cat_dir):
        continue
    files = sorted([f for f in os.listdir(cat_dir) if f.endswith(".png")])
    for f in files[:4]:  # First 4 from each category
        overview_paths.append(os.path.join(cat_dir, f))

out = os.path.join(OUT_DIR, "sprites-overview.png")
make_grid("overview", "All 134 Sprites", overview_paths, out)
print(f"\nDone! All sprite grids saved to {OUT_DIR}/")
