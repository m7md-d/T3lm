cc -std=c17 -c main.c -o main.o
cc main.o -o prog 2>&1 | sed 's/ for architecture .*//'
