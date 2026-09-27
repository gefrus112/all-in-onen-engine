"""Basic smoke tests for the Lapia engine (no pygame required)."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lapia.core import Vector2, Vector3, Color, Math, Clock, EventBus, Config


def test_vector2_arithmetic():
    a = Vector2(3, 4)
    b = Vector2(1, 2)
    assert (a + b) == Vector2(4, 6)
    assert (a - b) == Vector2(2, 2)
    assert (a * 2) == Vector2(6, 8)
    assert a.magnitude == 5.0
    assert a.normalized == Vector2(0.6, 0.8)
    print("✓ Vector2 arithmetic")


def test_vector2_geometry():
    a = Vector2(0, 0)
    b = Vector2(3, 4)
    assert a.distance_to(b) == 5.0
    assert Vector2.from_angle(0) == Vector2(1, 0)
    rotated = Vector2(1, 0).rotate(1.5707963)  # 90 degrees
    assert abs(rotated.x - 0) < 0.001 and abs(rotated.y - 1) < 0.001
    print("✓ Vector2 geometry")


def test_color():
    c = Color(255, 128, 0)
    assert c.to_hex() == "#ff8000"
    assert Color.from_hex("#ff8000") == c
    lerped = Color.lerp(Color(0, 0, 0), Color(255, 255, 255), 0.5)
    assert lerped.r == 127 and lerped.g == 127 and lerped.b == 127
    print("✓ Color")


def test_math():
    assert Math.clamp(15, 0, 10) == 10
    assert Math.clamp(-5, 0, 10) == 0
    assert Math.clamp(5, 0, 10) == 5
    assert Math.lerp(0, 100, 0.25) == 25
    assert Math.sign(-5) == -1
    assert Math.sign(0) == 0
    assert Math.sign(5) == 1
    print("✓ Math utilities")


def test_clock():
    clock = Clock()
    dt = clock.tick()
    assert dt >= 0
    assert clock.elapsed >= 0
    print("✓ Clock")


def test_event_bus():
    bus = EventBus()
    results = []
    bus.on('test', lambda x: results.append(x))
    bus.emit('test', 42)
    assert results == [42]
    print("✓ EventBus")


def test_config():
    config = Config()
    assert config.width == 800
    assert config.height == 600
    config.title = "Test"
    d = config.to_dict()
    assert d['title'] == "Test"
    print("✓ Config")


if __name__ == "__main__":
    test_vector2_arithmetic()
    test_vector2_geometry()
    test_color()
    test_math()
    test_clock()
    test_event_bus()
    test_config()
    print("\n✓ All core tests passed!")
