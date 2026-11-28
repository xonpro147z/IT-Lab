#!/bin/bash
# Dựng lại mục "Giải phẫu 3D" (pc-anatomy, giấy phép MIT – https://github.com/Yoosseph/pc-anatomy)
# Cách dùng: bash tools/build-anatomy.sh   (cần Node.js 22+ và mạng để tải mã nguồn)
set -e
# Ghim đúng commit đã kiểm tra: bản vá tools/anatomy.patch chỉ chắc chắn áp dụng được trên commit này.
PCA_REV=${PCA_REV:-485a649b697a3e367a611860d278d8de26304e76}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
TMP=$(mktemp -d)
git clone https://github.com/Yoosseph/pc-anatomy.git "$TMP/pc-anatomy"
cd "$TMP/pc-anatomy"
git checkout -q "$PCA_REV"
git apply "$ROOT/tools/anatomy.patch"
# Mã riêng của TinHocLab (tháo lắp 3D) nằm ở tools/anatomy-thl, bản vá chỉ giữ các điểm móc nối.
mkdir -p lib/thl && cp "$ROOT"/tools/anatomy-thl/*.ts lib/thl/
cp "$ROOT/tools/anatomy-vi.js" public/vi.js
cp "$ROOT/tools/anatomy-vi-concepts.json" lib/vi-concepts.json
cp "$ROOT/tools/anatomy-vi-levels.json" lib/vi-levels.json
cp "$ROOT/tools/anatomy-asm.js" public/asm.js
cp "$ROOT/tools/anatomy-teardown.js" public/teardown.js
cp "$ROOT/tools/anatomy-pccheck.js" public/pccheck.js
cp "$ROOT/tools/anatomy-pccat.js" public/pccat.js
mkdir -p public/labs
cp "$ROOT/tools/anatomy-labs3d.js" public/labs/labs3d.js
cp "$ROOT/tools/anatomy-labs.css" public/labs/labs.css
grep -q 'asm.js' index.html || sed -i.bak 's#<script src="/theme.js"></script>#<script src="/theme.js"></script>\n    <script src="/vi.js" defer></script>\n    <script src="/asm.js" defer></script>\n    <script src="/teardown.js" defer></script>#' index.html
npm install --no-audit --no-fund
npx vite build --base=./
rm -rf "$ROOT/src/anatomy" && cp -r dist "$ROOT/src/anatomy"
rm -f "$ROOT/src/anatomy/"{robots.txt,sitemap.xml,social-preview.png}
cp LICENSE "$ROOT/src/anatomy/LICENSE-pc-anatomy.txt"
cp "$ROOT/tools/anatomy-README.md" "$ROOT/src/anatomy/README-TinHocLab.md"
cp "$ROOT/tools/NOTICE-teardown.txt" "$ROOT/src/anatomy/NOTICE-teardown.txt"
echo "Xong: src/anatomy"
