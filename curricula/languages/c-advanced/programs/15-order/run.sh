#!/bin/sh
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -Wall -Wextra -c sq.c mainA.c mainB.c weak.c strong.c
ar rcs libsq.a sq.o

echo '$ ld --version | head -1'
ld --version | head -1

echo
echo '$ cc -o A mainA.o -L. -lsq   &&  ./A'
if cc -o A mainA.o -L. -lsq 2>e1.txt; then ./A; chk ok 'archive after the object: resolved'
else sed -n 1p e1.txt; chk FAIL 'expected this order to link'; fi

echo
echo '$ cc -o A2 -L. -lsq mainA.o'
if cc -o A2 -L. -lsq mainA.o 2>e2.txt; then chk FAIL 'expected this order to fail'
else
  sed 's|/usr/bin/ld:|ld:|' e2.txt | grep -E 'undefined|square' | sed -n 1,2p
  grep -q 'undefined reference' e2.txt \
    && chk ok 'archive before the object: the symbol was not yet wanted' \
    || chk FAIL 'failed for another reason'
fi

echo
echo '$ cc -o B mainB.o weak.o        &&  ./B'
cc -o B mainB.o weak.o && ./B
echo '$ cc -o B2 mainB.o weak.o strong.o  &&  ./B2'
cc -o B2 mainB.o weak.o strong.o && ./B2
echo '$ cc -o B3 mainB.o strong.o weak.o  &&  ./B3'
cc -o B3 mainB.o strong.o weak.o && ./B3

[ "$(./B)" = "hook: the weak one" ] \
  && chk ok 'the weak definition is used when it is the only one' || chk FAIL 'B'
[ "$(./B2)" = "hook: the strong one" ] \
  && chk ok 'a strong definition displaces the weak one' || chk FAIL 'B2'
[ "$(./B2)" = "$(./B3)" ] \
  && chk ok 'and the order of the two object files does not change that' || chk FAIL 'B3'
