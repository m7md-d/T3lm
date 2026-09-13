/* تبديلُ السياق كلُّه.
   وهذه **دالّةٌ تُنادى**، لا مقاطعة. فالـABI يقول إنّ المنادي حفظ ما يخصّه
   من السجلّات المتطايرة قبل النداء — فلا يبقى علينا إلا الستّة التي يضمن
   الـABI أنّ المنادى يحفظها.

   وهذا هو الفرق عن `isr_common`: هناك قُوطع تنفيذٌ لا يعلم، فحُفظ كلُّ شيء. */
.section .text
.global context_switch
context_switch:                 /* rdi = &old.rsp   rsi = new.rsp */
    pushq %rbp
    pushq %rbx
    pushq %r12
    pushq %r13
    pushq %r14
    pushq %r15

    movq %rsp, (%rdi)           /* الخيطُ القديم صار رقماً واحداً */
    movq %rsi, %rsp             /* ومن هنا نحن على مكدَّسٍ آخر */

    popq %r15
    popq %r14
    popq %r13
    popq %r12
    popq %rbx
    popq %rbp
    ret                         /* تعود إلى حيث توقّف الخيطُ الجديد */

/* نقطةُ انطلاق كل خيطٍ جديد.
   الخيطُ الذي يُختار أوّلَ مرّةٍ **لم يدخل عبر iretq**: وصل إليه التنفيذ من
   `ret` داخل `context_switch`. فإن كان التبديل وقع داخل معالج مقاطعة، فـIF
   ما زالت مطفأةً منذ بوّابة المقاطعة — ولن يُنفَّذ `iretq` يعيدها.

   فنعيدها هنا صريحةً. ونقطةُ الدخول محمولةٌ في r15، لأنه أوّلُ ما تستعيده
   `context_switch`. */
.global thread_trampoline
thread_trampoline:
    sti
    callq *%r15
    callq thread_exit
