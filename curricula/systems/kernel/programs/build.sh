#!/bin/sh
# build.sh <stage> [run]
#   يبني نواة المرحلة، ويصنع صورة إقلاع، ويشغّلها على QEMU إن طُلب.
#   الأدوات: clang يستهدف x86_64-elf، وld.lld، وxorriso، وlimine، وqemu.
#   لا cross-GCC يُبنى بيد: نفس الأمر يعمل على Linux وmacOS بلا تغيير.
set -eu
STAGE="${1:?usage: build.sh <stage> [run]}"
ACTION="${2:-}"
HERE=$(cd "$(dirname "$0")" && pwd)

CC=${CC:-clang}
LD=${LD:-ld.lld}
QEMU=${QEMU:-qemu-system-x86_64}
# على macOS مع Homebrew، llvm وlld مُعلَّقان (keg-only)
[ -x /opt/homebrew/opt/llvm/bin/clang ] && [ "${CC}" = clang ] && CC=/opt/homebrew/opt/llvm/bin/clang
[ -x /opt/homebrew/opt/lld/bin/ld.lld ] && [ "${LD}" = ld.lld ] && LD=/opt/homebrew/opt/lld/bin/ld.lld
LIMINE_BIN=${LIMINE_BIN:-$(command -v limine || true)}
for d in "${LIMINE_SHARE:-}" /opt/homebrew/opt/limine/share/limine /usr/share/limine /usr/local/share/limine; do
  [ -n "$d" ] && [ -f "$d/limine-bios-cd.bin" ] && LIMINE_SHARE=$d && break
done
: "${LIMINE_SHARE:?لم أجد ملفّات limine — عيّن LIMINE_SHARE}"

line=$(grep -E "^${STAGE}[[:space:]]*\|" "$HERE/stages.conf" || true)
[ -n "$line" ] || { echo "المرحلة ${STAGE} ليست في stages.conf" >&2; exit 2; }
SRCS=$(echo "$line"  | awk -F'|' '{print $2}')
QARGS=$(echo "$line" | awk -F'|' '{print $3}')
STAGE_TIMEOUT=$(echo "$line" | awk -F'|' '{print $4}' | tr -d ' ')

# `-fno-omit-frame-pointer` دائماً: بدونه لا سلسلةَ `rbp`، ولا أثرَ مكدَّسٍ
# عند الانهيار (الفصل 26). وثمنُه سجلٌّ واحدٌ محجوز.

# ترويسات صور المستخدم مولَّدة من `user/`: تُبنى عند غيابها ولا تدخل Git
for u in "$HERE"/user/*.c "$HERE"/user/*.S; do
  [ -e "$u" ] || continue
  b=$(basename "$u"); b=${b%.*}
  [ -f "$HERE/user/${b}_elf.h" ] || "$HERE/user/build.sh" "$b" >/dev/null
done

OUT="$HERE/out/$STAGE"
# تخطّي البناء إن كانت الصورة أحدث من كل مدخلاتها. و`FORCE=1` يعيد البناء.
if [ -z "${FORCE:-}" ] && [ -f "$OUT/kernel.iso" ] &&
   [ -z "$(find "$HERE/kernel" "$HERE/demos" "$HERE/variants" "$HERE/user" "$HERE/stages.conf" "$0" \
            -newer "$OUT/kernel.iso" -print -quit 2>/dev/null)" ]; then
  [ "$ACTION" = run ] || { echo "$OUT/kernel.iso"; exit 0; }
else
rm -rf "$OUT"; mkdir -p "$OUT"

CFLAGS="-std=c17 -ffreestanding -fno-stack-protector -fno-stack-check -fno-PIC
        -m64 -march=x86-64 -mno-red-zone -mcmodel=kernel
        -mno-80387 -mno-mmx -mno-sse -mno-sse2
        -Wall -Wextra -Werror -O2 -g -I$HERE/kernel
        -fno-omit-frame-pointer"

objs=""
compile_one() {
  # الامتداد يبقى في اسم الكائن: `x.c` و`x.S` معاً لا يتصادمان
  src="$1"; o="$OUT/$(basename "$src" | tr . _).o"
  # shellcheck disable=SC2086
  $CC --target=x86_64-elf $CFLAGS -c "$src" -o "$o"
  objs="$objs $o"
}
# مسارٌ فيه «/» يُحلّ من جذر programs/، وغيرُه من kernel/
for s in $SRCS; do
  case "$s" in */*) compile_one "$HERE/$s" ;; *) compile_one "$HERE/kernel/$s" ;; esac
done
compile_one "$HERE/demos/s${STAGE}.c"

# shellcheck disable=SC2086
$LD -nostdlib -static -z max-page-size=0x1000 -T "$HERE/kernel/linker.ld" \
    -M -o "$OUT/kernel.elf" $objs > "$OUT/link.map"

ISO="$OUT/iso"
mkdir -p "$ISO/boot/limine" "$ISO/EFI/BOOT"
cp "$OUT/kernel.elf" "$ISO/boot/"
printf 'timeout: 0\nverbose: no\n\n/stage %s\n    protocol: limine\n    path: boot():/boot/kernel.elf\n' \
  "$STAGE" > "$ISO/boot/limine/limine.conf"
cp "$LIMINE_SHARE/limine-bios.sys" "$LIMINE_SHARE/limine-bios-cd.bin" \
   "$LIMINE_SHARE/limine-uefi-cd.bin" "$ISO/boot/limine/"
cp "$LIMINE_SHARE/BOOTX64.EFI" "$ISO/EFI/BOOT/"
xorriso -as mkisofs -R -r -J -b boot/limine/limine-bios-cd.bin -no-emul-boot \
  -boot-load-size 4 -boot-info-table -hfsplus -apm-block-size 2048 \
  --efi-boot boot/limine/limine-uefi-cd.bin -efi-boot-part --efi-boot-image \
  --protective-msdos-label "$ISO" -o "$OUT/kernel.iso" >/dev/null 2>&1
[ -n "$LIMINE_BIN" ] && "$LIMINE_BIN" bios-install "$OUT/kernel.iso" >/dev/null 2>&1

fi

[ "$ACTION" = run ] || { echo "$OUT/kernel.iso"; exit 0; }

# مهلةٌ موثوقة: نشغّل في الخلفية ونقتل بعدها. و`alarm` لا تصمد عبر exec دائماً.
# ومجرى الأخطاء يُدمَج، فوسائط `-d` من QEMU تصل إلى نفس المخرَج.
# shellcheck disable=SC2086
"$QEMU" -cdrom "$OUT/kernel.iso" -m "${MEM:-256M}" \
  -serial stdio -display none -no-reboot \
  -device isa-debug-exit,iobase=0xf4,iosize=0x04 $QARGS < /dev/null 2>"$OUT/qemu.err" &
qpid=$!
# مخرَجُ الحارس مصروفٌ إلى العدم: لو ورث الأنبوب لأبقاه مفتوحاً حتى تنتهي
# مهلتُه، فينتظر القارئُ المهلةَ كاملةً وإن خرج QEMU فوراً.
( sleep "${TIMEOUT:-${STAGE_TIMEOUT:-25}}"; kill -9 "$qpid" 2>/dev/null ) >/dev/null 2>&1 &
killer=$!
wait "$qpid"; st=$?
kill "$killer" 2>/dev/null || true
[ -s "$OUT/qemu.err" ] && cat "$OUT/qemu.err"
exit $st
