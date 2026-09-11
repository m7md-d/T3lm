/* بُنيت على عقدٍ أقدم: بلا mul، وبترتيبٍ أقصر */
struct api_v1 { int version; unsigned size; int (*add)(int, int); };
static int add(int a, int b) { return a + b; }
static const struct api_v1 A = { 1, sizeof(struct api_v1), add };
const struct api_v1 *get_api(void) { return &A; }
