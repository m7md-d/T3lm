#!/bin/sh
set -e
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -Wall -Wextra -O2 -fno-builtin -fPIC -shared -o libtamalloc.so tamalloc.c
cc -std=c17 -Wall -Wextra -O2 -fno-builtin -fPIC -shared -o libnaive.so naive.c
cc -std=c17 -O2 -fPIC -shared -o builtin.so tamalloc.c        # بلا -fno-builtin
L="$PWD/libtamalloc.so"; N="$PWD/libnaive.so"
W="objdump -d /usr/lib/aarch64-linux-gnu/libc.so.6"

echo '$ objdump -d --disassemble=calloc   — built without -fno-builtin'
objdump -d --disassemble=calloc builtin.so | grep -E 'calloc@plt' | sed 's/^ *//' | head -1
echo '$ objdump -d --disassemble=calloc   — built with it'
objdump -d --disassemble=calloc libtamalloc.so | grep -cE 'calloc@plt' | sed 's/^/matches: /'

echo
echo '$ objdump -d libc.so.6      # three allocators, one command'
$W > ref.txt 2>/dev/null
ms() { s=$(date +%s%N); "$@" >/dev/null 2>&1 || true; e=$(date +%s%N); echo $(( (e - s) / 1000000 )); }
g=$(ms env $W)
o=$(ms env LD_PRELOAD=$L $W)
LD_PRELOAD=$L $W > ours.txt 2>stats.txt || true
if timeout 60 env LD_PRELOAD=$N $W >naive.txt 2>nerr.txt; then nv=finished
else nv="stopped: $(grep -o 'out of memory[^,]*' nerr.txt | head -1)"; fi
printf 'glibc            %5s ms   output %s bytes\n' "$g" "$(wc -c < ref.txt)"
printf 'tamalloc.so      %5s ms   output %s bytes\n' "$o" "$(wc -c < ours.txt)"
printf 'naive (ch 00)          %s\n' "$nv"
echo
grep tamalloc stats.txt || true

cmp -s ref.txt ours.txt \
  && chk ok 'the replacement produces byte-identical output to glibc' || chk FAIL 'output differs'
grep -q 'tamalloc: [1-9]' stats.txt \
  && chk ok 'and it really was the allocator in the path' || chk FAIL 'not in the path'
case "$nv" in *"out of memory"*)
    chk ok 'the chapter-00 allocator runs the workload out of memory';;
  *) chk FAIL "naive: $nv";; esac
objdump -d --disassemble=calloc builtin.so | grep -q 'calloc@plt' \
  && chk ok 'without -fno-builtin the compiler turns calloc into a call to calloc' \
  || chk FAIL 'no self-call'
[ "$(objdump -d --disassemble=calloc libtamalloc.so | grep -c 'calloc@plt')" -eq 0 ] \
  && chk ok 'and with it the body stays the one we wrote' || chk FAIL 'still self-calls'
