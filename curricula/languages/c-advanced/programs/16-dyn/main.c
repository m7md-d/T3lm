#include <stdio.h>
void greet(void);
int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);      /* حتى يبقى الترتيب هو ترتيب الكتابة */
    puts("MARK: before the first call");
    greet();
    puts("MARK: after the first call");
    greet();
    return 0;
}
