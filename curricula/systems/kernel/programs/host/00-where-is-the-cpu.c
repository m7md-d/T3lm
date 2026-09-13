/* الفصل 00 — أين يكون المعالج؟
   ثلاثة أنماطٍ تُقاس بـ`time`، والعمودان `user` و`sys` هما الجواب:
     spin   حسابٌ خالص، ولا استدعاءَ نظامٍ واحد
     cross  مئتا ألف بايت، بايتاً بايتاً — مئتا ألف عبورٍ للحدّ
     bulk   مئتا ألف بايت، دفعةً واحدة — عبورٌ واحد
   يُبنى على جهازك:  cc -O1 -o where 00-where-is-the-cpu.c   */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>

#define BYTES 200000

static unsigned long spin(void) {
    unsigned long acc = 0;
    for (unsigned long i = 0; i < 400000000UL; i++) acc += i ^ (acc >> 3);
    return acc;
}

static int open_null(void) {
    int fd = open("/dev/null", O_WRONLY);
    if (fd < 0) { perror("open"); exit(1); }
    return fd;
}

int main(int argc, char **argv) {
    if (argc != 2) { fprintf(stderr, "usage: %s spin|cross|bulk\n", argv[0]); return 2; }

    if (!strcmp(argv[1], "spin")) { printf("spin  acc=%lu\n", spin()); return 0; }

    if (!strcmp(argv[1], "cross")) {
        int fd = open_null();
        for (int i = 0; i < BYTES; i++)
            if (write(fd, "x", 1) != 1) { perror("write"); exit(1); }
        close(fd);
        printf("cross %d bytes in %d write() calls\n", BYTES, BYTES);
        return 0;
    }

    if (!strcmp(argv[1], "bulk")) {
        static char buf[BYTES];
        memset(buf, 'x', sizeof buf);
        int fd = open_null();
        if (write(fd, buf, sizeof buf) != (ssize_t)sizeof buf) { perror("write"); exit(1); }
        close(fd);
        printf("bulk  %d bytes in 1 write() call\n", BYTES);
        return 0;
    }
    fprintf(stderr, "unknown mode\n"); return 2;
}
