/* النزول إلى الحلقة ٣.
   لا تعليمةَ اسمُها «انزل». نبني إطار عودةٍ كأنّ مقاطعةً وقعت في الحلقة ٣،
   ثم ننفّذ `iretq` — فتعيد خمس كلماتٍ معاً: ss وrsp وrflags وcs وrip.
   وهي الآلية نفسها التي تعود بها من كل استثناء (الفصل 07). */
.section .text
.global enter_user
enter_user:                     /* rdi = rip المستخدم   rsi = rsp المستخدم */
    movq $0x1b, %rax            /* SEL_UDATA | RPL 3 = 0x18 | 3 */
    movw %ax, %ds
    movw %ax, %es
    movw %ax, %fs
    movw %ax, %gs

    pushq $0x1b                 /* ss   */
    pushq %rsi                  /* rsp  */
    pushq $0x202                /* rflags: IF مضبوطة، والبتّ ١ محجوزٌ بواحد */
    pushq $0x23                 /* cs = SEL_UCODE | RPL 3 = 0x20 | 3 */
    pushq %rdi                  /* rip  */
    iretq
