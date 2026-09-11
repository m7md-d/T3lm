#include <stdio.h>
int counter;                       /* تعريفٌ مؤقّت (tentative) — ISO C §6.9.2 */
void bump(void);
int main(void) { bump(); printf("counter = %d\n", counter); return 0; }
