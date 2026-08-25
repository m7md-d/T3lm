#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

/* يتفرّع حتى يُمنَع، ثم يقول عند أي رقمٍ مُنِع وبأي خطأ. */
int main(void)
{
	int n = 0;

	for (;;) {
		pid_t p = fork();

		if (p == 0) {
			pause();
			_exit(0);
		}
		if (p < 0) {
			printf("fork #%d failed: %s\n", n + 1, strerror(errno));
			fflush(stdout);
			return 0;
		}
		n++;
	}
}
