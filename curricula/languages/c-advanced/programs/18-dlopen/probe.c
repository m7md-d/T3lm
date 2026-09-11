#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>
#include <string.h>
static int mapped(const char *needle) {
    FILE *f = fopen("/proc/self/maps", "r"); char l[512]; int n = 0;
    while (fgets(l, sizeof l, f)) if (strstr(l, needle)) n = 1;
    fclose(f); return n;
}
int main(void) {
    printf("before dlopen: mapped=%d\n", mapped("libplug.so"));
    void *h = dlopen("./libplug.so", RTLD_NOW);
    if (!h) { printf("dlopen failed: %s\n", dlerror()); return 1; }
    printf("after  dlopen: mapped=%d\n", mapped("libplug.so"));
    int (*fn)(int, int);
    *(void **) &fn = dlsym(h, "add");
    printf("add(3,4) = %d\n", fn(3, 4));
    dlerror();
    void *miss = dlsym(h, "nope");
    printf("dlsym(nope) = %p, dlerror = %s\n", miss, dlerror());
    dlclose(h);
    printf("after  dlclose: mapped=%d\n", mapped("libplug.so"));
    return 0;
}
