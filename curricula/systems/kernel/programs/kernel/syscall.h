#ifndef SYSCALL_H
#define SYSCALL_H
#include "kernel.h"
#define SYS_read  0
#define SYS_write 1
#define SYS_open  2
#define SYS_close 3
#define SYS_exit  60
void syscall_init(uint64_t kernel_stack_top);
/* أثرُ الاستدعاءات: يُفتَح حيث يكون هو الدرس، ويُغلَق حيث يحجب مخرَج المستخدم */
void syscall_trace(bool on);
/* نسخٌ من فضاء المستخدم بتحقّق. `false` تعني مؤشّراً لا يُوثَق به. */
bool copy_from_user(void *dst, uint64_t user_src, size_t n);
bool copy_to_user(uint64_t user_dst, const void *src, size_t n);
#endif
