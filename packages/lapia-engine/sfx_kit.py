"""
lapia-engine :: sfx_kit
Synthesized sound effects — zero audio files.

Desktop: renders waveforms into pygame.mixer Sound objects.
Browser studio: the engine's Web Audio layer plays equivalent blips
(same API, same names).
"""
import math
import struct

try:
    import pygame
    _HAVE_PYGAME = True
except Exception:  # pragma: no cover - browser sandbox
    _HAVE_PYGAME = False

SAMPLE_RATE = 22050


def _render(freq_start, freq_end, duration, volume=0.5, shape="square", decay=True):
    n = int(SAMPLE_RATE * duration)
    frames = []
    phase = 0.0
    for i in range(n):
        t = i / n
        f = freq_start + (freq_end - freq_start) * t
        phase += 2 * math.pi * f / SAMPLE_RATE
        if shape == "square":
            s = 1.0 if math.sin(phase) >= 0 else -1.0
        elif shape == "saw":
            s = 2.0 * ((phase / (2 * math.pi)) % 1.0) - 1.0
        elif shape == "noise":
            import random
            s = random.uniform(-1, 1)
        else:
            s = math.sin(phase)
        env = (1.0 - t) if decay else 1.0
        frames.append(int(32767 * volume * env * s))
    return struct.pack(f"<{n}h", *frames)


class SfxKit:
    """sfx = SfxKit(); sfx.jump(); sfx.coin()"""

    def __init__(self):
        if _HAVE_PYGAME:
            if not pygame.mixer.get_init():
                pygame.mixer.init(SAMPLE_RATE, -16, 1)
        self._cache = {}

    def _play(self, key, **kw):
        if not _HAVE_PYGAME:
            return
        if key not in self._cache:
            self._cache[key] = pygame.mixer.Sound(buffer=_render(**kw))
        self._cache[key].play()

    def jump(self):
        self._play("jump", freq_start=180, freq_end=560, duration=0.18, volume=0.4)

    def coin(self):
        self._play("coin", freq_start=880, freq_end=1320, duration=0.11, volume=0.35, shape="sine")

    def explode(self):
        self._play("explode", freq_start=220, freq_end=40, duration=0.4, volume=0.5, shape="noise")

    def laser(self):
        self._play("laser", freq_start=1400, freq_end=320, duration=0.12, volume=0.3, shape="saw")

    def hurt(self):
        self._play("hurt", freq_start=300, freq_end=90, duration=0.25, volume=0.45)

    def win(self):
        self._play("win", freq_start=520, freq_end=1040, duration=0.5, volume=0.4, shape="sine")
