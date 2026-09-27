# Lapia Studio — PyInstaller spec for building a Windows .exe
#
# Usage:
#   1. Install PyInstaller:  pip install pyinstaller
#   2. Build:                pyinstaller lapia_game.spec
#   3. Output:               dist/LapiaGame/LapiaGame.exe
#
# This spec bundles the Lapia engine + your game's main.py into a
# standalone Windows executable. Users double-click to play — no Python
# install required.

# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['engine/examples/platformer.py'],
    pathex=['engine'],
    binaries=[],
    datas=[],
    hiddenimports=[
        'lapia',
        'lapia.core',
        'lapia.rendering',
        'lapia.physics',
        'lapia.input',
        'lapia.audio',
        'lapia.scene',
        'lapia.ai',
        'lapia.network',
        'lapia.ui',
        'lapia.tools',
        'lapia.engine',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='LapiaGame',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='public/logo.svg',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='LapiaGame',
)
