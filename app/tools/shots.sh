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
#
# EACH ENTRY IS "slug|query|WIDTHxHEIGHT", and the last two fields are why this list stopped
# being a plain array. A demo boots into whichever screen it boots into, and for park that is
# the dispatcher board - so "make the card show the analytics screen" was true exactly once and
# would have been quietly untrue the next time anyone re-shot. The query is a deep link the
# demo itself understands (park reads ?view= and ?period=), so the framing is a property of
# this file rather than of whoever last clicked around before pressing the button.
#
# The size must keep the 1120x780 ratio - the card is aspect-ratio:1120/780 with overflow
# hidden, so anything taller is cropped at the bottom rather than fitted. Shooting park at
# 1600x1114 and scaling down is not for sharpness: a wider viewport lays the KPI tiles out in
# one row instead of two, which is what makes the chart AND the revenue donut fit in one frame.
set -euo pipefail

PORT="${PORT:-5199}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/shots"
DEMOS=(
  'park|?view=analytics&period=m9|1600x1114'
  'zapchasti||1120x780'
  'vzaimoraschety-v2||1120x780'
  'sklad||1120x780'
)

[ -x "$CHROME" ] || { echo "no Chrome at $CHROME - set CHROME=" >&2; exit 1; }
curl -sf -o /dev/null "http://localhost:$PORT/" || { echo "no dev server on $PORT" >&2; exit 1; }
mkdir -p "$OUT"

for entry in "${DEMOS[@]}"; do
  IFS='|' read -r s query size <<< "$entry"
  png="$OUT/$s.png"
  rm -f "$png"
  # index.html explicitly: Vite's SPA fallback answers a bare directory with the landing page,
  # which silently produces three screenshots of the wrong site.
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
            --window-size="${size/x/,}" --virtual-time-budget=9000 \
            --screenshot="$png" "http://localhost:$PORT/demo/$s/index.html$query" >/dev/null 2>&1 &
  pid=$!
  # A demo with a permanently running animation never lets virtual time expire, so wait on the FILE and
  # then kill the browser rather than waiting on the process.
  for _ in $(seq 1 25); do sleep 2; [ -s "$png" ] && break; done
  sleep 1; kill "$pid" 2>/dev/null || true
  [ -s "$png" ] || { echo "$s: no screenshot" >&2; exit 1; }
  # every card lands on disk at the same 1120x780 whatever it was shot at, so the deck stays
  # one set of files with one shape and V2.tsx keeps its single width/height pair
  sips -z 780 1120 "$png" --out "$png" >/dev/null
  sips -s format jpeg -s formatOptions 78 "$png" --out "$OUT/$s.jpg" >/dev/null
  rm -f "$png"
  printf '%-18s %s  %s\n' "$s" "$(du -h "$OUT/$s.jpg" | cut -f1)" "shot at $size"
done
