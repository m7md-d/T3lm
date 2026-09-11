#include <stdio.h>
__attribute__((weak)) void hook(void) { puts("hook: the weak one"); }
