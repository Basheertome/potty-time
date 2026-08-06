#!/usr/bin/env bash
#
# Bumps the app version in every place it appears, so a deploy can't be
# served from a stale cache.
#
#   ./bump-version.sh          # 34 -> 35
#   ./bump-version.sh 40       # set it explicitly
#
# Run this after changing style.css or script.js. It keeps three things
# in lockstep, which is the whole point - if they drift, the service
# worker caches URLs the page never asks for and every load misses:
#
#   index.html   <link href="style.css?v=N">, <script src="script.js?v=N">
#   sw.js        APP_VERSION, which drives both CACHE_NAME and APP_SHELL
#
set -euo pipefail
cd "$(dirname "$0")"

current=$(sed -n 's/^const APP_VERSION = "\([0-9]*\)".*/\1/p' sw.js)
if [ -z "$current" ]; then
  echo "error: couldn't find APP_VERSION in sw.js" >&2
  exit 1
fi

next="${1:-$((current + 1))}"

# -i.bak keeps this working on both GNU and BSD/macOS sed.
sed -i.bak -E "s/^const APP_VERSION = \"[0-9]+\"/const APP_VERSION = \"$next\"/" sw.js
sed -i.bak -E "s/\?v=[0-9]+/?v=$next/g" index.html
rm -f sw.js.bak index.html.bak

echo "v$current -> v$next"
grep -n "v=$next\|APP_VERSION" index.html sw.js
