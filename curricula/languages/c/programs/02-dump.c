#include <stdio.h>

void dump(const char *label, const void *obj, size_t n)
{
	const unsigned char *p = obj;

	printf("%-6s", label);
	for (size_t i = 0; i < n; i++)
		printf(" %02X", p[i]);
	printf("\n");
}

int main(void)
{
	int    i = 1;
	short  s = 1;
	char   c = 'A';
	float  f = 1.0f;
	double d = 1.0;

	dump("int",    &i, sizeof i);
	dump("short",  &s, sizeof s);
	dump("char",   &c, sizeof c);
	dump("float",  &f, sizeof f);
	dump("double", &d, sizeof d);
	return 0;
}
