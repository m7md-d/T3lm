#include <stdio.h>
#include <stdlib.h>

#define MB (1L << 20)

/* يخصّص ثم يلمس صفحةً صفحة — والفرق بين الخطوتين هو الدرس. */
int main(int argc, char **argv)
{
	long  want, i;
	char *p;

	if (argc < 2) {
		fprintf(stderr, "eat <MB>\n");
		return 2;
	}
	want = atol(argv[1]) * MB;
	p = malloc(want);
	printf("malloc: %s\n", p ? "ok" : "NULL");
	fflush(stdout);
	if (!p)
		return 1;

	for (i = 0; i < want; i += 4096) {
		p[i] = 1;
		if ((i & (32 * MB - 1)) == 0 && i) {
			printf("touched: %ldM\n", i / MB);
			fflush(stdout);
		}
	}
	printf("done: %ldM\n", want / MB);
	return 0;
}
