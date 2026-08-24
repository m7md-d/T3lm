//! pty
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_ITEMS 64
#define MAX_WORDS 8

struct Item {
	char  key[16];
	char *value;
};

struct Item table[MAX_ITEMS];
int items = 0;

int split(char *line, char **words)
{
	int n = 0;
	char *p = line;

	while (*p != '\0' && n < MAX_WORDS) {
		while (*p == ' ')
			p++;
		if (*p == '\0')
			break;
		words[n] = p;
		n++;
		while (*p != '\0' && *p != ' ')
			p++;
		if (*p == ' ') {
			*p = '\0';
			p++;
		}
	}
	return n;
}

struct Item *find(char *key)
{
	for (int i = 0; i < items; i++)
		if (strcmp(table[i].key, key) == 0)
			return &table[i];
	return NULL;
}

char *copy(char *s)
{
	char *p = malloc(strlen(s) + 1);
	strcpy(p, s);
	return p;
}

void cmd_set(char *key, char *value)
{
	struct Item *it = find(key);

	if (it == NULL) {
		it = &table[items];
		items++;
		strcpy(it->key, key);
	}
	it->value = copy(value);
}

void cmd_get(char *key)
{
	struct Item *it = find(key);

	if (it == NULL)
		printf("(none)\n");
	else
		printf("%s\n", it->value);
}

void cmd_del(char *key)
{
	struct Item *it = find(key);

	if (it == NULL)
		return;
	free(it->value);
	*it = table[items - 1];
	items--;
}

void cmd_list(void)
{
	for (int i = 0; i < items; i++)
		printf("%-8s %s\n", table[i].key, table[i].value);
}

int main(void)
{
	char  line[128];
	char *words[MAX_WORDS];

	while (1) {
		printf("> ");
		fflush(stdout);
		if (fgets(line, sizeof line, stdin) == NULL)
			break;
		line[strcspn(line, "\n")] = '\0';

		int n = split(line, words);
		if (n == 0)
			continue;

		if (strcmp(words[0], "set") == 0 && n == 3)
			cmd_set(words[1], words[2]);
		else if (strcmp(words[0], "get") == 0 && n == 2)
			cmd_get(words[1]);
		else if (strcmp(words[0], "del") == 0 && n == 2)
			cmd_del(words[1]);
		else if (strcmp(words[0], "list") == 0)
			cmd_list();
		else if (strcmp(words[0], "quit") == 0)
			break;
		else
			printf("?\n");
	}
	return 0;
}
