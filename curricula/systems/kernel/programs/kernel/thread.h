#ifndef THREAD_H
#define THREAD_H
#include "kernel.h"

#define KSTACK_PAGES 4                      /* ١٦ كيلوبايت لكل خيط */
#define MAX_THREADS  8

enum tstate { T_UNUSED = 0, T_READY, T_RUNNING, T_BLOCKED, T_DEAD };

/* كلُّ حقلٍ هنا يبرّر وجودَه، وإلّا حُذف:
   `rsp` وحدَه ما يلزم للاستئناف — والباقي محفوظٌ **على** ذلك المكدَّس. */
struct thread {
    uint64_t     rsp;        /* قمّةُ المكدَّس المحفوظ — وهي كلُّ حالة التنفيذ */
    uint64_t     stack_base; /* لتحريره، ولحساب حدّه */
    enum tstate  state;
    int          id;
    const char  *name;
    uint64_t     slices;     /* كم مرّةً جُدوِل — للقياس لا للسياسة */
    /* يُضافان في الفصل 17: الخيط صار قد يسكن فضاءَ عنوانٍ غيرَ فضاء النواة */
    uint64_t     cr3;        /* 0 = فضاءُ النواة كما أقلعنا */
    uint64_t     kstack_top; /* ما يضعه المعالج في rsp0 عند دخوله من الحلقة ٣ */
    struct process *proc;    /* العملية المالكة، أو NULL لخيط نواة */
};
struct process;

struct thread *thread_create(const char *name, void (*entry)(void));
struct thread *thread_current(void);
void           thread_bootstrap(void);      /* يجعل التنفيذ الجاري خيطاً */
void           thread_exit(void);
struct thread *thread_table(void);
int            thread_count(void);

/* في switch.S: يحفظ ما يحفظه المنادى ويبدّل المكدَّس */
void context_switch(uint64_t *save_rsp_here, uint64_t new_rsp);
#endif
