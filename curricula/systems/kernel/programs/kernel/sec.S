/* تنفيذُ دالّةٍ على مكدَّسٍ آخر: نحفظ `rsp` الحاليّ، ونبدّل، وننادي، ونعود.
   وهو أصغرُ صورةٍ لما تفعله النواة عند كل انتقالٍ إلى مكدَّس خيطٍ آخر. */
.section .text
.global call_on_stack
call_on_stack:                  /* rdi = قمّة المكدَّس  rsi = الدالّة  rdx = الوسيط */
    pushq %rbp
    movq  %rsp, %rbp
    movq  %rdi, %rsp            /* من هنا نحن على المكدَّس الجديد */
    andq  $-16, %rsp            /* محاذاةُ الـABI قبل `call` */
    movq  %rdx, %rdi
    callq *%rsi
    movq  %rbp, %rsp
    popq  %rbp
    ret
