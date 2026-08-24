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
		words[n++] = p;
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
	char  line[] = "set name ali";
	char *words[MAX_WORDS];
	int   n = split(line, words);

	for (int i = 0; i < n; i++)
		printf("%td ", words[i] - line);
	printf("\n");
	line[4] = 'X';
	printf("[%s]\n", words[1]);
	return 0;
}
