"""Audio: mixer, sound effects, music streaming, audio effects."""

from __future__ import annotations

import math
import random
from typing import Optional, Callable
from dataclasses import dataclass

try:
    import pygame
    HAS_PYGAME = True
except ImportError:
    HAS_PYGAME = False
    pygame = None

from .core import Vector2


class AudioMixer:
    """Central audio mixer that manages sounds and music."""
    def __init__(self, channels: int = 32, sample_rate: int = 44100):
        self.channels = channels
        self.sample_rate = sample_rate
        self.initialized = False
        self.sounds: dict[str, "Sound"] = {}
        self.music: Optional["Music"] = None
        self.master_volume = 1.0
        self.sfx_volume = 1.0
        self.music_volume = 1.0
        self.muted = False
        self._listener_position: Optional[Vector2] = None
        self.positional_audio = False
        self.positional_range = 600.0

    def init(self):
        if not HAS_PYGAME or self.initialized: return
        try:
            pygame.mixer.pre_init(self.sample_rate, -16, 2, 512)
            pygame.mixer.init()
            pygame.mixer.set_num_channels(self.channels)
            self.initialized = True
        except Exception as e:
            print(f"[Audio] Failed to init mixer: {e}")

    def load_sound(self, name: str, path: str) -> "Sound":
        snd = Sound(name, path)
        self.sounds[name] = snd
        return snd

    def add_sound(self, name: str, sound: "Sound"):
        self.sounds[name] = sound

    def play(self, name: str, volume: float = 1.0, pitch: float = 1.0, loop: bool = False, position: Optional[Vector2] = None) -> Optional[int]:
        if self.muted: return None
        snd = self.sounds.get(name)
        if snd is None: return None
        vol = volume * self.sfx_volume * self.master_volume
        if self.positional_audio and self._listener_position is not None and position is not None:
            dist = position.distance_to(self._listener_position)
            falloff = max(0.0, 1.0 - dist / self.positional_range)
            vol *= falloff
        return snd.play(volume=vol, pitch=pitch, loop=loop)

    def stop_channel(self, channel: int):
        if not self.initialized: return
        try:
            pygame.mixer.Channel(channel).stop()
        except Exception:
            pass

    def stop_all_sounds(self):
        if not self.initialized: return
        pygame.mixer.stop()

    def pause_all_sounds(self):
        if not self.initialized: return
        pygame.mixer.pause()

    def resume_all_sounds(self):
        if not self.initialized: return
        pygame.mixer.unpause()

    def play_music(self, path: str, loops: int = -1, volume: Optional[float] = None):
        if not self.initialized: return
        if self.music is None:
            self.music = Music()
        self.music.load(path)
        vol = volume if volume is not None else self.music_volume * self.master_volume
        self.music.play(loops=loops, volume=vol)

    def stop_music(self, fade_ms: int = 0):
        if self.music: self.music.stop(fade_ms)

    def pause_music(self):
        if self.music: self.music.pause()

    def resume_music(self):
        if self.music: self.music.resume()

    def set_master_volume(self, v: float):
        self.master_volume = max(0.0, min(1.0, v))
        if self.initialized:
            pygame.mixer.music.set_volume(self.music_volume * self.master_volume)

    def set_sfx_volume(self, v: float):
        self.sfx_volume = max(0.0, min(1.0, v))

    def set_music_volume(self, v: float):
        self.music_volume = max(0.0, min(1.0, v))
        if self.initialized:
            pygame.mixer.music.set_volume(self.music_volume * self.master_volume)

    def set_listener(self, position: Vector2):
        self._listener_position = position

    def mute(self): self.muted = True
    def unmute(self): self.muted = False

    def shutdown(self):
        if not self.initialized: return
        pygame.mixer.quit()
        self.initialized = False


