#!/bin/sh
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
kinds() { readelf -rW "$1" | awk '{print $3}' | grep '^R_' | sort -u | tr '\n' ' '; }
cc -std=c17 -Wall -Wextra -fPIC          -c -o g_pic.o  g.c
cc -std=c17 -Wall -Wextra -fno-pie -fno-PIC -c -o g_np.o g.c
cc -std=c17 -Wall -Wextra -fno-pie -fno-PIC -c -o leaf_np.o leaf.c

echo '$ readelf -rW g_pic.o   # -fPIC'
echo "  $(kinds g_pic.o)"
echo '$ readelf -rW g_np.o    # -fno-pie -fno-PIC'
echo "  $(kinds g_np.o)"

echo
echo '$ cc -shared -o g.so g_np.o'
cc -shared -o g.so g_np.o 2>e.txt
sed 's|/usr/bin/ld:|ld:|' e.txt | sed -n 1p

echo
echo '$ cc -shared -o leaf.so leaf_np.o     # المصدر نفسُه بلا رمزِ بياناتٍ عامّ'
if cc -shared -o leaf.so leaf_np.o 2>/dev/null; then echo '  (linked)'; fi

kinds g_pic.o | grep -q 'R_AARCH64_ADR_GOT_PAGE' \
  && chk ok '-fPIC reaches the global through the GOT' || chk FAIL 'no GOT reloc'
kinds g_np.o | grep -q 'R_AARCH64_ADR_PREL_PG_HI21' \
  && chk ok 'without it the address is formed directly' || chk FAIL 'no direct reloc'
grep -q 'recompile with -fPIC' e.txt \
  && chk ok 'and the linker refuses that relocation in a shared object' \
  || chk FAIL 'link did not fail as expected'
[ -f leaf.so ] \
  && chk ok 'yet a non-PIC object with no global data reference links fine' \
  || chk FAIL 'leaf.so did not link'
