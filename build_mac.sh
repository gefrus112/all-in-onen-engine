#!/bin/bash
# Build All In One Engine for macOS (.dmg + .app)
#
# Usage: bash build_mac.sh
# Output: dist/AllInOneEngine.dmg
#         dist/AllInOneEngine.app
#
# Run on macOS 11+ (Intel or Apple Silicon).

set -e

echo "=== All In One Engine — macOS Build ==="
echo ""

# Check we're on macOS
if [ "$(uname -s)" != "Darwin" ]; then
    echo "✗ This script must be run on macOS."
    echo "  For Linux:     bash build_linux.sh"
    echo "  For Windows:   bash build_exe.sh"
    echo "  For Chromebook: bash build_chromebook.sh"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 not found. Install with Homebrew:"
    echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    echo "  brew install python@3.12"
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
echo "2. Building .app with PyInstaller..."
$PYTHON -m PyInstaller lapia_game.spec --noconfirm --distpath dist/mac --windowed

# Package as .dmg
echo ""
echo "3. Building .dmg..."
mkdir -p dist/dmg
cp -r dist/mac/LapiaGame.app dist/dmg/ 2>/dev/null || cp -r dist/mac/LapiaGame dist/dmg/LapiaGame.app 2>/dev/null || true
ln -s /Applications dist/dmg/Applications 2>/dev/null || true

# Use hdiutil to create the .dmg
hdiutil create -volname "All In One Engine" -srcfolder dist/dmg -ov -format UDZO dist/AllInOneEngine.dmg 2>/dev/null || {
    echo "  (hdiutil not available — .app is in dist/mac/)"
    echo "  Manually create .dmg with Disk Utility if needed."
}

echo ""
echo "✓ Build complete!"
echo ""
echo "Outputs in dist/:"
ls -la dist/*.dmg dist/mac/*.app 2>/dev/null || ls -la dist/mac/ | head -10
echo ""
echo "Install:"
echo "  open dist/AllInOneEngine.dmg"
echo "  # Drag AllInOneEngine.app to Applications"
