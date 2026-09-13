#ifndef PROC_H
#define PROC_H
#include "kernel.h"
#include "thread.h"

#define MAX_PROCS 8
#define MAX_FDS   8

/* العملية ليست الخيط، ولا فضاءَ العنوان، ولا البرنامج.
   هي **الحاوية**: فضاءٌ واحد، وخيطٌ أو أكثر، وجدولُ أوصاف، وهُويّة. */
struct process {
    int       pid;
    const char *name;
    uint64_t  root;             /* فضاء العنوان — تملكه العملية لا الخيط */
    uint64_t  entry;
    struct thread *main;        /* خيطٌ واحدٌ اليوم؛ والبنية تحتمل أكثر */
    int       fds[MAX_FDS];     /* جدولٌ لكل عملية — يملؤه الفصل 19 */
    bool      alive;
    int       exit_code;
};

struct process *proc_spawn(const char *name, const uint8_t *img, size_t len);
struct process *proc_current(void);
void            proc_exit(int code);
uint64_t        proc_reap(void);     /* يستردّ موارد كل عمليةٍ ماتت */
struct process *proc_table(void);
int             proc_count(void);
int             proc_alive_count(void);
#endif
