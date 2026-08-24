#include <stdio.h>
#include <stdlib.h>

static void bye(void)  { printf("atexit 1\n"); }
static void bye2(void) { printf("atexit 2\n"); }

int main(void)
{
	atexit(bye);
	atexit(bye2);
	printf("EXIT_SUCCESS=%d EXIT_FAILURE=%d\n", EXIT_SUCCESS, EXIT_FAILURE);
	exit(3);
}
