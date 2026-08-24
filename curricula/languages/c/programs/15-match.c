#include <stdio.h>

int match(const char *p, const char *s)
{
	if (*p == '\0')
		return *s == '\0';
	if (*p == '*')
		return match(p + 1, s) || (*s != '\0' && match(p, s + 1));
	if (*s != '\0' && (*p == '?' || *p == *s))
		return match(p + 1, s + 1);
	return 0;
}

int main(void)
{
	const char *cases[][2] = {
		{ "*.c",     "main.c"   },
		{ "*.c",     "main.h"   },
		{ "m?in.c",  "main.c"   },
		{ "*",       ""         },
		{ "a*b*c",   "axxbyyc"  },
	};

	for (size_t i = 0; i < sizeof cases / sizeof cases[0]; i++)
		printf("%-8s %-8s %d\n", cases[i][0], cases[i][1],
		       match(cases[i][0], cases[i][1]));
	return 0;
}
