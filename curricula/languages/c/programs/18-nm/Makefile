CC     = cc
CFLAGS = -std=c17 -Wall -Wextra

cmd: main.o table.o
	$(CC) main.o table.o -o cmd

main.o: main.c table.h
	$(CC) $(CFLAGS) -c main.c

table.o: table.c table.h
	$(CC) $(CFLAGS) -c table.c

clean:
	rm -f *.o cmd
