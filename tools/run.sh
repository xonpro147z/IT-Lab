#!/bin/bash
# dùng: tools/run.sh <page> <out.png> [script]
cd "$(dirname "$0")/.."
env -u NODE_OPTIONS timeout 90 xvfb-run -a -s "-screen 0 1400x900x24" ./node_modules/electron/dist/electron --no-sandbox tools/shot.js "$@" 2>&1 | grep -E "^(CONSOLE|RESULT|SCRIPT)" | grep -v "Security Warning"
