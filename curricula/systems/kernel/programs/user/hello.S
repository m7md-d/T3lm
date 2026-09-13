/* برنامجُ المستخدم — بلا libc وبلا بادئةٍ من أحد.
   يُترجَم وحده ويُنزَع منه النصّ الخام، ثم تحمّله النواة في فضاءٍ خاصّ به.
   وهو يعرف عن النواة شيئاً واحداً: عقدَ الاستدعاء. */
.section .text
.global _start
_start:
    /* write(1, msg, len) */
    movq $1, %rax               /* رقمُ الاستدعاء */
    movq $1, %rdi               /* fd */
    leaq msg(%rip), %rsi        /* المؤشّر — عنوانٌ في فضاء المستخدم */
    movq $msglen, %rdx
    syscall

    /* استدعاءٌ برقمٍ لا وجود له: النواة يجب أن ترفض لا أن تنهار */
    movq $999, %rax
    syscall
    movq %rax, %r12             /* نحتفظ بالجواب لنُظهره */

    /* مؤشّرٌ عدائيّ: عنوانٌ في النصف الأعلى، أي ذاكرةُ النواة */
    movq $1, %rax
    movq $1, %rdi
    movq $0xffffffff80000000, %rsi
    movq $16, %rdx
    syscall
    movq %rax, %r13

    /* exit(42) */
    movq $60, %rax
    movq $42, %rdi
    syscall

    hlt                         /* لا يُبلَغ */

msg:
    .ascii "hello from ring 3\n"
    .equ msglen, . - msg
