/* الكيرنل يسكن النصف الأعلى: 0xffffffff80000000.
   وكل قسمٍ يصير segment مستقلّاً بأذونات مستقلّة — فالأذونات تُفرَض بالصفحة
   لا بالنيّة، وهذا التقسيم هو ما يجعل W^X ممكناً في الفصل 25. */
OUTPUT_FORMAT(elf64-x86-64)
ENTRY(_kstart)

PHDRS {
  text   PT_LOAD FLAGS((1 << 0) | (1 << 2));            /* X R  */
  rodata PT_LOAD FLAGS((1 << 2));                       /*   R  */
  data   PT_LOAD FLAGS((1 << 1) | (1 << 2));            /* W R  */
}

SECTIONS {
  . = 0xffffffff80000000;
  __kernel_start = .;

  .text : { *(.text .text.*) } :text            /* X R */
  . = ALIGN(CONSTANT(MAXPAGESIZE));

  .rodata : { *(.rodata .rodata.*) } :rodata    /*   R */
  /* الطلبات في قسمٍ للقراءة فقط: الـbootloader يكتب `response` قبل تشغيلنا،
     وبعد ذلك لا يُكتب فيها شيء. */
  .limine_requests : {
    KEEP(*(.limine_requests_start))
    KEEP(*(.limine_requests))
    KEEP(*(.limine_requests_end))
  } :rodata
  . = ALIGN(CONSTANT(MAXPAGESIZE));

  .data : { *(.data .data.*) } :data            /* W R */
  .bss  : { *(.bss .bss.*) *(COMMON) } :data
  . = ALIGN(CONSTANT(MAXPAGESIZE));
  __kernel_end = .;

  /DISCARD/ : { *(.eh_frame*) *(.note .note.*) *(.comment) }
}
