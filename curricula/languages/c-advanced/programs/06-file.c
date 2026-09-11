//! cc: -D_POSIX_C_SOURCE=200809L
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    long ps = sysconf(_SC_PAGESIZE);

    int fd = open("/tmp/mapped", O_RDWR | O_CREAT | O_TRUNC, 0600);
    if (fd < 0) { perror("open"); return 1; }
    char buf[8192];
    memset(buf, 'x', sizeof buf);
    memcpy(buf, "HELLO", 5);
    write(fd, buf, sizeof buf);

    char *m = mmap(NULL, 8192, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    if (m == MAP_FAILED) { perror("mmap"); return 1; }
    printf("%.5s ⇐ قُرئت من الخريطة بلا read\n", m);

    /* اقتطع الملفّ إلى صفحةٍ واحدة، ثم المس الصفحة الثانية */
    ftruncate(fd, ps);
    printf("%ld ⇐ حجم الملفّ الآن بالبايت\n", (long)ps);

    pid_t k = fork();
    if (k == 0) { m[ps + 10] = 'z'; _exit(0); }
    int st; waitpid(k, &st, 0);
    printf("%d ⇐ إشارةُ لمسِ ما بعد نهاية الملفّ (7 = SIGBUS)\n",
           WIFSIGNALED(st) ? WTERMSIG(st) : 0);

    m[10] = 'z';
    printf("ok ⇐ لمسُ ما بقي من الملفّ\n");
    return 0;
}
