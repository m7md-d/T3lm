#!/bin/sh
set -e
cc -std=c17 -O1 -c -o abi.o abi.c
for fn in caller keeps call_v; do
  echo "\$ objdump -d --disassemble=$fn abi.o"
  objdump -d --disassemble=$fn abi.o | sed -n '/>:/,$p' | sed 's/^[[:space:]]*//'
  echo
done

d=$(objdump -d --disassemble=caller abi.o)
k=$(objdump -d --disassemble=keeps  abi.o)
v=$(objdump -d --disassemble=call_v abi.o)
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
echo "$d" | grep -q 'd0' && chk ok 'الـdouble يمرّ في مصرفٍ منفصل (d0)' || chk FAIL 'd0'
echo "$d" | grep -q 'x8'  && chk ok 'الإرجاع الكبير عبر مؤشّرٍ في x8' || chk FAIL 'x8'
echo "$d" | grep -q 'w0'  && chk ok 'الـint الأوّل في w0' || chk FAIL 'w0'
echo "$k" | grep -q 'x19' && chk ok 'قيمةٌ تعبر نداءً تسكن سجلّاً يحفظه المُستدعى' || chk FAIL 'x19'
echo "$v" | grep -qE '\bw1\b|\bw2\b' && chk ok 'الوسائط المتغيّرة تمرّ في سجلّات على هذا الـABI' || chk FAIL 'variadic'
