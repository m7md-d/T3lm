#include <stdio.h>
#include <unistd.h>
#include <sys/ipc.h>
#include <sys/msg.h>

int main(void)
{
	int id = msgget(IPC_PRIVATE, IPC_CREAT | 0600);

	printf("أنشأتُ طابوراً: %d\n", id);
	sleep(3);
	return 0;
}
