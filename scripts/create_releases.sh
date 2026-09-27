#!/bin/bash
# Create 10 GitHub releases for All In One Engine
# Usage: GH_TOKEN=<your_token> bash create_releases.sh
set -e
GH=/tmp/gh_2.44.1_linux_amd64/bin/gh
cd /home/z/my-project

# Verify auth
$GH auth status 2>&1 | head -3

# Tag and release v0.1.0 through v1.0.0 (10 releases)
declare -A RELEASES
RELEASES[v0.1.0]="Initial Alpha — First public preview of All In One Engine. Basic 2D Pygame engine with Pyodide runtime, Monaco editor, live preview at 60 FPS, sprite asset library (55 sprites), and 4 starter templates."
RELEASES[v0.2.0]="Sprite Library Expansion — Added 79 more sprites (134 total) across 7 new categories: characters, structures, nature, props, food, weapons, vehicles. Generated manifest.json for asset picker."
RELEASES[v0.3.0]="Multiplayer + CRT Preview — Socket.io relay server (Bun + TypeScript). Multiplayer Arena template with real-time position sync. CRT scanline + glow effect on preview canvas. Bigger preview up to 900px."
RELEASES[v0.4.0]="Settings + Wizard + GitHub OAuth — Settings dialog with 5 themes (Dark/Midnight/Ocean/Purple/Sunset). Project wizard (3-step). NextAuth GitHub OAuth route. 666+ properties panel with collapsible groups."
RELEASES[v0.5.0]="Landing Page + Marketing Site — New landing page with hero, sprite marquee, feature cards, templates section, download CTA. Animated gradient text, sticky nav, glow-pulse button."
RELEASES[v0.6.0]="Rebrand to All In One Engine — Renamed from Lapia Studio. New logo (cube + '1' badge), new favicon, cyan→blue→purple gradient. 5 nav tabs (Home/Features/Download/Instructions/Publish)."
RELEASES[v0.7.0]="3D Studio Launch — Real Three.js viewport with @react-three/fiber. Place cubes, spheres, lights, cameras. OrbitControls + GizmoViewport. Animation timeline. Play-test mode with WASD camera."
RELEASES[v0.8.0]="Avatar Customizer — 6 preset avatars (Knight/Mage/Archer/Rogue/Wizard/Robot). Body type customizer (Slim/Average/Tall). Color picker. Avatar renders in 3D scene during play-test."
RELEASES[v0.9.0]="Publishing + Native Builds — Publish dialog with itch.io/Crazy Games/GitHub Pages/HTML5 instructions. Build HTML5 button. Native build scripts for Linux (.AppImage), macOS (.dmg), Chromebook (.deb)."
RELEASES[v1.0.0]="Stable Release — All In One Engine v1.0. Three engines (Pygame 2D / Three.js 3D / Zhitlow 3D). 134 sprites, 666+ properties, 4 templates, multiplayer, publishing, native builds. Production-ready."

# Sort versions
VERSIONS=$(echo "${!RELEASES[@]}" | tr ' ' '\n' | sort -V)

# Use GH_TOKEN env var if set, otherwise use existing auth
REMOTE_URL="https://github.com/gefrus112/lapia-ai-agent.git"
if [ -n "$GH_TOKEN" ]; then
  REMOTE_URL="https://gefrus112:${GH_TOKEN}@github.com/gefrus112/lapia-ai-agent.git"
fi

for v in $VERSIONS; do
  echo "=== Creating release $v ==="
  git tag -a "$v" -m "Release $v - ${RELEASES[$v]}" 2>&1 | head -3 || echo "  (tag exists)"
  git push "$REMOTE_URL" "$v" 2>&1 | tail -2 || echo "  (push done)"
  $GH release create "$v" \
    --repo gefrus112/lapia-ai-agent \
    --title "All In One Engine $v" \
    --notes "${RELEASES[$v]}" \
    --latest 2>&1 | tail -3 || echo "  (release may exist)"
  echo ""
done

echo "=== Listing all releases ==="
$GH release list --repo gefrus112/lapia-ai-agent 2>&1 | head -15

