#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML="$ROOT/docs/assets/hero-frames.html"
OUT_DIR="$ROOT/docs/assets/gif-frames"
GIF="$ROOT/docs/assets/tanstack-fetch-hero.gif"
PNG="$ROOT/docs/assets/tanstack-fetch-hero.png"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"
STEPS=(0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 17 17 17)
i=0
for step in "${STEPS[@]}"; do
  printf -v name "%03d.png" "$i"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --window-size=1200,760 \
    --screenshot="$OUT_DIR/$name" "file://${HTML}?step=${step}" >/dev/null 2>&1
  i=$((i + 1))
done
ffmpeg -y -framerate 3 -i "$OUT_DIR/%03d.png" \
  -vf "fps=6,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" \
  "$GIF"
cp "$OUT_DIR/017.png" "$PNG"
ls -lh "$GIF" "$PNG"
