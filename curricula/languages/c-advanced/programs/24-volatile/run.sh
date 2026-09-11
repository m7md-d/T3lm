#!/bin/sh
set -e
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
T="-fsanitize=thread -O1 -g -pthread"
cc -std=c17 -Wall -Wextra $T -o vol_t  vol.c
cc -std=c17 -Wall -Wextra $T -o atom_t atom.c
cc -std=c17 -Wall -Wextra -O2 -pthread -o vol  vol.c
cc -std=c17 -Wall -Wextra -O2 -pthread -o atom atom.c

verdict() { out=$("$@" 2>&1 || true)
  if echo "$out" | grep -q 'ThreadSanitizer: data race'; then echo 'data race reported'
  else echo "silent, printed $(echo "$out" | tail -1)"; fi; }

echo '$ under -fsanitize=thread'
printf '%-22s %s\n' 'volatile int' "$(verdict ./vol_t)"
printf '%-22s %s\n' '_Atomic int'  "$(verdict ./atom_t)"
echo
echo '$ without the detector, two threads x 100000 increments'
printf '%-22s %s\n' 'volatile int' "$(./vol)"
printf '%-22s %s\n' '_Atomic int'  "$(./atom)"

./vol_t 2>&1 | grep -q 'data race' \
  && chk ok 'volatile did not stop it from being a data race' || chk FAIL 'vol'
./atom_t 2>&1 | grep -q 'data race' && chk FAIL 'atomic reported' \
  || chk ok '_Atomic did' 
[ "$(./atom)" = 200000 ] && chk ok 'and only the atomic build counts correctly' \
  || chk FAIL 'atomic count'
