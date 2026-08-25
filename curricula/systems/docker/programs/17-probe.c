#define _GNU_SOURCE
#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <sys/syscall.h>
#include <unistd.h>

/* ينادي أربعة نداءاتٍ نادرة، ويقول ماذا ردّت النواة على كلٍّ منها. */
static void try(const char *name, long r)
{
	printf("%-16s %s\n", name, r != -1 ? "ok" : strerror(errno));
}

int main(void)
{
	try("keyctl", syscall(SYS_keyctl, 0, 0, 0, 0, 0));
	try("add_key", syscall(SYS_add_key, "user", "k", "v", 1, -2));
	try("perf_event_open", syscall(SYS_perf_event_open, NULL, 0, -1, -1, 0));
	try("userfaultfd", syscall(SYS_userfaultfd, 0));
	return 0;
}
