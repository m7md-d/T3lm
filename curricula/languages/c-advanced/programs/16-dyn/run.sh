#!/bin/sh
set -e
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -Wall -Wextra -fPIC -shared -o libgreet.so greet.c
cc -std=c17 -Wall -Wextra -o dyn main.c -L. -lgreet
cc -std=c17 -Wall -Wextra -c -o greet_s.o greet.c
ar rcs libgs.a greet_s.o
cc -std=c17 -Wall -Wextra -static -o stat main.c -L. -lgs

echo '$ LD_LIBRARY_PATH=. ./dyn   |   ./stat'
LD_LIBRARY_PATH=. ./dyn | sed -n 2p
./stat | sed -n 2p
printf 'size   dyn %s   stat %s   bytes\n' "$(wc -c < dyn)" "$(wc -c < stat)"

echo
echo '$ readelf -dW dyn | grep NEEDED'
readelf -dW dyn | grep NEEDED | sed 's/^ *//'
echo '$ readelf -rW dyn | grep greet'
readelf -rW dyn | grep greet
echo
echo '$ readelf -dW stat | head -2'
readelf -dW stat 2>&1 | sed -n '1,2p'
echo '$ readelf -rW stat | grep -c greet'
readelf -rW stat | grep -c greet || true
echo '$ readelf -SW stat | grep " .plt"'
readelf -SW stat | grep ' \.plt ' | sed 's/^ *//'
echo '$ readelf -rW stat | grep -o "R_AARCH64_[A-Z_]*" | sort -u'
readelf -rW stat | grep -o 'R_AARCH64_[A-Z_]*' | sort -u

[ "$(LD_LIBRARY_PATH=. ./dyn | sed -n 2p)" = "$(./stat | sed -n 2p)" ] \
  && chk ok 'both binaries print the same line' || chk FAIL 'output differs'
readelf -dW dyn | grep -q 'NEEDED.*libgreet.so' \
  && chk ok 'the dynamic one records the library it still needs' || chk FAIL 'no NEEDED'
readelf -rW dyn | grep -q 'JUMP_SLOT.*greet' \
  && chk ok 'and keeps greet as a relocation to be filled at run time' || chk FAIL 'no JUMP_SLOT'
readelf -dW stat 2>&1 | grep -q 'no dynamic section' \
  && chk ok 'the static one has no dynamic section at all' || chk FAIL 'has dynamic'
[ "$(readelf -rW stat | grep -c greet)" -eq 0 ] \
  && chk ok 'and no relocation mentions greet: it was placed at link time' || chk FAIL 'greet reloc'
readelf -SW stat | grep -q ' \.plt ' \
  && chk ok 'yet the static binary still carries a .plt section' || chk FAIL 'no plt'
[ "$(wc -c < stat)" -gt "$(wc -c < dyn)" ] \
  && chk ok 'the static binary is the larger file' || chk FAIL 'size'
