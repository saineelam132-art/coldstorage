#!/bin/sh
# Bundle the website's JavaScript into two classic scripts for the static backup (file:// cannot load
# ES modules). Needs Node.js once:   sh tools/build_static_bundle.sh
set -e
cd "$(dirname "$0")/../web"
mkdir -p static
cat > static/entry_app.js <<'JS'
import '../js/static_api.js';
import '../js/main.js';
JS
cat > static/entry_buyer.js <<'JS'
import '../js/static_api.js';
import '../js/buyer/buyer.js';
JS
npx --yes esbuild@0.24.0 static/entry_app.js --bundle --format=iife --minify --target=es2020 \
  --outfile=static/app.bundle.js
npx --yes esbuild@0.24.0 static/entry_buyer.js --bundle --format=iife --minify --target=es2020 --outfile=static/buyer.bundle.js
echo "bundles written to web/static/"
