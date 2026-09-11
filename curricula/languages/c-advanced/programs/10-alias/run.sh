#!/bin/sh
set -e
for O in -O0 -O2; do
  cc -std=c17 -Wall $O -o a alias.c
  eval "r$(echo $O | tr -d '-O')=$(./a)"
  printf '%s alias.c  →  %s\n' "$O" "$(./a)"
done
for O in -O0 -O2; do
  cc -std=c17 -Wall $O -o c copy.c
  printf '%s copy.c   →  %s\n' "$O" "$(./c)"
done
cc -std=c17 -Wall -O0 -o a0 alias.c; cc -std=c17 -Wall -O2 -o a2 alias.c
cc -std=c17 -Wall -O0 -o c0 copy.c;  cc -std=c17 -Wall -O2 -o c2 copy.c
[ "$(./a0)" != "$(./a2)" ] && s=ok || s=FAIL
printf 'assert %s  مخالفةُ الـaliasing تعطي جوابين باختلاف التحسين\n' "$s" >&2
[ "$(./c0)" = "$(./c2)" ] && s=ok || s=FAIL
printf 'assert %s  memcpy يعطي الجواب نفسه في المستويين\n' "$s" >&2
