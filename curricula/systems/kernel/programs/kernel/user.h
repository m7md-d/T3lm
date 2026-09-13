#ifndef USER_H
#define USER_H
#include "kernel.h"
#define USER_CODE 0x0000000000400000ull
#define USER_STACK_TOP 0x0000000000800000ull
/* ينزل إلى الحلقة ٣ بـ`iretq` ولا يعود */
__attribute__((noreturn)) void enter_user(uint64_t rip, uint64_t rsp);
#endif
