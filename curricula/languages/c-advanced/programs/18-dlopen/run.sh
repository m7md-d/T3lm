#!/bin/sh
set -e
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -Wall -Wextra -fPIC -shared -o libplug.so plug.c
cc -std=c17 -Wall -Wextra -o probe probe.c

echo '$ readelf -dW probe | grep NEEDED'
readelf -dW probe | grep NEEDED | sed 's/^ *//'
echo '$ ./probe'
./probe

out=$(./probe)
echo "$out" | grep -q 'before dlopen: mapped=0' \
  && chk ok 'the plugin is absent from the address space at start' || chk FAIL 'before'
echo "$out" | grep -q 'after  dlopen: mapped=1' \
  && chk ok 'dlopen maps a file that no NEEDED entry names' || chk FAIL 'after'
echo "$out" | grep -q 'add(3,4) = 7' \
  && chk ok 'dlsym returned an address that calls correctly' || chk FAIL 'call'
echo "$out" | grep -q 'dlsym(nope) = (nil)' \
  && chk ok 'a missing name returns a null pointer and a message' || chk FAIL 'miss'
echo "$out" | grep -q 'after  dlclose: mapped=0' \
  && chk ok 'and this implementation unmapped it on dlclose' || chk FAIL 'close'
readelf -dW probe | grep -q libplug \
  && chk FAIL 'the plugin leaked into NEEDED' \
  || chk ok 'the host file never names the plugin'
