#!/usr/bin/env python3
"""Replace all @/ imports with relative imports in .tsx and .ts files."""
import os
import re
from pathlib import Path

SRC_DIR = Path("/home/z/my-project/src")

def get_relative_path(file_path: Path, target_path: str) -> str:
    """Convert @/lib/foo to a relative path from file_path."""
    # target_path is like "lib/studio-store" or "components/ui/button"
    target = target_path.lstrip("/")
    file_dir = file_path.parent
    # Calculate relative path from file_dir to src/target
    # file is at src/app/page.tsx → file_dir = src/app
    # target is src/lib/studio-store → relative = ../lib/studio-store
    src_dir = SRC_DIR
    rel_from_src = file_dir.relative_to(src_dir)
    parts = list(rel_from_src.parts)
    # Go up from file_dir to src, then down to target
    up_count = len(parts)
    relative = "../" * up_count + target
    return relative

def process_file(file_path: Path):
    content = file_path.read_text()
    original = content
    
    # Replace @/ imports
    # Match: from "@/..." or from '@/...'
    pattern = r'from\s+["\']@/([^"\']+)["\']'
    
    def replace(match):
        target = match.group(1)
        relative = get_relative_path(file_path, target)
        return f'from "{relative}"'
    
    content = re.sub(pattern, replace, content)
    
    # Also replace @/ in dynamic imports: import("@/...")
    pattern2 = r'import\(["\']@/([^"\']+)["\']\)'
    def replace2(match):
        target = match.group(1)
        relative = get_relative_path(file_path, target)
        return f'import("{relative}")'
    content = re.sub(pattern2, replace2, content)
    
    if content != original:
        file_path.write_text(content)
        print(f"  Fixed: {file_path}")
        return True
    return False

count = 0
for ext in [".tsx", ".ts"]:
    for file_path in SRC_DIR.rglob(f"*{ext}"):
        if process_file(file_path):
            count += 1

print(f"\nFixed {count} files.")
