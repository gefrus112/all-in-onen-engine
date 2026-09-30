"""
lapia-engine :: ally_engine
Bootstrap that wires the Ally-5 assistant into desktop Lapia projects.

Usage (desktop):
    from ally_engine import Ally
    ally = Ally()
    ally.build("make me a snake game called Voltage")   # writes main.py

In the browser studio, Ally-5 is already built in — open the Ally panel
or type `ally make me a game` in the Terminal.
"""
import json
import os

KERNEL_VERSION = "5.0.3"


class Ally:
    """Local game-generation entry point.

    The kernel loads the game-template corpus (training-corpus.json), classifies
    the request, extracts parameters (title/colors/difficulty) and assembles a
    runnable main.py from the trained game kernels.
    """

    def __init__(self, knowledge_dir=None, model="ally-5-game"):
        base = knowledge_dir or os.path.join(os.path.dirname(__file__), "..", "ally5-knowledge")
        self.model = model
        self.corpus = {}
        card = os.path.join(base, "training-corpus.json")
        try:
            with open(card, "r", encoding="utf-8") as f:
                self.corpus = json.load(f)
        except Exception:
            # Browser studio / minimal installs: kernels are compiled in.
            self.corpus = {"intents": [], "game_kernels": {}}
        self.last_build = None

    def classify(self, prompt: str) -> str:
        p = prompt.lower()
        if any(k in p for k in ("make", "build", "create", "generate", "write")):
            return "generate"
        if any(k in p for k in ("harder", "easier", "faster", "slower", "add", "coins")):
            return "feature"
        if any(k in p for k in ("explain", "how does", "what is", "teach")):
            return "explain"
        if any(k in p for k in ("fix", "error", "bug", "broken")):
            return "debug"
        return "generate"

    def detect_game(self, prompt: str):
        p = prompt.lower()
        table = {
            "snake": ("snake", "worm"),
            "pong": ("pong", "paddle", "tennis"),
            "shooter": ("shooter", "space", "alien", "invader", "ship"),
            "flappy": ("flappy", "bird", "flap", "pipes"),
            "breakout": ("breakout", "brick", "arkanoid"),
            "collect": ("coin", "collect", "loot", "treasure", "rpg", "maze"),
        }
        for game, words in table.items():
            if any(w in p for w in words):
                return game
        return None

    def build(self, prompt: str, out_path: str = "main.py") -> str:
        """Generate a game for `prompt` and write it to out_path."""
        game = self.detect_game(prompt) or "collect"
        title = "My Game"
        import re
        m = re.search(r"(?:called|named)\s+[\"']?([\w !?'&-]{2,40})[\"']?", prompt, re.I)
        if m:
            title = m.group(1).strip().title()
        speed = 1.35 if "harder" in prompt.lower() or "faster" in prompt.lower() else 1.0

        from ally_game_kernels import generate_game  # ships with ally-kernel
        code = generate_game(game, title=title, model=f"Ally-5 Game ({KERNEL_VERSION})", speed=speed)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(code)
        self.last_build = {"game": game, "title": title, "path": out_path}
        return out_path

    def explain(self, topic: str) -> str:
        docs = {
            "game": 'game = Game(title="...", size=(800, 600), fps=60); game.run(MyScene())',
            "scene": "Subclass Scene; implement on_load(), on_update(self, dt), on_render(self, r).",
            "sprite": 'Sprite(color=Color(80,180,240), size=(32,32)); sprite.position = Vector2(x, y)',
            "load_image": 'Sprite(image=load_image("sprites/coins/coin_gold.png")) — paths come from the Toolbox.',
        }
        return docs.get(topic.lower(), "Try: game, scene, sprite, load_image")


if __name__ == "__main__":
    a = Ally()
    print("Ally-5 kernel", KERNEL_VERSION, "— try: a.build('make me a snake game called Demo')")
