#include <stdio.h>
#ifndef WHERE
#define WHERE "?"
#endif
void greet(void) { puts("greet: from " WHERE); }
