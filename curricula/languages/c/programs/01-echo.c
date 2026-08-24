//! pty
#include <stdio.h>
#include <string.h>

int main(void)
{
	char line[128];

	while (1) {
		printf("> ");
		fflush(stdout);
		if (fgets(line, sizeof line, stdin) == NULL)
			break;
		line[strcspn(line, "\n")] = '\0';
		printf("[%s]\n", line);
	}
	return 0;
}
