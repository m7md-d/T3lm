#!/bin/sh
set -e
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -Wall -Wextra -fPIC -shared -o p_old.so p_old.c
cc -std=c17 -Wall -Wextra -fPIC -shared -o p_new.so p_new.c
cc -std=c17 -Wall -Wextra -o host host.c

echo '$ nm -D p_old.so p_new.so | grep get_api'
nm -D p_old.so | grep get_api | sed 's/^/p_old.so: /'
nm -D p_new.so | grep get_api | sed 's/^/p_new.so: /'
echo
echo '$ ./host'
./host

out=$(./host)
echo "$out" | grep -q 'p_old.so   refused' \
  && chk ok 'the host refuses the plugin built against the older struct' || chk FAIL 'old accepted'
echo "$out" | grep -q 'p_new.so   add(3,4)=7  mul(3,4)=12' \
  && chk ok 'and calls both entries of the matching one' || chk FAIL 'new call'
[ "$(echo "$out" | awk '$1=="./p_old.so"&&$2=="version"{print $5}')" \
  != "$(echo "$out" | awk '$1=="./p_new.so"&&$2=="version"{print $5}')" ] \
  && chk ok 'the two plugins export the same name over different layouts' || chk FAIL 'sizes equal'
