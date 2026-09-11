#!/bin/sh
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -Wall -Wextra -o pie   where.c
cc -std=c17 -Wall -Wextra -no-pie -o nopie where.c

field() { echo "$1" | awk -v k="$2" '$1==k{print $2}'; }
verdict() {                       # يشغّل البرنامج مرّتين ويقارن الثلاثة
  a=$("$1"); b=$("$1"); out=""
  for k in image stack heap; do
    if [ "$(field "$a" $k)" = "$(field "$b" $k)" ]; then out="$out same"
    else out="$out differs"; fi
  done
  echo "$out"
}
pv=$(verdict ./pie); nv=$(verdict ./nopie)

echo '$ cat /proc/sys/kernel/randomize_va_space'
cat /proc/sys/kernel/randomize_va_space
echo '$ readelf -hW pie | grep Type ; readelf -hW nopie | grep Type'
readelf -hW pie   | grep Type | sed 's/^ *//'
readelf -hW nopie | grep Type | sed 's/^ *//'

echo
echo 'same binary, two runs:'
printf '%-8s %-9s %-9s %s\n' '' image stack heap
printf '%-8s %-9s %-9s %s\n' pie   $pv
printf '%-8s %-9s %-9s %s\n' nopie $nv
printf 'nopie image address, both runs: %s\n' "$(./nopie | awk '$1=="image"{print $2}')"

echo
echo '$ setarch -R ./pie'
setarch -R ./pie 2>&1 | sed -n 1p

[ "$(echo $pv | cut -d' ' -f1)" = differs ] \
  && chk ok 'the PIE image lands somewhere else on every run' || chk FAIL 'pie image'
[ "$(echo $nv | cut -d' ' -f1)" = same ] \
  && chk ok 'the non-PIE image lands where the linker wrote it' || chk FAIL 'nopie image'
[ "$(echo $pv | cut -d' ' -f2)" = differs ] && [ "$(echo $nv | cut -d' ' -f2)" = differs ] \
  && chk ok 'the stack moves in both' || chk FAIL 'stack'
[ "$(echo $pv | cut -d' ' -f3)" = differs ] && [ "$(echo $nv | cut -d' ' -f3)" = differs ] \
  && chk ok 'and so does the heap, even in the non-PIE build' || chk FAIL 'heap'
readelf -hW pie | grep -q 'DYN' && readelf -hW nopie | grep -q 'EXEC' \
  && chk ok 'the difference between them is the ELF type the linker chose' || chk FAIL 'type'
setarch -R ./pie >/dev/null 2>&1 \
  && chk FAIL 'the lab container allowed personality()' \
  || chk ok 'and this container refuses to turn randomization off'
