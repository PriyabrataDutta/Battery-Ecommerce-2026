#!/bin/bash
# Usage: process_images.sh <image_urls.json> <workdir>
# Downloads each unique image URL into <workdir>/raw, makes an 800x800 white-padded WebP in <workdir>/out.
set -u
J=$1; W=$2; mkdir -p "$W/raw" "$W/out"
UA="Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36"
python3 -I -c "
import json,sys,hashlib
for e in json.load(open(sys.argv[1])):
    u=e.get('image_url')
    if u: print(hashlib.sha1(u.encode()).hexdigest()[:12], u)
" "$J" | sort -u | while read -r H U; do
  [ -f "$W/out/$H.webp" ] && continue
  curl -sL -m 30 -A "$UA" -o "$W/raw/$H" "$U" || { echo "FAIL download $U"; continue; }
  file -b --mime-type "$W/raw/$H" | grep -q '^image/' || { echo "NOT IMAGE $U"; continue; }
  sips -s format png "$W/raw/$H" --out "$W/raw/$H.png" >/dev/null 2>&1 &&
  M=$(sips -g pixelWidth -g pixelHeight "$W/raw/$H.png" | awk '/pixel/{print $2}' | sort -n | tail -1)
  if [ "$M" -gt 760 ]; then sips -Z 760 "$W/raw/$H.png" >/dev/null 2>&1; SQ=800; else SQ=$((M * 800 / 760)); fi
  sips -p $SQ $SQ --padColor FFFFFF "$W/raw/$H.png" >/dev/null 2>&1 &&
  cwebp -quiet -q 80 -m 6 -alpha_q 80 "$W/raw/$H.png" -o "$W/out/$H.webp" &&
  echo "ok $H $(stat -f%z "$W/raw/$H") -> $(stat -f%z "$W/out/$H.webp") bytes" || echo "FAIL convert $U"
done
