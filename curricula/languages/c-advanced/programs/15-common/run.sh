#!/bin/sh
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -c -o a.o a.c
cc -std=c17 -c -o b.o b.c
cc -std=c17 -fcommon -c -o ac.o a.c
cc -std=c17 -fcommon -c -o bc.o b.c

echo '$ cc -Q --help=common | grep -w -- -fcommon'
cc -Q --help=common 2>/dev/null | grep -w -- '-fcommon' | tr -s ' \t' ' ' | sed 's/^ //'

echo
echo '$ cc -o prog a.o b.o                 # الافتراض هنا'
if cc -o prog a.o b.o 2>err.txt; then
  chk FAIL 'the default linked two tentative definitions'
else
  sed 's|/usr/bin/ld:|ld:|' err.txt | sed -n '1,2p'
  grep -q 'multiple definition' err.txt \
    && chk ok 'the default rejects two tentative definitions across units' \
    || chk FAIL 'rejected, but not for multiple definition'
fi

echo
echo '$ cc -fcommon -o prog ac.o bc.o && ./prog'
if cc -o prog ac.o bc.o 2>/dev/null; then
  ./prog
  [ "$(./prog)" = "counter = 7" ] \
    && chk ok 'with -fcommon it links and both units share one object' \
    || chk FAIL 'linked but not shared'
else
  chk FAIL '-fcommon did not link'
fi

echo
echo '$ nm bc.o | grep counter        # -fcommon'
nm bc.o | grep counter
echo '$ nm b.o  | grep counter        # الافتراض'
nm b.o | grep counter

[ "$(nm bc.o | awk '$NF=="counter"{print $(NF-1)}')" = C ] \
  && chk ok '-fcommon marks it C: a common symbol, not yet placed' \
  || chk FAIL 'not C'
[ "$(nm b.o | awk '$NF=="counter"{print $(NF-1)}')" = B ] \
  && chk ok 'the default marks it B: a definition in .bss' || chk FAIL 'not B'
