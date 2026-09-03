#!/bin/bash
# Deploy Raconte-moi web build to GitHub Pages
# Usage: bash deploy-web.sh

set -e

echo "📦 Building web..."
npx expo export --platform web

echo "🚀 Deploying to raconte-moi-web..."
DEPLOY_DIR=$(mktemp -d)
cp -r dist/. "$DEPLOY_DIR/"
touch "$DEPLOY_DIR/.nojekyll"   # Expose _expo/ to GitHub Pages
cd "$DEPLOY_DIR"
git init
git checkout -b gh-pages
git add .
git commit -m "Web deploy $(date '+%Y-%m-%d %H:%M')"
git remote add origin https://github.com/joaofmsilva1979/raconte-moi-web.git
git push --force origin gh-pages
cd -
rm -rf "$DEPLOY_DIR"

echo "✅ Live at https://joaofmsilva1979.github.io/raconte-moi-web/"
