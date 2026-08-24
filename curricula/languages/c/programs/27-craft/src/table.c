#include <stdlib.h>
#include <string.h>

#include "table.h"

enum { TABLE_CAP = 64, KEY_MAX = 32 };

struct Entry {
	char  key[KEY_MAX];
	char *value;
};

struct Table {
	struct Entry entries[TABLE_CAP];
	size_t       len;
};

static struct Entry *find(const struct Table *t, const char *key)
{
	for (size_t i = 0; i < t->len; i++)
		if (strcmp(t->entries[i].key, key) == 0)
			return (struct Entry *)&t->entries[i];
	return NULL;
}

static char *dup_str(const char *s)
{
	size_t n = strlen(s) + 1;
	char  *p = malloc(n);

	if (p != NULL)
		memcpy(p, s, n);
	return p;
}

Table *table_new(void)
{
	return calloc(1, sizeof(Table));
}

void table_free(Table *t)
{
	if (t == NULL)
		return;
	for (size_t i = 0; i < t->len; i++)
		free(t->entries[i].value);
	free(t);
}

int table_set(Table *t, const char *key, const char *value)
{
	struct Entry *e = find(t, key);
	char         *copy;

	if (strlen(key) >= KEY_MAX)
		return -1;
	if (e == NULL && t->len == TABLE_CAP)
		return -1;

	copy = dup_str(value);
	if (copy == NULL)
		return -1;

	if (e == NULL) {
		e = &t->entries[t->len++];
		memcpy(e->key, key, strlen(key) + 1);
	} else {
		free(e->value);
	}
	e->value = copy;
	return 0;
}

const char *table_get(const Table *t, const char *key)
{
	const struct Entry *e = find(t, key);

	return e == NULL ? NULL : e->value;
}

int table_del(Table *t, const char *key)
{
	struct Entry *e = find(t, key);

	if (e == NULL)
		return -1;
	free(e->value);
	*e = t->entries[--t->len];
	return 0;
}

size_t table_len(const Table *t)
{
	return t->len;
}
