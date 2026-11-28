#!/usr/bin/env bash
# Chép thư viện cho Space (trình soạn code) vào src/vendor – chạy lại khi nâng cấp phiên bản.
#   Monaco Editor (MIT) · Pyodide (MPL-2.0) · phông JetBrains Mono (OFL-1.1)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="${TMP_SPACE:-/tmp/space-vendor}"
mkdir -p "$TMP" && cd "$TMP"
[ -f package.json ] || npm init -y >/dev/null
npm i --no-audit --no-fund monaco-editor@0.52.2 pyodide@0.28.3 @fontsource/jetbrains-mono@5 @yowasp/clang@22.0.0-git20695-13 @bjorn3/browser_wasi_shim@0.4.2 >/dev/null

M="$ROOT/src/vendor/monaco"; rm -rf "$M"; mkdir -p "$M"
cp -r node_modules/monaco-editor/min/vs "$M/vs"
cp node_modules/monaco-editor/LICENSE "$M/LICENSE.txt"
# bỏ bản dịch giao diện không dùng và các ngôn ngữ tô màu không cần
rm -f "$M"/vs/nls.messages.*.js
( cd "$M/vs/basic-languages" && for d in */; do case "$d" in python/|cpp/|html/|css/|javascript/|typescript/|markdown/) ;; *) rm -rf "$d";; esac; done )
( cd "$M/vs/language" && rm -rf json )

P="$ROOT/src/vendor/pyodide"; rm -rf "$P"; mkdir -p "$P"
for f in pyodide.js pyodide.asm.js pyodide.asm.wasm python_stdlib.zip pyodide-lock.json package.json; do cp "node_modules/pyodide/$f" "$P/"; done
cp node_modules/pyodide/LICENSE "$P/LICENSE.txt" 2>/dev/null || echo "Pyodide – Mozilla Public License 2.0 – https://github.com/pyodide/pyodide" > "$P/LICENSE.txt"

F="$ROOT/src/fonts/jetbrains-mono"; rm -rf "$F"; mkdir -p "$F"
for s in latin latin-ext vietnamese; do for w in 400 500 700; do cp "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-$s-$w-normal.woff2" "$F/"; done; done
cp node_modules/@fontsource/jetbrains-mono/LICENSE "$F/OFL.txt"
# C++: Clang/LLD biên dịch sang WebAssembly (Apache-2.0 with LLVM exception, gói YoWASP: ISC) + WASI shim (MIT/Apache-2.0)
C="$ROOT/src/vendor/clang"; rm -rf "$C"; mkdir -p "$C"
cp node_modules/@yowasp/clang/gen/* "$C/"
printf 'YoWASP Clang/LLD %s – https://github.com/YoWASP/clang\nGói YoWASP: ISC. LLVM/Clang: Apache License 2.0 with LLVM Exceptions – https://llvm.org/LICENSE.txt\n' "$(node -p "require('./node_modules/@yowasp/clang/package.json').version")" > "$C/LICENSE.txt"
W="$ROOT/src/vendor/wasi-shim"; rm -rf "$W"; mkdir -p "$W"
cp node_modules/@bjorn3/browser_wasi_shim/dist/*.js "$W/"
cp node_modules/@bjorn3/browser_wasi_shim/LICENSE-MIT "$W/LICENSE-MIT.txt"
du -sh "$M" "$P" "$F" "$C" "$W"
