#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void)
{
	pid_t mid = fork();

	if (mid == 0) {
		pid_t gc = fork();

		if (gc == 0) {
			sleep(1);
			printf("الحفيد استيقظ: أبوه الآن %d\n", getppid());
			return 0;
		}
		printf("الابن الوسيط %d يخرج فوراً، حفيده %d يبقى\n", getpid(), gc);
		return 0;
	}
	printf("أنا PID %d\n", getpid());
	waitpid(mid, NULL, 0);
	sleep(2);
	return 0;
}
