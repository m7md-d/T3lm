#include "api.h"
static int add(int a, int b) { return a + b; }
static int mul(int a, int b) { return a * b; }
static const struct api A = { API_VERSION, sizeof(struct api), add, mul };
const struct api *get_api(void) { return &A; }
