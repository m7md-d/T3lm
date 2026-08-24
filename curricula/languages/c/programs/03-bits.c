#include <stdio.h>
#include <limits.h>

void bits(const char *label, int v)
{
	unsigned int u = (unsigned int)v;

	printf("%-8s", label);
	for (int i = 31; i >= 0; i--) {
		printf("%d", (u >> i) & 1);
		if (i % 8 == 0)
			printf(" ");
	}
	printf("= %d\n", v);
}

int main(void)
{
	bits("0", 0);
	bits("1", 1);
	bits("-1", -1);
	bits("-2", -2);
	bits("INT_MAX", INT_MAX);
	bits("INT_MIN", INT_MIN);
	return 0;
}
