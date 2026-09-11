#!/bin/sh
set -e
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -Wall -Wextra -pthread -D_POSIX_C_SOURCE=200809L -o plain cond.c
cc -std=c17 -Wall -Wextra -pthread -D_POSIX_C_SOURCE=200809L -fsanitize=thread -O1 -g -o tsan cond.c
echo '$ ./cond'
./plain
echo
echo '$ ./cond built with -fsanitize=thread'
out=$(./tsan 2>&1)
if echo "$out" | grep -q 'ThreadSanitizer'; then echo "$out" | grep 'ThreadSanitizer' | head -2
else echo 'ThreadSanitizer: nothing reported'; fi

echo "$out" | grep -q 'ThreadSanitizer: data race' \
  && chk FAIL 'the detector found a data race' \
  || chk ok 'the detector finds no data race in either round'
