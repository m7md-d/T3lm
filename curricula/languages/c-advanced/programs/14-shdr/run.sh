#!/bin/sh
set -e
cc -std=c17 -Wall -Wextra -o hello hello.c
cc -std=c17 -Wall -Wextra -o zeroshdr zeroshdr.c
cp hello blind
./zeroshdr blind
chmod +x blind

echo '$ ./hello   ;   ./blind'
a=$(./hello); b=$(./blind)
echo "$a"
echo "$b"

echo
printf 'sections   hello %s   blind %s\n' \
  "$(readelf -SW hello  | grep -c '^  \[')" \
  "$(readelf -SW blind  | grep -c '^  \[' || true)"
printf 'PT_LOAD    hello %s   blind %s\n' \
  "$(readelf -lW hello | grep -c '^  LOAD')" \
  "$(readelf -lW blind | grep -c '^  LOAD')"
printf 'file size  hello %s   blind %s   (bytes, unchanged)\n' \
  "$(wc -c < hello)" "$(wc -c < blind)"
echo
echo '$ readelf -SW blind | head -2'
readelf -SW blind 2>&1 | head -2

chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
[ "$a" = "$b" ] && chk ok 'the binary with no section table still runs, same output' \
                || chk FAIL 'blind output differs'
[ "$(readelf -SW blind | grep -c '^  \[')" -eq 0 ] \
  && chk ok 'readelf finds no sections in it' || chk FAIL 'sections remain'
[ "$(readelf -lW hello | grep -c '^  LOAD')" \
  -eq "$(readelf -lW blind | grep -c '^  LOAD')" ] \
  && chk ok 'the PT_LOAD segments are untouched' || chk FAIL 'segments changed'
readelf -SW hello | grep -q '\.symtab' \
  && chk ok 'hello still carries .symtab' || chk FAIL 'no symtab in hello'
