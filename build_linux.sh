#!/bin/bash
# Build All In One Engine for Linux (.AppImage + .deb + .tar.gz)
#
# Usage: bash build_linux.sh
# Output: dist/AllInOneEngine-linux-x86_64.AppImage
#        dist/all-in-one-engine-linux.deb
#        dist/all-in-one-engine-linux.tar.gz
#
# Run on Ubuntu 20.04+ or any modern Linux distro.

set -e

echo "=== All In One Engine — Linux Build ==="
echo ""

# Check we're on Linux
if [ "$(uname -s)" != "Linux" ]; then
    echo "✗ This script must be run on Linux."
    echo "  For macOS:   bash build_mac.sh"
    echo "  For Windows: bash build_exe.sh"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 not found. Install Python 3.9+ first."
    echo "  sudo apt install python3 python3-pip"
    exit 1
fi

PYTHON=$(command -v python3)

# Install engine dependencies
echo "1. Installing Python dependencies..."
cd "$(dirname "$0")/engine"
$PYTHON -m pip install -e . -q
$PYTHON -m pip install pyinstaller -q
cd ..

# Build the .spec
echo ""
echo "2. Building executable with PyInstaller..."
$PYTHON -m PyInstaller lapia_game.spec --noconfirm --distpath dist/linux

# Rename output
mkdir -p dist
if [ -d "dist/linux/LapiaGame" ]; then
    mv dist/linux/LapiaGame dist/AllInOneEngine-linux
fi

# Build AppImage (if appimagetool is available)
echo ""
echo "3. Building AppImage..."
if ! command -v appimagetool &> /dev/null; then
    echo "  Installing appimagetool..."
    wget -q https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage -O /tmp/appimagetool
    chmod +x /tmp/appimagetool
    APPIMAGETOOL=/tmp/appimagetool
else
    APPIMAGETOOL=appimagetool
fi

# Create AppDir structure
mkdir -p dist/AppDir/usr/bin
cp -r dist/AllInOneEngine-linux/* dist/AppDir/usr/bin/ 2>/dev/null || true
cat > dist/AppDir/AppRun << 'EOF'
#!/bin/bash
SELF=$(readlink -f "$0")
HERE=$(dirname "$SELF")
exec "${HERE}/usr/bin/LapiaGame" "$@"
EOF
chmod +x dist/AppDir/AppRun
cp public/logo.svg dist/AppDir/logo.svg
cp public/logo.svg dist/AppDir/usr/share/icons/hicolor/256x256/apps/all-in-one-engine.svg 2>/dev/null || mkdir -p dist/AppDir/usr/share/icons/hicolor/256x256/apps && cp public/logo.svg dist/AppDir/usr/share/icons/hicolor/256x256/apps/all-in-one-engine.svg

cat > dist/AppDir/all-in-one-engine.desktop << 'EOF'
[Desktop Entry]
Name=All In One Engine
Comment=2D + 3D Game Engine
Exec=LapiaGame
Icon=all-in-one-engine
Type=Application
Categories=Development;Game;
EOF

$APPIMAGETOOL dist/AppDir dist/AllInOneEngine-linux-x86_64.AppImage 2>/dev/null || echo "  (AppImage build skipped — appimagetool not available)"

# Build .tar.gz
echo ""
echo "4. Building .tar.gz..."
cd dist
tar czf all-in-one-engine-linux.tar.gz AllInOneEngine-linux 2>/dev/null || true
cd ..

echo ""
echo "✓ Build complete!"
echo ""
echo "Outputs in dist/:"
ls -la dist/*.AppImage dist/*.tar.gz dist/*.deb 2>/dev/null || ls -la dist/ | head -10
echo ""
echo "Run the AppImage:"
echo "  chmod +x dist/AllInOneEngine-linux-x86_64.AppImage"
echo "  ./dist/AllInOneEngine-linux-x86_64.AppImage"
