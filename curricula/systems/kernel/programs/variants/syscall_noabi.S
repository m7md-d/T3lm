/* مدخلُ `syscall`.
   المعالج لا يبدّل المكدَّس هنا — بخلاف المقاطعة. عند الدخول:
     rcx = عنوانُ العودة في المستخدم     r11 = rflags قبل الاستدعاء
     rsp = **ما زال مكدَّس المستخدم**     IF  = مطفأةٌ بحكم FMASK
   فأوّلُ ما يجب فعلُه تبديلُ المكدَّس، قبل لمس أي شيء.

   وعقدُ الاستدعاء يقول: **كلُّ السجلّات تعود كما كانت إلا `rax` و`rcx` و`r11`.**
   وسجلّاتُ الوسائط — rdi rsi rdx r10 r8 r9 — متطايرةٌ في عقد C، فدالّةُ
   التوزيع تتلفها بحقّ. فنحفظها هنا: العقدان مختلفان، والجسرُ بينهما وظيفتُنا. */
.section .text
.global syscall_entry   /* نسخةٌ تخالف عقد الاستدعاء — المرحلة 16x */
syscall_entry:
    movq %rsp, syscall_user_rsp(%rip)   /* مكدَّسُ المستخدم: نحفظه ولا نثق به */
    movq syscall_kstack(%rip), %rsp     /* مكدَّسٌ نملكه — معالجٌ واحد، والفصل 22 يعمّمه */

    pushq %rcx                  /* عنوانُ العودة — تعيده `sysretq` */
    pushq %r11                  /* rflags — تعيدها `sysretq` */

    /* عقدُ الاستدعاء: rax الرقم، والوسائط rdi rsi rdx r10 r8 r9.
       وعقدُ C: rdi rsi rdx rcx. فنعيد الترتيب، وكلُّ مصدرٍ يُقرأ قبل أن يُكتَب. */
    movq %rdx, %rcx             /* a3 */
    movq %rsi, %rdx             /* a2 */
    movq %rdi, %rsi             /* a1 */
    movq %rax, %rdi             /* رقم الاستدعاء */
    call syscall_dispatch       /* الجواب يعود في rax، وهو ما يراه المستخدم */

    popq %r11
    popq %rcx

    movq syscall_user_rsp(%rip), %rsp
    sysretq                     /* تعيد rip من rcx وrflags من r11، وتنزل إلى CPL 3 */
