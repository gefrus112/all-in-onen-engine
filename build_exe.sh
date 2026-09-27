#!/bin/bash
# Lapia Studio — Build Windows .exe
#
# This script wraps PyInstaller to produce a standalone Windows executable
# of your game. Run it on Windows (or via Wine on Linux/macOS).
#
# Usage:
#   bash build_exe.sh [game_file.py]
#
# Output:
#   dist/LapiaGame/LapiaGame.exe

set -e

GAME_FILE="${1:-engine/examples/platformer.py}"
SPEC_FILE="lapia_game.spec"

echo "=== Lapia Studio — Build .exe ==="
echo ""
echo "Game file: $GAME_FILE"
echo ""

# Check Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "✗ Python not found. Install Python 3.9+ first."
    exit 1
fi

PYTHON=$(command -v python3 || command -v python)

# Check PyInstaller
if ! $PYTHON -c "import PyInstaller" &> /dev/null; then
    echo "Installing PyInstaller..."
    $PYTHON -m pip install pyinstaller
fi

# Install engine in development mode
echo "Installing Lapia engine..."
cd "$(dirname "$0")/engine" && pip install -e . && cd ..

# Build
echo ""
echo "Building executable..."
$PYTHON -m PyInstaller "$SPEC_FILE" --noconfirm

echo ""
echo "✓ Build complete!"
echo ""
echo "Find your executable at:"
echo "  Windows: dist\\LapiaGame\\LapiaGame.exe"
echo "  Linux:   dist/LapiaGame/LapiaGame"
echo ""
echo "Distribute the entire dist/LapiaGame/ folder to your users."
