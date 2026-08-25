#define _GNU_SOURCE
#include <errno.h>
#include <linux/audit.h>
#include <linux/filter.h>
#include <linux/seccomp.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>
#include <sys/prctl.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <unistd.h>

#ifndef AUDIT_ARCH_NATIVE
# if defined(__aarch64__)
#  define AUDIT_ARCH_NATIVE AUDIT_ARCH_AARCH64
# elif defined(__x86_64__)
#  define AUDIT_ARCH_NATIVE AUDIT_ARCH_X86_64
# else
#  error "أضف معماريتك"
# endif
#endif

/* مرشّحٌ من أربع تعليمات: يمنع mkdirat وحده، ويترك ما سواه.
 * والوسيط يختار **كيف** يمنع: بخطأ أم بقتل. */
int main(int argc, char **argv)
{
	int kill = argc > 1 && !strcmp(argv[1], "kill");

	struct sock_filter code[] = {
		/* ١. تحقّق من المعمارية — بلا هذا يُلتَفّ على المرشّح */
		BPF_STMT(BPF_LD | BPF_W | BPF_ABS, offsetof(struct seccomp_data, arch)),
		BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, AUDIT_ARCH_NATIVE, 1, 0),
		BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_KILL_PROCESS),
		/* ٢. حمّل رقم النداء، وقارنه */
		BPF_STMT(BPF_LD | BPF_W | BPF_ABS, offsetof(struct seccomp_data, nr)),
		BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, __NR_mkdirat, 0, 1),
		BPF_STMT(BPF_RET | BPF_K, 0),   /* يُملأ أدناه */
		BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ALLOW),
	};
	struct sock_fprog prog = {
		.len = sizeof code / sizeof code[0],
		.filter = code,
	};

	code[5].k = kill ? SECCOMP_RET_KILL_PROCESS
	                 : (SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA));

	if (prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) == -1) {
		perror("no_new_privs");
		return 1;
	}
	if (prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &prog) == -1) {
		perror("seccomp");
		return 1;
	}

	printf("filter  : installed (%s)\n", kill ? "kill" : "errno");
	fflush(stdout);
	if (mkdir("/tmp/x17", 0755) == -1)
		printf("mkdir   : %s\n", strerror(errno));
	else
		printf("mkdir   : ok\n");
	printf("after   : still running\n");
	return 0;
}
