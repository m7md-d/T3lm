#include <assert.h>
#include <stdio.h>
#include <string.h>

#include "table.h"

static int checks = 0;

#define CHECK(cond)                                                  \
	do {                                                         \
		checks++;                                            \
		if (!(cond)) {                                       \
			printf("فشل %s:%d: %s\n", __FILE__,          \
			       __LINE__, #cond);                     \
			return 1;                                    \
		}                                                    \
	} while (0)

int main(void)
{
	Table *t = table_new();

	CHECK(t != NULL);
	CHECK(table_len(t) == 0);
	CHECK(table_get(t, "x") == NULL);

	CHECK(table_set(t, "name", "ali") == 0);
	CHECK(table_len(t) == 1);
	CHECK(strcmp(table_get(t, "name"), "ali") == 0);

	CHECK(table_set(t, "name", "sara") == 0);
	CHECK(table_len(t) == 1);
	CHECK(strcmp(table_get(t, "name"), "sara") == 0);

	CHECK(table_set(t, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "x") == -1);

	CHECK(table_del(t, "name") == 0);
	CHECK(table_del(t, "name") == -1);
	CHECK(table_len(t) == 0);

	table_free(t);
	table_free(NULL);

	printf("نجح %d فحصاً\n", checks);
	return 0;
}
