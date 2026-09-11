#!/bin/sh
set -e
cc -std=c17 -Wall -Wextra -O2 -fno-builtin -fPIC -shared -o mymalloc.so mymalloc.c
cc -std=c17 -Wall -Wextra -o use use.c
LD_PRELOAD=./mymalloc.so ./use

chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
L="$PWD/mymalloc.so"
if LD_PRELOAD=$L date >/dev/null 2>&1; then d=works; else d=fails; fi
if timeout 60 env LD_PRELOAD=$L objdump -d /usr/lib/aarch64-linux-gnu/libc.so.6 \
     >/dev/null 2>e.txt; then w=finished
else w="$(grep -o 'out of memory[^,]*' e.txt | head -1)"; fi
printf 'date under it:            %s\n' "$d"
printf 'objdump -d libc.so.6:     %s\n' "$w"
[ "$d" = works ] && chk ok 'a small program runs under it' || chk FAIL 'date'
case "$w" in *"out of memory"*) chk ok 'and a real one exhausts it: nothing is ever freed';;
  *) chk FAIL "workload: $w";; esac
