#!/bin/sh
set -e
cc -std=c17 -Wall -Wextra -c -o unit.o unit.c
cc -std=c17 -Wall -Wextra -o symread symread.c

echo '$ ./symread unit.o'
./symread unit.o
echo
echo '$ nm unit.o'
nm unit.o

chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
letter() { nm unit.o | awk -v n="$2" '$NF==n{print $(NF-1)}'; }
[ "$(letter x hidden)" = t ] && chk ok 'nm agrees: lowercase t for the local' \
                             || chk FAIL 'hidden is not t'
[ "$(letter x shared)" = T ] && chk ok 'nm agrees: uppercase T for the global' \
                             || chk FAIL 'shared is not T'
[ "$(letter x maybe)"  = W ] && chk ok 'nm agrees: W for the weak definition' \
                             || chk FAIL 'maybe is not W'
[ "$(letter x puts)"   = U ] && chk ok 'nm agrees: U for the undefined name' \
                             || chk FAIL 'puts is not U'
