#!/bin/sh
set -e
cc -std=c17 -c main.c -o main.o
echo '$ nm main.o'
nm main.o
cc -std=c17 -o hi main.o
echo '$ ldd hi'
ldd hi
echo '$ LD_DEBUG=bindings ./hi'
LD_DEBUG=bindings ./hi 2>&1 | grep puts | head -1 \
  | sed -E 's/^[[:space:]]*[0-9]+:[[:space:]]*//'

chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
nm main.o | grep -q '^0* T main' && chk ok 'main is defined here: T' || chk FAIL 'no T main'
nm main.o | grep -q 'U puts' && chk ok 'and puts is only wanted: U' || chk FAIL 'no U puts'
ldd hi | grep -q 'libc.so.6' && chk ok 'the file names the library it needs' || chk FAIL 'no libc'
LD_DEBUG=bindings ./hi 2>&1 | grep -q "symbol .puts" \
  && chk ok 'and the address is settled only once it runs' || chk FAIL 'no binding line'
