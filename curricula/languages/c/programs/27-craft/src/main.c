#include <stdio.h>

#include "table.h"

int main(void)
{
	Table *t = table_new();

	if (t == NULL) {
		fprintf(stderr, "لا ذاكرة\n");
		return 1;
	}
	if (table_set(t, "lang", "c") != 0) {
		fprintf(stderr, "تعذّر الحفظ\n");
		table_free(t);
		return 1;
	}
	printf("%s %zu\n", table_get(t, "lang"), table_len(t));
	table_free(t);
	return 0;
}
