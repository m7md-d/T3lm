#!/bin/sh
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -fPIC -shared -o libgreet.so greet.c
cc -std=c17 -fPIC -shared -o libfake.so  fake.c
cc -std=c17 -Wall -Wextra -o prog main.c -L. -lgreet -Wl,-rpath,'$ORIGIN'
cc -std=c17 -Wall -Wextra -c -o greet_s.o greet.c && ar rcs libgs.a greet_s.o
cc -std=c17 -Wall -Wextra -static -o stat main.c -L. -lgs

echo '$ ./prog'
./prog
echo '$ LD_PRELOAD=./libfake.so ./prog'
LD_PRELOAD=./libfake.so ./prog
echo '$ readelf -dW prog | grep NEEDED'
readelf -dW prog | grep NEEDED | sed 's/^ *//'
echo
echo '$ LD_PRELOAD=./libfake.so ./stat'
LD_PRELOAD=./libfake.so ./stat

[ "$(./prog)" = "greet: the one it was linked against" ] \
  && chk ok 'without the variable the linked definition answers' || chk FAIL 'plain'
[ "$(LD_PRELOAD=./libfake.so ./prog)" = "greet: the one that was preloaded" ] \
  && chk ok 'LD_PRELOAD puts another definition ahead of it' || chk FAIL 'preload'
readelf -dW prog | grep -q 'libgreet.so' \
  && chk ok 'and the file itself still names only the library it was linked against' \
  || chk FAIL 'needed'
[ "$(LD_PRELOAD=./libfake.so ./stat)" = "greet: the one it was linked against" ] \
  && chk ok 'the static binary ignores the variable: no loader reads it' || chk FAIL 'static'
