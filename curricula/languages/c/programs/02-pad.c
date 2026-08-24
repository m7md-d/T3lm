#include <stdio.h>
#include <string.h>

struct Item {
	char  key[6];
	int   n;
};

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
	struct Item it;

	memset(&it, 0xAA, sizeof it);
	strcpy(it.key, "ab");
	it.n = 1;

	printf("6 + 4 = 10، والحجم = %zu\n", sizeof it);
	dump("item", &it, sizeof it);
	return 0;
}
