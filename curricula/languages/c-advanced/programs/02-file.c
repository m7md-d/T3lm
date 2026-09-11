#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/mman.h>
#include <unistd.h>

static void show_file(const char *why) {
    int  fd = open("/tmp/m", O_RDONLY);
    char buf[8] = {0};
    read(fd, buf, 4);
    close(fd);
    printf("%s ⇐ الملفّ فيه %s\n", buf, why);
}

int main(void) {
    int fd = open("/tmp/m", O_RDWR | O_CREAT | O_TRUNC, 0600);
    char init[4096];
    memset(init, 'A', sizeof init);
    write(fd, init, sizeof init);
    show_file("البداية");

    char *s = mmap(NULL, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    memcpy(s, "SSSS", 4);
    msync(s, 4096, MS_SYNC);
    show_file("بعد MAP_SHARED");

    char *v = mmap(NULL, 4096, PROT_READ | PROT_WRITE, MAP_PRIVATE, fd, 0);
    memcpy(v, "PPPP", 4);
    show_file("بعد MAP_PRIVATE");

    char *w = mmap(NULL, 4096, PROT_READ, MAP_PRIVATE, fd, 0);
    printf("%.4s ⇐ خريطةٌ خاصّة أخرى تقرأ\n", w);
    printf("%.4s ⇐ الخريطة التي كتبَت تقرأ\n", v);
    return 0;
}
