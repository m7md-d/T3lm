#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "table.h"

struct Item {
	char  key[16];
	char *value;
};

static struct Item items[64];
static int         used = 0;

static struct Item *find(const char *key)
{
	for (int i = 0; i < used; i++)
		if (strcmp(items[i].key, key) == 0)
			return &items[i];
	return NULL;
}

void table_set(const char *key, const char *value)
{
	struct Item *it = find(key);

	if (it == NULL) {
		it = &items[used++];
		snprintf(it->key, sizeof it->key, "%s", key);
	}
	free(it->value);
	it->value = malloc(strlen(value) + 1);
	strcpy(it->value, value);
}

const char *table_get(const char *key)
{
	struct Item *it = find(key);

	return it == NULL ? NULL : it->value;
}

int table_count(void)
{
	return used;
}
