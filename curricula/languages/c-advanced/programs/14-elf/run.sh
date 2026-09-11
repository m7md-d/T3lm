#!/bin/sh
set -e
cc -std=c17 -Wall -Wextra -o elfread elfread.c

echo '$ ./elfread ./elfread'
./elfread ./elfread

echo
echo '$ readelf -h elfread | grep -E "Type|Machine|Entry|Number of"'
readelf -h elfread | grep -E 'Type|Machine|Entry|Number of' | sed 's/^ *//'
echo '$ readelf -SW elfread | grep -E " \.text| \.bss"'
readelf -SW elfread | grep -E ' \.text| \.bss' | sed 's/^ *//'

# ما قرأناه بأنفسنا مقابل ما تقوله الأداة
mine=$(./elfread ./elfread 2>/dev/null)
hex() { echo "$1" | tr 'A-F' 'a-f' | sed 's/^0x//; s/^0*//; s/^$/0/'; }
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cmp2() {
  if [ "$(hex "$2")" = "$(hex "$3")" ]; then chk ok "$1"; else
    chk FAIL "$1: ours=$2 readelf=$3"; fi
}

cmp2 "entry matches readelf" \
  "$(echo "$mine" | awk '/^  entry/{print $2}')" \
  "$(readelf -h elfread | awk '/Entry point/{print $NF}')"
cmp2 "phnum matches readelf" \
  "$(echo "$mine" | awk '/^  phoff/{print $4}')" \
  "$(readelf -h elfread | awk '/Number of program headers/{print $5}')"
cmp2 "shnum matches readelf" \
  "$(echo "$mine" | awk '/^  shoff/{print $4}')" \
  "$(readelf -h elfread | awk '/Number of section headers/{print $5}')"
cmp2 ".bss size matches readelf" \
  "$(echo "$mine" | awk '$1==".bss"&&$2=="NOBITS"{print $4}')" \
  "$(readelf -SW elfread | awk '$2==".bss"{print $6}')"
cmp2 ".bss address matches readelf" \
  "$(echo "$mine" | awk '$1==".bss"&&$2=="NOBITS"{print $5}')" \
  "$(readelf -SW elfread | awk '$2==".bss"{print $4}')"
