#!/bin/sh
set -e
cc -std=c17 -O2 -c -o r.o r.c
n1=$(objdump -d --disassemble=add2  r.o | grep -cE '\sldr\s')
n2=$(objdump -d --disassemble=add2r r.o | grep -cE '\sldr\s')
printf '%-6s  →  %s تعليمةَ تحميل\n' add2  "$n1"
printf '%-6s  →  %s تعليمةَ تحميل\n' add2r "$n2"
objdump -d --disassemble=add2 r.o | sed -n '/>:/,$p' | sed 's/^[[:space:]]*//' | head -8
[ "$n1" -gt "$n2" ] && s=ok || s=FAIL
printf 'assert %s  restrict يقلّل تعليمات التحميل\n' "$s" >&2
