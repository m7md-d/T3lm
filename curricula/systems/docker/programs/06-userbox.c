#define _GNU_SOURCE
#include <errno.h>
#include <fcntl.h>
#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mount.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/sysmacros.h>
#include <sys/wait.h>
#include <unistd.h>

#define STACK (1024 * 1024)

struct job {
	char  *root;
	char **argv;
	int    gate[2];
};

static void must(long r, const char *what)
{
	if (r == -1) {
		perror(what);
		exit(1);
	}
}

static void put(const char *path, const char *val)
{
	int fd = open(path, O_WRONLY);

	must(fd, path);
	must(write(fd, val, strlen(val)), path);
	close(fd);
}

/* لا mknod: char device محظورةٌ على نطاق مستخدمين غير مبدئيّ مهما كانت
 * الأذونات — تُربَط بجهاز المضيف الحقيقيّ بدل أن تُصنَع. */
static void dev(const char *root, const char *name)
{
	char host[64], guest[256];

	snprintf(host, sizeof host, "/dev/%s", name);
	snprintf(guest, sizeof guest, "%s/dev/%s", root, name);
	must(open(guest, O_CREAT | O_WRONLY, 0666), guest);
	must(mount(host, guest, NULL, MS_BIND, NULL), guest);
}

static int child(void *arg)
{
	struct job *j = arg;
	char        go;

	must(read(j->gate[0], &go, 1), "gate");

	char path[256];

	snprintf(path, sizeof path, "%s/proc", j->root);

	must(sethostname("box", 3), "sethostname");
	must(mount(NULL, "/", NULL, MS_REC | MS_PRIVATE, NULL), "mount /");
	must(mount(j->root, j->root, NULL, MS_BIND | MS_REC, NULL), "bind");
	must(mount("proc", path, "proc", 0, NULL), "mount proc");

	snprintf(path, sizeof path, "%s/dev", j->root);
	must(mkdir(path, 0755) == -1 && errno != EEXIST ? -1 : 0, path);
	must(mount("tmpfs", path, "tmpfs", 0, NULL), "mount dev");
	dev(j->root, "null");
	dev(j->root, "zero");
	dev(j->root, "urandom");

	must(chdir(j->root), "chdir root");
	must(syscall(SYS_pivot_root, ".", "."), "pivot_root");
	must(umount2(".", MNT_DETACH), "umount old");
	must(chdir("/"), "chdir /");

	must(execvp(j->argv[0], j->argv), "exec");
	return 1;
}

int main(int argc, char **argv)
{
	struct job j  = { .root = argv[1], .argv = argv + 2 };
	char      *sp = malloc(STACK);
	int        st;
	char       pid[16];

	if (argc < 3) {
		fprintf(stderr, "userbox <rootfs> <cmd>...\n");
		return 2;
	}
	must(pipe(j.gate), "pipe");

	int p = clone(child, sp + STACK,
	              CLONE_NEWNS | CLONE_NEWPID | CLONE_NEWUTS |
	              CLONE_NEWIPC | CLONE_NEWNET | CLONE_NEWUSER | SIGCHLD, &j);

	must(p, "clone");
	snprintf(pid, sizeof pid, "%d", p);

	char path[48], val[32];

	snprintf(path, sizeof path, "/proc/%s/setgroups", pid);
	put(path, "deny");

	snprintf(path, sizeof path, "/proc/%s/uid_map", pid);
	snprintf(val, sizeof val, "0 %d 1", getuid());
	put(path, val);

	snprintf(path, sizeof path, "/proc/%s/gid_map", pid);
	snprintf(val, sizeof val, "0 %d 1", getgid());
	put(path, val);

	must(write(j.gate[1], "g", 1), "gate");
	must(waitpid(p, &st, 0), "wait");
	return WIFEXITED(st) ? WEXITSTATUS(st) : 1;
}
