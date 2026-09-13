#!/bin/sh
# يبني برنامج المستخدم، ويُخرِج منه شيئين:
#   <name>_blob.h  النصُّ الخام      — تحمّله المرحلة 15 بلا محمِّل
#   <name>_elf.h   الصورةُ كاملةً    — تحمّلها المرحلة 16 بقراءة program headers
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
CC=${CC:-clang}; LD=${LD:-ld.lld}; OC=${OC:-llvm-objcopy}
[ -x /opt/homebrew/opt/llvm/bin/clang ] && CC=/opt/homebrew/opt/llvm/bin/clang
[ -x /opt/homebrew/opt/lld/bin/ld.lld ] && LD=/opt/homebrew/opt/lld/bin/ld.lld
[ -x /opt/homebrew/opt/llvm/bin/llvm-objcopy ] && OC=/opt/homebrew/opt/llvm/bin/llvm-objcopy

name=${1:-hello}
src="$HERE/$name.S"; [ -f "$src" ] || src="$HERE/$name.c"

$CC --target=x86_64-elf -ffreestanding -fno-stack-protector -fno-PIC \
    -mno-red-zone -mno-sse -mno-sse2 -O1 -c "$src" -o "$HERE/$name.o"
# كلُّ segment على صفحةٍ مستقلّة: فلا تشترك أذوناتٌ مختلفةٌ في صفحةٍ واحدة
$LD -nostdlib -static -z max-page-size=0x1000 -z separate-loadable-segments \
    -Ttext=0x400000 -e _start \
    -o "$HERE/$name.elf" "$HERE/$name.o"
$OC -O binary --only-section=.text "$HERE/$name.elf" "$HERE/$name.bin"

python3 "$HERE/blob.py" "$HERE/$name.bin" "$HERE/${name}_blob.h" "${name}"
python3 "$HERE/blob.py" "$HERE/$name.elf" "$HERE/${name}_elf.h"  "${name}_elf"
