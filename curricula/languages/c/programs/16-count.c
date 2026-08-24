#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static long live = 0;

void *xmalloc(size_t n)
{
	live++;
	return malloc(n);
}

void xfree(void *p)
{
	if (p != NULL)
		live--;
	free(p);
}

char *copy(const char *s)
{
	char *p = xmalloc(strlen(s) + 1);

	strcpy(p, s);
	return p;
}

struct Item { char key[16]; char *value; };
struct Item table[8];
int items = 0;

void cmd_set(const char *key, const char *value)
{
	for (int i = 0; i < items; i++)
		if (strcmp(table[i].key, key) == 0) {
			table[i].value = copy(value);      /* والقديم؟ */
			return;
		}
	strcpy(table[items].key, key);
	table[items].value = copy(value);
	items++;
}

int main(void)
{
	cmd_set("x", "1");
	cmd_set("x", "2");
	cmd_set("x", "3");
	printf("قيمة x = %s\n", table[0].value);
	printf("حجزٌ حيّ = %ld\n", live);
	xfree(table[0].value);
	printf("بعد free = %ld\n", live);
	return 0;
}
