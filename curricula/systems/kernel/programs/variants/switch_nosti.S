/* نسخةٌ من `switch.S` بلا `sti` في المقطع — للمرحلة 13x وحدها.
   وكلُّ ما عداها مطابق. */
.section .text
.global context_switch
context_switch:
    pushq %rbp
    pushq %rbx
    pushq %r12
    pushq %r13
    pushq %r14
    pushq %r15
    movq %rsp, (%rdi)
    movq %rsi, %rsp
    popq %r15
    popq %r14
    popq %r13
    popq %r12
    popq %rbx
    popq %rbp
    ret

.global thread_trampoline
thread_trampoline:
    callq *%r15                 /* بلا sti: الخيطُ يبدأ وIF مطفأة */
    callq thread_exit
