/* مقاطعُ الدخول. المعالج لا يعرف عن C شيئاً: يدفع خمس كلماتٍ ويقفز.
   فوظيفةُ هذه المقاطع أن تجعل الحالة متماثلةً لكل المتّجهات، ثم تنادي C.

   ومئتان وستّة وخمسون مقطعاً بلا مئتين وستّة وخمسين تسمية: كلُّ مقطعٍ
   محاذًى إلى ١٦ بايتاً، فعنوانُ المتّجه n هو isr_stubs + 16n. */
.section .text
.global isr_stubs
.align 16
isr_stubs:
vec = 0
.rept 256
    .align 16
    /* هذه المتّجهات وحدها يدفع لها المعالج شفرةَ خطأ. وغيرُها نوحّده بصفر
       حتى يكون تخطيط المكدَّس واحداً في كل الحالات. */
    .if (vec==8)||(vec==10)||(vec==11)||(vec==12)||(vec==13)||(vec==14)||(vec==17)||(vec==21)||(vec==29)||(vec==30)
        nop
        nop
    .else
        pushq $0
    .endif
    pushq $vec
    jmp isr_common
vec = vec + 1
.endr

isr_common:
    /* لا نحفظ ما يحفظه المنادى: نحن لسنا دالّةً نودي، بل تنفيذٌ قُوطع.
       فكلُّ سجلٍّ يخصّ الكود المقطوع ويجب أن يعود كما كان. */
    pushq %rax
    pushq %rbx
    pushq %rcx
    pushq %rdx
    pushq %rsi
    pushq %rdi
    pushq %rbp
    pushq %r8
    pushq %r9
    pushq %r10
    pushq %r11
    pushq %r12
    pushq %r13
    pushq %r14
    pushq %r15

    movq %rsp, %rdi          /* الوسيط الأوّل في System V: مؤشّرٌ إلى struct regs */
    cld                      /* الـABI يشترط DF = 0 عند دخول دالّة C */
    call isr_dispatch

    popq %r15
    popq %r14
    popq %r13
    popq %r12
    popq %r11
    popq %r10
    popq %r9
    popq %r8
    popq %rbp
    popq %rdi
    popq %rsi
    popq %rdx
    popq %rcx
    popq %rbx
    popq %rax

    addq $16, %rsp           /* المتّجه وشفرة الخطأ: دفعناهما فنزيلهما */
    iretq                    /* وهي التي تعيد rip وcs وrflags وrsp وss معاً */
