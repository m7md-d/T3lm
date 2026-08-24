#include <stdio.h>
#include <string.h>

struct Cmd {
	const char *name;
	int         argc;
	void      (*run)(char **argv);
};

static void do_set(char **argv)  { printf("set %s = %s\n", argv[1], argv[2]); }
static void do_get(char **argv)  { printf("get %s\n", argv[1]); }
static void do_list(char **argv) { (void)argv; printf("list\n"); }

static const struct Cmd table[] = {
	{ "set",  3, do_set  },
	{ "get",  2, do_get  },
	{ "list", 1, do_list },
};

int main(void)
{
	char *a1[] = { "set", "name", "ali" };
	char *a2[] = { "list" };

	for (size_t i = 0; i < sizeof table / sizeof table[0]; i++) {
		if (strcmp(table[i].name, a1[0]) == 0)
			table[i].run(a1);
		if (strcmp(table[i].name, a2[0]) == 0)
			table[i].run(a2);
	}
	printf("%zu %zu\n", sizeof(struct Cmd), sizeof table);
	return 0;
}
