#!/bin/sh
set -e
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
T="-fsanitize=thread -O1 -g -pthread"
cc -std=c17 $T -o race   race.c
cc -std=c17 $T -o fixed  fixed.c
cc -std=c17 $T -o latent latent.c

verdict() {                         # يشغّل تحت الكاشف ويقول ماذا أبلغ
  out=$("$@" 2>&1 || true)
  if echo "$out" | grep -q 'ThreadSanitizer: data race'; then echo 'data race reported'
  else echo "silent, printed $(echo "$out" | tail -1)"; fi
}
echo '$ each program built with -fsanitize=thread'
printf '%-22s %s\n' 'race   (plain int)'   "$(verdict ./race)"
printf '%-22s %s\n' 'fixed  (_Atomic)'     "$(verdict ./fixed)"
printf '%-22s %s\n' 'latent 0 (path off)'  "$(verdict ./latent 0)"
printf '%-22s %s\n' 'latent 1 (path on)'   "$(verdict ./latent 1)"

./race   2>&1 | grep -q 'data race' && chk ok 'the detector reports the plain-int race' || chk FAIL 'race'
./fixed  2>&1 | grep -q 'data race' && chk FAIL 'atomic build reported a race' \
  || chk ok 'and stays quiet on the atomic build'
[ "$(./fixed 2>/dev/null)" = 200000 ] \
  && chk ok 'whose count is exact' || chk FAIL 'atomic count wrong'
./latent 0 2>&1 | grep -q 'data race' && chk FAIL 'latent 0 reported' \
  || chk ok 'the same binary is quiet when the racy path is not taken'
./latent 1 2>&1 | grep -q 'data race' \
  && chk ok 'and reports when it is' || chk FAIL 'latent 1 silent'
