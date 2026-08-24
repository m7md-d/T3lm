//! pty
#include <stdio.h>
#include <string.h>

#define MAX_WORDS 8

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
		for (int i = 0; i < n; i++)
			printf("%d: [%s]\n", i, words[i]);
	}
	return 0;
}
