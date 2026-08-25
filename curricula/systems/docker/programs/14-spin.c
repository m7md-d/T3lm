#include <stdio.h>
#include <stdlib.h>
#include <time.h>

/* شغلٌ ثابتٌ يُقاس زمنه — الفرق بين تشغيلين هو ما يقيسه الإقليم. */
int main(int argc, char **argv)
{
	long            n, i;
	volatile double x = 0;
	struct timespec a, b;

	if (argc < 2) {
		fprintf(stderr, "spin <Mloops>\n");
		return 2;
	}
	n = atol(argv[1]) * 1000000L;
	clock_gettime(CLOCK_MONOTONIC, &a);
	for (i = 0; i < n; i++)
		x += 1.0;
	clock_gettime(CLOCK_MONOTONIC, &b);
	printf("%.0f\n", (b.tv_sec - a.tv_sec) * 1e3 + (b.tv_nsec - a.tv_nsec) / 1e6);
	return 0;
}
