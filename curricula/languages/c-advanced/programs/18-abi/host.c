#include "api.h"
#include <dlfcn.h>
#include <stdio.h>

static void try(const char *path) {
    void *h = dlopen(path, RTLD_NOW);
    if (!h) { printf("%s: dlopen failed\n", path); return; }
    const struct api *(*get)(void);
    *(void **) &get = dlsym(h, "get_api");
    const struct api *p = get();
    printf("%-12s version %d  size %u  (host expects %d / %zu)\n",
           path, p->version, p->size, API_VERSION, sizeof(struct api));
    if (p->version != API_VERSION || p->size != sizeof(struct api))
        printf("%-12s refused: the struct it was built against is not mine\n", path);
    else
        printf("%-12s add(3,4)=%d  mul(3,4)=%d\n", path,
               p->add(3, 4), p->mul(3, 4));
    dlclose(h);
}

int main(void) { try("./p_old.so"); try("./p_new.so"); return 0; }
