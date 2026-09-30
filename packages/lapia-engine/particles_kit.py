"""
lapia-engine :: particles_kit
Juicy particle systems: bursts, trails, confetti, explosions, weather.
Renderer-agnostic: pass the engine renderer each frame.
"""
import math
import random


class Particle:
    __slots__ = ("x", "y", "vx", "vy", "life", "max_life", "size", "color", "gravity", "drag")

    def __init__(self, x, y, vx, vy, life, size, color, gravity=0.0, drag=1.0):
        self.x, self.y = x, y
        self.vx, self.vy = vx, vy
        self.life = life
        self.max_life = life
        self.size = size
        self.color = color  # (r, g, b)
        self.gravity = gravity
        self.drag = drag

    def update(self, dt):
        self.vy += self.gravity * dt
        self.vx *= self.drag
        self.vy *= self.drag
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.life -= dt
        return self.life > 0


class ParticleSystem:
    def __init__(self, max_particles=600):
        self.particles = []
        self.max = max_particles

    def _add(self, p):
        if len(self.particles) < self.max:
            self.particles.append(p)

    def burst(self, x, y, count=14, speed=140, life=0.5, size=4, color=(255, 170, 80), gravity=260):
        for _ in range(count):
            a = random.uniform(0, math.tau)
            s = random.uniform(speed * 0.3, speed)
            self._add(Particle(x, y, math.cos(a) * s, math.sin(a) * s,
                               random.uniform(life * 0.5, life), size, color, gravity))

    def trail(self, x, y, color=(120, 200, 255), size=3, life=0.35, speed=25):
        self._add(Particle(x, y, random.uniform(-speed, speed), random.uniform(-speed, speed),
                           life, size, color))

    def confetti(self, x, y, count=40):
        colors = [(240, 80, 100), (250, 200, 90), (110, 220, 130), (100, 170, 250), (200, 120, 250)]
        for _ in range(count):
            self._add(Particle(x, y, random.uniform(-160, 160), random.uniform(-320, -120),
                               random.uniform(0.8, 1.6), 3, random.choice(colors), gravity=420))

    def rain(self, w, count=6, speed=520):
        for _ in range(count):
            self._add(Particle(random.uniform(0, w), -8, 0, speed,
                               2.0, 2, (120, 160, 220)))

    def update(self, dt):
        self.particles = [p for p in self.particles if p.update(dt)]

    def render(self, renderer, camera=None):
        for p in self.particles:
            t = max(0.0, p.life / p.max_life)
            col = (p.color[0], p.color[1], p.color[2], int(255 * t))
            try:
                renderer.fill_circle((p.x, p.y), p.size * (0.5 + t * 0.5), col)
            except Exception:
                renderer.fill_circle((p.x, p.y), p.size, p.color)