class Sound:
    """A sound effect that can be played multiple times."""
    def __init__(self, name: str, path: str):
        self.name = name
        self.path = path
        self._sound = None
        self._loaded = False
        self.default_volume = 1.0
        self.pitch_range = 0.0  # 0 = no pitch variation; 0.1 = ±10%

    def load(self):
        if self._loaded or not HAS_PYGAME: return
        try:
            self._sound = pygame.mixer.Sound(self.path)
            self._loaded = True
        except Exception as e:
            print(f"[Sound] Failed to load {self.path}: {e}")

    def play(self, volume: float = 1.0, pitch: float = 1.0, loop: bool = False) -> Optional[int]:
        if not self._loaded: self.load()
        if self._sound is None: return None
        try:
            self._sound.set_volume(max(0.0, min(1.0, volume)))
            # Pitch variation via random sample playback rate isn't directly supported in pygame
            # but we can simulate it with the secondary sound array manipulation if needed.
            channel = self._sound.play(loops=-1 if loop else 0)
            if channel is None: return None
            return channel.get_id()
        except Exception as e:
            print(f"[Sound] Play error: {e}")
            return None

    def stop(self):
        if self._sound: self._sound.stop()

    def set_volume(self, v: float):
        self.default_volume = max(0.0, min(1.0, v))
        if self._sound: self._sound.set_volume(self.default_volume)

    def generate_beep(self, frequency: int = 440, duration: float = 0.1, sample_rate: int = 44100):
        """Generate a simple beep sound programmatically (no file needed)."""
        if not HAS_PYGAME: return
        try:
            import numpy as np
            n_samples = int(sample_rate * duration)
            buf = np.zeros((n_samples, 2), dtype=np.int16)
            for i in range(n_samples):
                t = float(i) / sample_rate
                val = int(32767 * 0.3 * math.sin(2 * math.pi * frequency * t))
                buf[i] = [val, val]
            self._sound = pygame.sndarray.make_sound(buf)
            self._loaded = True
        except ImportError:
            # numpy not available, use simpler approach
            return

    def generate_noise(self, duration: float = 0.2, sample_rate: int = 44100):
        """Generate white noise (useful for explosions)."""
        if not HAS_PYGAME: return
        try:
            import numpy as np
            n_samples = int(sample_rate * duration)
            buf = np.zeros((n_samples, 2), dtype=np.int16)
            for i in range(n_samples):
                t = float(i) / sample_rate
                val = int(32767 * 0.3 * random.uniform(-1, 1) * math.exp(-t * 5))
                buf[i] = [val, val]
            self._sound = pygame.sndarray.make_sound(buf)
            self._loaded = True
        except ImportError:
            return


class Music:
    """Background music streamer (only one music track at a time)."""
    def __init__(self):
        self.path: Optional[str] = None
        self.playing = False
        self.paused = False
        self.volume = 1.0

    def load(self, path: str):
        self.path = path
        if HAS_PYGAME:
            try:
                pygame.mixer.music.load(path)
            except Exception as e:
                print(f"[Music] Failed to load {path}: {e}")

    def play(self, loops: int = -1, volume: float = 1.0, fade_ms: int = 0):
        if not HAS_PYGAME or not self.path: return
        self.volume = volume
        pygame.mixer.music.set_volume(volume)
        try:
            pygame.mixer.music.play(loops=loops, fade_ms=fade_ms)
            self.playing = True
            self.paused = False
        except Exception as e:
            print(f"[Music] Play error: {e}")

    def stop(self, fade_ms: int = 0):
        if not HAS_PYGAME: return
        if fade_ms > 0:
            pygame.mixer.music.fadeout(fade_ms)
        else:
            pygame.mixer.music.stop()
        self.playing = False

    def pause(self):
        if not HAS_PYGAME or not self.playing: return
        pygame.mixer.music.pause()
        self.paused = True

    def resume(self):
        if not HAS_PYGAME or not self.paused: return
        pygame.mixer.music.unpause()
        self.paused = False

    def set_volume(self, v: float):
        self.volume = max(0.0, min(1.0, v))
        if HAS_PYGAME:
            pygame.mixer.music.set_volume(self.volume)

    def is_playing(self) -> bool:
        if not HAS_PYGAME: return False
        return pygame.mixer.music.get_busy()


@dataclass
class AudioEffect:
    """Base class for audio effects."""
    enabled: bool = True
    def process(self, samples: list) -> list:
        return samples


class ReverbEffect(AudioEffect):
    """Simple reverb effect using delay lines."""
    def __init__(self, decay: float = 0.5, delay_ms: int = 80):
        super().__init__()
        self.decay = decay
        self.delay_ms = delay_ms

    def process(self, samples: list) -> list:
        if not self.enabled: return samples
        delay = max(1, int(self.delay_ms * 44.1))
        output = samples.copy()
        for i in range(delay, len(samples)):
            output[i] = output[i] + output[i - delay] * self.decay * 0.5
        return output


class LowPassEffect(AudioEffect):
    """Simple low-pass filter."""
    def __init__(self, cutoff: float = 0.3):
        super().__init__()
        self.cutoff = cutoff

    def process(self, samples: list) -> list:
        if not self.enabled: return samples
        output = samples.copy()
        prev = 0.0
        for i, s in enumerate(output):
            prev = prev + self.cutoff * (s - prev)
            output[i] = prev
        return output


__all__ = ["AudioMixer", "Sound", "Music", "AudioEffect", "ReverbEffect", "LowPassEffect"]
