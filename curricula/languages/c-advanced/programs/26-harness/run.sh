#!/bin/sh
set -e
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
for s in naked locked sharded; do
  cc -std=c17 -Wall -Wextra -O2 -pthread -o "$s" stress.c "$s.c"
done
cc -std=c17 -Wall -Wextra -O1 -g -pthread -fsanitize=thread -o naked_t stress.c naked.c

echo '$ ./stress <subject>    4 threads, 300000 ops each, sizes 16..512'
if out=$(timeout 25 sh -c './naked naked' 2>/dev/null); then
  echo "$out"
  naked_ok=$(echo "$out" | sed 's/.*errors \([0-9]*\).*/\1/')
else
  rc=$?
  [ "$rc" = 124 ] && why='it never finished' || why="the run died (exit $rc)"
  echo "naked     rejected: $why"
  naked_ok=dead
fi
./locked  locked
./sharded sharded

echo
echo '$ ./naked built with -fsanitize=thread'
TSAN_OPTIONS=halt_on_error=1 timeout 40 ./naked_t naked >tsan.log 2>&1 || true
grep -q 'ThreadSanitizer: data race' tsan.log \
  && echo 'ThreadSanitizer: data race reported' \
  || echo 'ThreadSanitizer: nothing reported'

[ "$naked_ok" != 0 ] \
  && chk ok 'the harness rejects the unsynchronised subject' || chk FAIL 'naked passed'
grep -q 'ThreadSanitizer: data race' tsan.log \
  && chk ok 'and the detector names it a data race' || chk FAIL 'tsan silent on naked'
./locked locked | grep -q 'errors 0  leftover 0 KB' \
  && chk ok 'the one-lock baseline passes with nothing leaked' || chk FAIL 'locked'
./sharded sharded | grep -q 'errors 0  leftover 0 KB' \
  && chk ok 'and so does the sharded one' || chk FAIL 'sharded'
l=$(./locked locked  | sed 's/.*ms *\([0-9]*\) KB from os.*/\1/')
s=$(./sharded sharded | sed 's/.*ms *\([0-9]*\) KB from os.*/\1/')
[ "$s" -gt "$l" ] \
  && chk ok 'sharding holds more memory from the system than one lock does' \
  || chk FAIL "memory: locked $l sharded $s"
