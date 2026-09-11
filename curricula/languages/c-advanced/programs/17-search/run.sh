#!/bin/sh
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
mkdir -p lib other                 # حتى يُبنى المجلّد في نسخةٍ جديدة من المستودع
cc -std=c17 -fPIC -shared -DWHERE='"lib/"'   -o lib/libgreet.so   greet.c
cc -std=c17 -fPIC -shared -DWHERE='"other/"' -o other/libgreet.so greet.c
cc -std=c17 -Wall -Wextra -o prog  main.c -Llib -lgreet
cc -std=c17 -Wall -Wextra -o progr main.c -Llib -lgreet -Wl,-rpath,'$ORIGIN/lib'
cc -std=c17 -Wall -Wextra -o progo main.c -Llib -lgreet \
   -Wl,--disable-new-dtags -Wl,-rpath,'$ORIGIN/lib'

echo '$ ./prog'
./prog 2>&1 | sed 's|^\./prog|prog|'
echo '$ LD_LIBRARY_PATH=lib ./prog'
LD_LIBRARY_PATH=lib ./prog
echo
echo '$ readelf -dW progr | grep -E "RPATH|RUNPATH"'
readelf -dW progr | grep -E 'RPATH|RUNPATH' | sed 's/^ *//'
echo '$ ./progr'
./progr
echo '$ LD_LIBRARY_PATH=other ./progr'
LD_LIBRARY_PATH=other ./progr
echo
echo '$ readelf -dW progo | grep -E "RPATH|RUNPATH"     # --disable-new-dtags'
readelf -dW progo | grep -E 'RPATH|RUNPATH' | sed 's/^ *//'
echo '$ LD_LIBRARY_PATH=other ./progo'
LD_LIBRARY_PATH=other ./progo

./prog 2>/dev/null || chk ok 'with the name alone the loader cannot find it'
[ "$(LD_LIBRARY_PATH=lib ./prog)" = "greet: from lib/" ] \
  && chk ok 'LD_LIBRARY_PATH tells the loader where to look' || chk FAIL 'env path'
readelf -dW progr | grep -q RUNPATH \
  && chk ok 'the -rpath flag left a RUNPATH entry in the file' || chk FAIL 'no RUNPATH'
[ "$(./progr)" = "greet: from lib/" ] \
  && chk ok 'and that entry alone is enough to find it' || chk FAIL 'runpath run'
[ "$(LD_LIBRARY_PATH=other ./progr)" = "greet: from other/" ] \
  && chk ok 'but LD_LIBRARY_PATH is searched before RUNPATH' || chk FAIL 'precedence'
readelf -dW progo | grep -q '(RPATH)' \
  && chk ok 'the old tag produces RPATH instead' || chk FAIL 'no RPATH'
[ "$(LD_LIBRARY_PATH=other ./progo)" = "greet: from lib/" ] \
  && chk ok 'and RPATH is searched before LD_LIBRARY_PATH' || chk FAIL 'rpath precedence'
