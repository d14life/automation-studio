#!/usr/bin/env bash
# Re-take the product shots used by the demo deck on the front page.
#
# The cards show a picture of each demo, not a live iframe of it, so the picture has to be
# regenerated whenever a demo's UI changes - otherwise the card quietly drifts away from the
# product, which is the one thing the iframe version could not do.
#
#   npm run dev            # in app/, leave it running on 5199
#   bash app/tools/shots.sh
#
# 1120x780 is the design size of the shot; the card scales it down with width:100%.
set -euo pipefail

PORT="${PORT:-5199}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/shots"
DEMOS=(park zapchasti vzaimoraschety-v2 sklad)

[ -x "$CHROME" ] || { echo "no Chrome at $CHROME - set CHROME=" >&2; exit 1; }
curl -sf -o /dev/null "http://localhost:$PORT/" || { echo "no dev server on $PORT" >&2; exit 1; }
mkdir -p "$OUT"

for s in "${DEMOS[@]}"; do
  png="$OUT/$s.png"
  rm -f "$png"
  # index.html explicitly: Vite's SPA fallback answers a bare directory with the landing page,
  # which silently produces three screenshots of the wrong site.
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
            --window-size=1120,780 --virtual-time-budget=9000 \
            --screenshot="$png" "http://localhost:$PORT/demo/$s/index.html" >/dev/null 2>&1 &
  pid=$!
  # A demo with a permanently running animation never lets virtual time expire, so wait on the FILE and
  # then kill the browser rather than waiting on the process.
  for _ in $(seq 1 25); do sleep 2; [ -s "$png" ] && break; done
  sleep 1; kill "$pid" 2>/dev/null || true
  [ -s "$png" ] || { echo "$s: no screenshot" >&2; exit 1; }
  sips -s format jpeg -s formatOptions 78 "$png" --out "$OUT/$s.jpg" >/dev/null
  rm -f "$png"
  printf '%-18s %s\n' "$s" "$(du -h "$OUT/$s.jpg" | cut -f1)"
done
