#define _GNU_SOURCE
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
#define CG    "/sys/fs/cgroup/box"

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

static void dev(const char *path, int major, int minor)
{
	must(mknod(path, S_IFCHR, makedev(major, minor)), path);
	must(chmod(path, 0666), path);
}

static int child(void *arg)
{
	struct job *j = arg;
	char        go;

	must(read(j->gate[0], &go, 1), "gate");
	must(unshare(CLONE_NEWCGROUP), "unshare cgroup");

	must(sethostname("box", 3), "sethostname");
	must(mount(NULL, "/", NULL, MS_REC | MS_PRIVATE, NULL), "mount /");
	must(mount(j->root, j->root, NULL, MS_BIND | MS_REC, NULL), "bind");
	must(chdir(j->root), "chdir root");
	must(syscall(SYS_pivot_root, ".", "."), "pivot_root");
	must(umount2(".", MNT_DETACH), "umount old");
	must(chdir("/"), "chdir /");
	must(mount("proc", "/proc", "proc", 0, NULL), "mount proc");
	must(mount("tmpfs", "/dev", "tmpfs", 0, NULL), "mount dev");
	dev("/dev/null", 1, 3);
	dev("/dev/zero", 1, 5);
	dev("/dev/urandom", 1, 9);

	must(execvp(j->argv[0], j->argv), "exec");
	return 1;
}

int main(int argc, char **argv)
{
	struct job j  = { .root = argv[1], .argv = argv + 2 };
	char      *sp = malloc(STACK);
	char       pid[16];
	int        st;

	if (argc < 3) {
		fprintf(stderr, "box <rootfs> <cmd>...\n");
		return 2;
	}
	must(pipe(j.gate), "pipe");

	int p = clone(child, sp + STACK,
	              CLONE_NEWNS | CLONE_NEWPID | CLONE_NEWUTS |
	              CLONE_NEWIPC | CLONE_NEWNET | SIGCHLD, &j);

	must(p, "clone");
	snprintf(pid, sizeof pid, "%d", p);
	must(mkdir(CG, 0755), "mkdir cgroup");
	put(CG "/pids.max", "20");
	put(CG "/cgroup.procs", pid);

	must(write(j.gate[1], "g", 1), "gate");
	must(waitpid(p, &st, 0), "wait");
	rmdir(CG);
	return WIFEXITED(st) ? WEXITSTATUS(st) : 1;
}
