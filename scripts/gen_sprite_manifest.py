"""Generate sprite manifest JSON for the Lapia Studio asset picker."""
import os
import json

SPRITES_DIR = "/home/z/my-project/public/sprites"
OUT = "/home/z/my-project/public/sprites/manifest.json"

CATEGORIES = {
    "player": {"label": "Player Characters", "icon": "user"},
    "characters": {"label": "NPCs & Animals", "icon": "users"},
    "enemies": {"label": "Enemies", "icon": "bug"},
    "structures": {"label": "Buildings", "icon": "home"},
    "nature": {"label": "Trees & Plants", "icon": "tree-pine"},
    "tiles": {"label": "Tiles", "icon": "grid"},
    "coins": {"label": "Coins & Gems", "icon": "circle-dollar-sign"},
    "powerups": {"label": "Power-ups", "icon": "heart"},
    "props": {"label": "Props & Furniture", "icon": "package"},
    "food": {"label": "Food", "icon": "utensils"},
    "projectiles": {"label": "Projectiles", "icon": "zap"},
    "weapons": {"label": "Weapons", "icon": "sword"},
    "vehicles": {"label": "Vehicles", "icon": "car"},
    "particles": {"label": "Particles", "icon": "sparkles"},
    "ui": {"label": "UI Icons", "icon": "layout"},
}

# Friendly display names
DISPLAY_NAMES = {
    "knight": "Knight (Blue)", "mage": "Mage (Purple)", "archer": "Archer (Green)",
    "rogue": "Rogue (Dark)", "wizard": "Wizard (Indigo)", "robot": "Robot (Gray)",
    "slime_green": "Green Slime", "slime_blue": "Blue Slime", "slime_red": "Red Slime",
    "slime_purple": "Purple Slime", "slime_gold": "Gold Slime",
    "bat_black": "Black Bat", "bat_purple": "Purple Bat",
    "ghost_white": "White Ghost", "ghost_pink": "Pink Ghost",
    "spider_black": "Black Spider",
    "grass": "Grass Block", "dirt": "Dirt Block", "stone": "Stone Block",
    "water": "Water Block", "lava": "Lava Block", "sand": "Sand Block",
    "snow": "Snow Block", "wood": "Wood Plank", "brick": "Brick Wall",
    "coin_gold": "Gold Coin", "coin_silver": "Silver Coin", "coin_copper": "Copper Coin",
    "gem_emerald": "Emerald", "gem_ruby": "Ruby", "gem_sapphire": "Sapphire",
    "gem_diamond": "Diamond", "star": "Star",
    "heart": "Heart", "potion_red": "Red Potion (HP)", "potion_blue": "Blue Potion (MP)",
    "potion_green": "Green Potion (Antidote)", "potion_purple": "Purple Potion (Buff)",
    "speed_boot": "Speed Boots", "shield": "Shield", "key": "Key",
    "fireball": "Fireball", "iceball": "Ice Ball", "lightning": "Lightning",
    "poison": "Poison Bolt", "arrow": "Arrow",
    "spark_orange": "Orange Spark", "spark_blue": "Blue Spark", "spark_green": "Green Spark",
    "spark_purple": "Purple Spark", "smoke_gray": "Gray Smoke", "magic_pink": "Magic Sparkle",
    "house_red": "Red House", "house_blue": "Blue House", "house_green": "Green House",
    "house_purple": "Purple House", "house_stone": "Stone House", "house_wood": "Wooden House",
    "castle": "Castle", "shop": "Shop", "tent": "Tent",
    "tree_oak": "Oak Tree", "tree_maple": "Maple Tree", "tree_pine": "Pine Tree",
    "tree_cherry": "Cherry Tree", "tree_palm": "Palm Tree", "tree_dead": "Dead Tree",
    "bush_green": "Green Bush", "bush_red": "Red Bush",
    "flower_red": "Red Flower", "flower_yellow": "Yellow Flower",
    "flower_purple": "Purple Flower", "flower_white": "White Flower",
    "mushroom_red": "Red Mushroom", "mushroom_brown": "Brown Mushroom",
    "rock": "Rock", "cactus": "Cactus", "log": "Log",
    "crystal_blue": "Blue Crystal", "crystal_purple": "Purple Crystal", "crystal_green": "Green Crystal",
    "chest": "Treasure Chest", "sign_wood": "Wooden Sign", "sign_arrow": "Arrow Sign",
    "lamp": "Street Lamp", "torch": "Torch", "candle": "Candle",
    "barrel": "Barrel", "crate": "Crate", "bookshelf": "Bookshelf",
    "table": "Table", "chair": "Chair", "bed": "Bed", "portal": "Magic Portal",
    "car_red": "Red Car", "car_blue": "Blue Car", "car_green": "Green Car", "car_yellow": "Yellow Car",
    "boat": "Boat", "plane": "Airplane", "train": "Train",
    "apple": "Apple", "banana": "Banana", "bread": "Bread", "cheese": "Cheese",
    "meat": "Meat", "fish": "Fish", "pizza": "Pizza Slice", "burger": "Burger", "cake": "Cake",
    "npc_villager": "Villager NPC", "npc_merchant": "Merchant NPC", "npc_guard": "Guard NPC",
    "npc_child": "Child NPC", "npc_elder": "Elder NPC", "npc_wizard": "Wizard NPC",
    "cat_orange": "Orange Cat", "cat_black": "Black Cat", "cat_white": "White Cat",
    "dog_brown": "Brown Dog", "dog_gray": "Gray Dog", "chicken": "Chicken",
    "sword_iron": "Iron Sword", "sword_steel": "Steel Sword", "sword_gold": "Gold Sword",
    "sword_fire": "Fire Sword", "bow": "Bow & Arrow", "axe": "Battle Axe",
    "staff": "Magic Staff", "wand": "Magic Wand",
}

manifest = {
    "version": "2.0.0",
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
        size = [32, 32] if cat_slug in ("player", "enemies", "tiles", "structures", "nature", "props", "vehicles", "characters", "weapons") else [16, 16] if cat_slug in ("coins", "powerups", "ui", "food") else [8, 8]
        items.append({
            "slug": slug,
            "name": DISPLAY_NAMES.get(slug, slug.replace("_", " ").title()),
            "path": f"/sprites/{cat_slug}/{fname}",
            "size": size,
        })
    manifest["categories"][cat_slug] = {
        "label": cat_info["label"],
        "icon": cat_info["icon"],
        "items": items,
    }

with open(OUT, "w") as f:
    json.dump(manifest, f, indent=2)

total = sum(len(c['items']) for c in manifest['categories'].values())
print(f"Generated manifest v2 with {total} sprites across {len(manifest['categories'])} categories")
print(f"Saved to: {OUT}")
