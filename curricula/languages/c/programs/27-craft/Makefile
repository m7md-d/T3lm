CC      = cc
CFLAGS  = -std=c17 -Wall -Wextra -Iinclude -g
SANS    = -fsanitize=address,undefined

all: cmd

cmd: src/main.c src/table.c include/table.h
	$(CC) $(CFLAGS) src/main.c src/table.c -o cmd

test: tests/test_table.c src/table.c include/table.h
	$(CC) $(CFLAGS) $(SANS) tests/test_table.c src/table.c -o test
	./test

clean:
	rm -f cmd test
