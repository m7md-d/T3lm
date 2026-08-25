#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

int main(void)
{
	pid_t mid = fork();

	if (mid == 0) {
		pid_t gc = fork();

		if (gc == 0) {
			sleep(1);
			_exit(0);
		}
		_exit(0);
	}
	waitpid(mid, NULL, 0);
	sleep(2);
	execlp("ps", "ps", "-o", "pid,ppid,stat,cmd", NULL);
	return 0;
}
