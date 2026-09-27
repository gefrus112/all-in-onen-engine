# Deployment

## GitHub Pages (Already Deployed)

The All In One Engine website is deployed to GitHub Pages:

> **https://gefrus112.github.io/all-in-onen-engine/**

The deployment happens automatically via GitHub Actions on every push to `main`.

### How it works

1. Push to `main` triggers `.github/workflows/deploy.yml`
2. GitHub Actions builds the static export with `npx next build --webpack`
3. The `out/` directory is uploaded as a Pages artifact
4. GitHub Pages serves the static HTML

### To redeploy

```bash
git push origin main
```

## Native Builds

### Windows .exe
```bash
bash build_exe.sh
# Output: dist/LapiaGame/LapiaGame.exe
```

### Linux AppImage + .deb
```bash
bash build_linux.sh
# Output: dist/AllInOneEngine-linux-x86_64.AppImage
#         dist/all-in-one-engine-linux.deb
```

### macOS .dmg
```bash
bash build_mac.sh
# Output: dist/AllInOneEngine.dmg
```

### Chromebook .deb
```bash
bash build_chromebook.sh
# Output: dist/all-in-one-engine-chromebook.deb
```

## Publishing Games

### itch.io
1. Click "Build HTML5" in the Publish dialog
2. Download the game.html file
3. Go to itch.io/upload
4. Set kind to "HTML" and upload the file
5. Set viewport dimensions and click "Save & view"

### Crazy Games
1. Click "Build HTML5"
2. Download the file
3. Go to developer.crazygames.com
4. Click "Submit a Game" and upload
5. Wait 2-5 business days for review

### GitHub Pages (for your game)
1. Build HTML5
2. Commit to a `gh-pages` branch
3. Go to repo Settings > Pages
4. Set source to "gh-pages branch"

### HTML5 Standalone
1. Build HTML5
2. Open index.html locally to test
3. Upload to any static host (Netlify, Vercel, S3)
