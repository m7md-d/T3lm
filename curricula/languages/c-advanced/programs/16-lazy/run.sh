#!/bin/sh
set -e
chk() { printf 'assert %s  %s\n' "$1" "$2" >&2; }
cc -std=c17 -Wall -Wextra -fPIC -shared -o libgreet.so greet.c
cc -std=c17 -Wall -Wextra -o prog main.c -L. -lgreet
export LD_LIBRARY_PATH=.
keep() { grep -E "MARK|greet: from|symbol .greet" "$1" \
         | sed -E 's/^[[:space:]]*[0-9]+:[[:space:]]*//'; }

LD_DEBUG=bindings ./prog > lazy.log 2>&1
LD_BIND_NOW=1 LD_DEBUG=bindings ./prog > now.log 2>&1

echo '$ LD_DEBUG=bindings ./prog'
keep lazy.log
echo
echo '$ LD_BIND_NOW=1 LD_DEBUG=bindings ./prog'
keep now.log

pos() { keep "$1" | grep -n "$2" | head -1 | cut -d: -f1; }
l_mark=$(pos lazy.log 'MARK: before'); l_bind=$(pos lazy.log "symbol .greet")
n_mark=$(pos now.log  'MARK: before'); n_bind=$(pos now.log  "symbol .greet")
[ "$l_bind" -gt "$l_mark" ] \
  && chk ok 'by default greet is bound after the call that needed it' \
  || chk FAIL "lazy: bind at $l_bind, mark at $l_mark"
[ "$n_bind" -lt "$n_mark" ] \
  && chk ok 'with LD_BIND_NOW it is bound before main runs' \
  || chk FAIL "now: bind at $n_bind, mark at $n_mark"
[ "$(keep lazy.log | grep -c "symbol .greet")" -eq 1 ] \
  && chk ok 'and the second call binds nothing: the GOT slot already holds it' \
  || chk FAIL 'bound more than once'
