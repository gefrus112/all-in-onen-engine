"""Generate sprite manifest JSON for the Lapia Studio asset picker."""
import os
import json
import hashlib

SPRITES_DIR = "/home/z/my-project/public/sprites"
OUT = "/home/z/my-project/public/sprites/manifest.json"

CATEGORIES = {
    "player": {"label": "Player Characters", "icon": "user"},
    "enemies": {"label": "Enemies", "icon": "bug"},
    "tiles": {"label": "Tiles", "icon": "grid"},
    "coins": {"label": "Coins & Gems", "icon": "circle-dollar-sign"},
    "powerups": {"label": "Power-ups", "icon": "heart"},
    "projectiles": {"label": "Projectiles", "icon": "zap"},
    "particles": {"label": "Particles", "icon": "sparkles"},
    "ui": {"label": "UI Icons", "icon": "layout"},
}

# Friendly display names
DISPLAY_NAMES = {
    "knight": "Knight (Blue)",
    "mage": "Mage (Purple)",
    "archer": "Archer (Green)",
    "rogue": "Rogue (Dark)",
    "wizard": "Wizard (Indigo)",
    "robot": "Robot (Gray)",
    "slime_green": "Green Slime",
    "slime_blue": "Blue Slime",
    "slime_red": "Red Slime",
    "slime_purple": "Purple Slime",
    "slime_gold": "Gold Slime",
    "bat_black": "Black Bat",
    "bat_purple": "Purple Bat",
    "ghost_white": "White Ghost",
    "ghost_pink": "Pink Ghost",
    "spider_black": "Black Spider",
    "grass": "Grass Block",
    "dirt": "Dirt Block",
    "stone": "Stone Block",
    "water": "Water Block",
    "lava": "Lava Block",
    "sand": "Sand Block",
    "snow": "Snow Block",
    "wood": "Wood Plank",
    "brick": "Brick Wall",
    "coin_gold": "Gold Coin",
    "coin_silver": "Silver Coin",
    "coin_copper": "Copper Coin",
    "gem_emerald": "Emerald",
    "gem_ruby": "Ruby",
    "gem_sapphire": "Sapphire",
    "gem_diamond": "Diamond",
    "star": "Star",
    "heart": "Heart",
    "potion_red": "Red Potion (HP)",
    "potion_blue": "Blue Potion (MP)",
    "potion_green": "Green Potion (Antidote)",
    "potion_purple": "Purple Potion (Buff)",
    "speed_boot": "Speed Boots",
    "shield": "Shield",
    "key": "Key",
    "fireball": "Fireball",
    "iceball": "Ice Ball",
    "lightning": "Lightning",
    "poison": "Poison Bolt",
    "arrow": "Arrow",
    "spark_orange": "Orange Spark",
    "spark_blue": "Blue Spark",
    "spark_green": "Green Spark",
    "spark_purple": "Purple Spark",
    "smoke_gray": "Gray Smoke",
    "magic_pink": "Magic Sparkle",
}

manifest = {
    "version": "1.0.0",
    "categories": {},
}

for cat_slug, cat_info in CATEGORIES.items():
    cat_dir = os.path.join(SPRITES_DIR, cat_slug)
    if not os.path.isdir(cat_dir):
        continue
    items = []
    for fname in sorted(os.listdir(cat_dir)):
        if not fname.endswith(".png"):
            continue
        slug = fname[:-4]
        items.append({
            "slug": slug,
            "name": DISPLAY_NAMES.get(slug, slug.replace("_", " ").title()),
            "path": f"/sprites/{cat_slug}/{fname}",
            "size": [32, 32] if cat_slug in ("player", "enemies", "tiles") else [16, 16] if cat_slug in ("coins", "powerups", "ui") else [8, 8],
        })
    manifest["categories"][cat_slug] = {
        "label": cat_info["label"],
        "icon": cat_info["icon"],
        "items": items,
    }

with open(OUT, "w") as f:
    json.dump(manifest, f, indent=2)

print(f"Generated manifest with {sum(len(c['items']) for c in manifest['categories'].values())} sprites across {len(manifest['categories'])} categories")
print(f"Saved to: {OUT}")
