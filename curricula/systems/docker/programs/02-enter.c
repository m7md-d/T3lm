#define _GNU_SOURCE
#include <fcntl.h>
#include <sched.h>
#include <stdio.h>
#include <unistd.h>

int main(int argc, char **argv)
{
	int fd;

	if (argc < 3) {
		fprintf(stderr, "enter <ns-file> <cmd>...\n");
		return 2;
	}
	fd = open(argv[1], O_RDONLY);
	if (fd == -1) {
		perror(argv[1]);
		return 1;
	}
	if (setns(fd, 0) == -1) {
		perror("setns");
		return 1;
	}
	execvp(argv[2], argv + 2);
	perror(argv[2]);
	return 1;
}
