#!/usr/bin/env bash
# يبني مفسّر Go إلى WASM — تنفيذ حقيقي في متصفّح المستخدم، بلا خادم.
# المصدر هنا لأن الناتج لا يدخل Git.
#
#   ./build.sh        يفحص الاستيرادات ثم يبني
#   ./build.sh sync   يعيد نسخ رموز الحزم من ذاكرة وحدات Go
#
# الحجم مقيَّد: حدّ Cloudflare Pages للملف الواحد ٢٥ ميغابايت، و`stdlib` كاملةً
# تُخرج ٣٩. فالمربوط هو حزم المنهج وحدها — انظر symbols/README.md.
set -e
cd "$(dirname "$0")"

YAEGI=v0.16.1
PKGS=(fmt strings strconv errors sort bytes sync sync_atomic time os io bufio
      math math_rand math_bits unicode unicode_utf8 unicode_utf16 encoding_json
      runtime context slices maps cmp testing reflect regexp)

if [ "$1" = "sync" ]; then
  SRC="$(go env GOMODCACHE)/github.com/traefik/yaegi@$YAEGI/stdlib"
  [ -d "$SRC" ] || { echo "لا توجد yaegi@$YAEGI في ذاكرة الوحدات — شغّل go mod download"; exit 1; }
  for p in "${PKGS[@]}" restricted maptypes; do
    f="$SRC/go1_22_$p.go"; [ -f "$f" ] || f="$SRC/$p.go"
    [ -f "$f" ] || { echo "لا ملف رموزٍ لـ$p"; exit 1; }
    sed 's/^package stdlib$/package symbols/' "$f" > "symbols/$p.go"
  done
  echo "✓ زُومنت ${#PKGS[@]} حزمة من yaegi@$YAEGI"
  exit 0
fi

python3 check-imports.py

# -s -w: بلا جدول رموزٍ ولا DWARF — لا يُصحَّح هذا الملف بمصحّح.
GOOS=js GOARCH=wasm go build -ldflags="-s -w" -trimpath -o ../public/go-runner.wasm .
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" ../public/wasm_exec.js

BYTES=$(wc -c < ../public/go-runner.wasm)
LIMIT=$((25 * 1024 * 1024))
printf 'الحجم: %s ميغابايت (حدّ Cloudflare: ٢٥)\n' "$(echo "scale=1; $BYTES/1048576" | bc)"
[ "$BYTES" -lt "$LIMIT" ] || { echo "✗ تجاوز الحدّ — قلّل PKGS"; exit 1; }
