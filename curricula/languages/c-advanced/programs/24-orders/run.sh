#!/bin/sh
set -e
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -Wall -Wextra -O2 -c -o orders.o orders.c

insn() {   # التعليمة الحاملة للمعنى في هذه الدالّة
  objdump -d --disassemble="$1" orders.o \
  | grep -oE '(__aarch64_[a-z0-9_]+|\b(ldar|ldaxr|ldxr|ldr|stlr|stlxr|stxr|str|ldadd[a-z]*)\b|dmb[[:space:]]+[a-z]+)' \
  | head -1 | tr '\t' ' '
}
echo '$ objdump -d orders.o   — the instruction each order asked for'
for f in ld_relaxed ld_consume ld_acquire ld_seqcst \
         st_relaxed st_release st_seqcst \
         rmw_relaxed rmw_acqrel rmw_seqcst \
         fence_release fence_acquire fence_seqcst; do
  printf '%-14s %s\n' "$f" "$(insn $f)"
done

[ "$(insn ld_relaxed)" = ldr ] \
  && chk ok 'a relaxed load asks for a plain load' || chk FAIL 'ld_relaxed'
[ "$(insn ld_acquire)" = ldar ] \
  && chk ok 'an acquire load asks for the ordered load' || chk FAIL 'ld_acquire'
[ "$(insn ld_consume)" = "$(insn ld_acquire)" ] \
  && chk ok 'consume compiled to exactly what acquire compiled to' || chk FAIL 'consume'
[ "$(insn st_relaxed)" = str ] \
  && chk ok 'a relaxed store asks for a plain store' || chk FAIL 'st_relaxed'
[ "$(insn st_release)" = stlr ] \
  && chk ok 'a release store asks for the ordered store' || chk FAIL 'st_release'
[ "$(insn rmw_relaxed)" != "$(insn rmw_seqcst)" ] \
  && chk ok 'the two read-modify-writes resolve to different routines' \
  || chk FAIL 'rmw same'
case "$(insn fence_acquire)" in *ishld*) chk ok 'an acquire fence asks for a narrower barrier than a full one';; *) chk FAIL 'fence_acquire';; esac
