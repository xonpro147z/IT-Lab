#!/usr/bin/env bash
# Build Scratch 3 offline cho TinHocLab từ scratch-gui v4.1.7 (bản BSD-3-Clause cuối cùng – KHÔNG dùng 5.x vì đã chuyển AGPL).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(dirname "$HERE")"
W="${TMP_SCRATCH:-/tmp/thl-scratch}"
rm -rf "$W" && git clone --depth 1 --branch v4.1.7 https://github.com/scratchfoundation/scratch-gui.git "$W"
cd "$W" && npm ci --ignore-scripts --no-audit --no-fund
mkdir -p src/generated && echo "module.exports = '';" > src/generated/microbit-hex-url.cjs
cp "$HERE/scratch/thl.jsx" src/playground/thl.jsx && cp "$HERE/scratch/webpack.thl.js" webpack.thl.js
NODE_ENV=production npx webpack --config webpack.thl.js
rm -f thl-build/*.map
rm -rf "$ROOT/src/vendor/scratch" && cp -r thl-build "$ROOT/src/vendor/scratch"
cp LICENSE "$ROOT/src/vendor/scratch/LICENSE-scratch-gui.txt"; cp TRADEMARK "$ROOT/src/vendor/scratch/TRADEMARK-scratch.txt"
echo "OK → src/vendor/scratch"
