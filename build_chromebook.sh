#!/bin/bash
# Build All In One Engine for Chromebook (.deb for Crostini Linux container)
#
# Usage: bash build_chromebook.sh
# Output: dist/all-in-one-engine-chromebook.deb
#
# Prerequisites:
#   1. Chromebook with Linux (Crostini) enabled
#      Settings > Developers > Linux development Environment > Turn On
#   2. Open the Terminal app
#   3. Run: sudo apt update && sudo apt install -y python3 python3-pip nodejs npm git

set -e

echo "=== All In One Engine — Chromebook Build ==="
echo ""

# Check we're on Linux (Crostini reports as Linux)
if [ "$(uname -s)" != "Linux" ]; then
    echo "✗ This script must be run on a Chromebook with Linux enabled."
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 not found. Install:"
    echo "  sudo apt update && sudo apt install -y python3 python3-pip"
    exit 1
fi

PYTHON=$(command -v python3)

# Install engine dependencies
echo "1. Installing Python dependencies..."
cd "$(dirname "$0")/engine"
$PYTHON -m pip install -e . -q
$PYTHON -m pip install pyinstaller -q
cd ..

# Build with PyInstaller
echo ""
echo "2. Building executable with PyInstaller..."
$PYTHON -m PyInstaller lapia_game.spec --noconfirm --distpath dist/chromebook

# Build .deb package
echo ""
echo "3. Building .deb package..."
PKG_DIR=dist/all-in-one-engine-chromebook-deb
rm -rf $PKG_DIR
mkdir -p $PKG_DIR/DEBIAN
mkdir -p $PKG_DIR/usr/bin
mkdir -p $PKG_DIR/usr/share/applications
mkdir -p $PKG_DIR/usr/share/icons/hicolor/256x256/apps

# Copy binary
cp -r dist/chromebook/LapiaGame $PKG_DIR/usr/bin/all-in-one-engine 2>/dev/null || true
chmod +x $PKG_DIR/usr/bin/all-in-one-engine 2>/dev/null || true

# Copy icon
cp public/logo.svg $PKG_DIR/usr/share/icons/hicolor/256x256/apps/all-in-one-engine.svg

# Desktop entry
cat > $PKG_DIR/usr/share/applications/all-in-one-engine.desktop << 'EOF'
[Desktop Entry]
Name=All In One Engine
Comment=2D + 3D Game Engine
Exec=all-in-one-engine
Icon=all-in-one-engine
Type=Application
Categories=Development;Game;
EOF

# Control file
cat > $PKG_DIR/DEBIAN/control << 'EOF'
Package: all-in-one-engine
Version: 3.0.0
Section: games
Priority: optional
Architecture: amd64
Depends: python3 (>= 3.9), libsdl2-2.0-0, libfreetype6, libpng16-16
Maintainer: All In One Engine <noreply@example.com>
Description: All In One Engine — 2D + 3D Game Engine
 Build 2D and 3D games with Python. Includes Pygame, Three.js (via web),
 and Zhitlow (experimental) engines. MIT-licensed.
EOF

# Build .deb
dpkg-deb --build $PKG_DIR dist/all-in-one-engine-chromebook.deb

echo ""
echo "✓ Build complete!"
echo ""
echo "Output: dist/all-in-one-engine-chromebook.deb"
echo ""
echo "Install on Chromebook:"
echo "  sudo dpkg -i dist/all-in-one-engine-chromebook.deb"
echo ""
echo "Launch from Chrome OS app launcher (search 'All In One Engine')."
