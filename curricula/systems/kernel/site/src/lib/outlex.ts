/**
 * معجمُ تلوين المخرَج — **لون الرمز هو لون مالكه**.
 *
 * لوحةُ المخرَج هنا سجلُّ طرفيةٍ تسلسلية، وفيها ثلاثة أنواعٍ من الرموز لا
 * واحد: اسمٌ تفرضه المعمارية (`#PF` · `cr2` · `rip`)، واسمٌ سمّاه كودُنا
 * (`pmm` · `[PANIC]` · `de_seen`)، ورقمٌ من هذا التشغيل بعينه
 * (`0xffffffff800030d1` · `ticks=18`). فيقرأ القارئُ السطرَ فيرى بلونه من
 * يضمن أيَّ جزءٍ منه — وهو درسُ `../../README.md` §البيئة نفسه، لا زينةً فوقه.
 *
 * والألوان من العائلات الأربع وحدها (`authority.ts`)، فلا تفتح فئةً خامسة.
 */
import { ourNames } from '../content/sources';
import { escape } from './md';

/** ما تسمّيه المعمارية ووثائقها: سجلّات، ومتّجهاتُ استثناء، وبنًى يفرضها المعالج. */
const SPEC = new Set([
  'rax','rbx','rcx','rdx','rsi','rdi','rbp','rsp','rip','rflags','eflags',
  'r8','r9','r10','r11','r12','r13','r14','r15',
  'eax','ebx','ecx','edx','esi','edi','ebp','esp','eip','ax','bx','cx','dx','al','bl','cl','dl',
  'cs','ds','es','fs','gs','ss','tr','ldtr',
  'cr0','cr2','cr3','cr4','xcr0','efer','star','lstar','cstar','fmask','msr',
  'gdt','gdtr','idt','idtr','tss','ist','tlb','mmu',
  'pml4','pdpt','pd','pt','pte','pde','pdpte','pml4e',
  'cpl','dpl','rpl','iopl',
  'apic','lapic','ioapic','pic','pit','hpet','tsc','acpi','pci','pcie','mmio','dma','uart',
  'smep','smap','nxe','wp','sce','elf','abi','psabi','irq','nmi','sipi','init',
  'lgdt','lidt','ltr','iretq','sysret','syscall','invlpg','rdmsr','wrmsr','hlt','sti','cli','ret','call','jmp','push','pop','mov','movq',
]);

const VECTOR = /^#(DE|DB|BP|OF|BR|UD|NM|DF|TS|NP|SS|GP|PF|MF|AC|MC|XM|VE|CP)$/;

export type Kind = 'spec' | 'env' | 'ours' | 'plain';

export function kindOf(tok: string): Kind {
  if (/^0x[0-9a-fA-F]+$/.test(tok)) return 'env';
  if (/^[0-9]+$/.test(tok)) return 'env';
  if (VECTOR.test(tok)) return 'spec';
  const low = tok.toLowerCase();
  if (SPEC.has(low)) return 'spec';
  if (ourNames.has(tok)) return 'ours';
  return 'plain';
}

/** يقسم السطر إلى رموزٍ وفواصل، فلا يضيع حرفٌ واحد. */
const TOKEN = /#[A-Z]{2}|[A-Za-z_][A-Za-z0-9_]*|0x[0-9a-fA-F]+|[0-9]+/g;

/** HTML ملوَّنٌ للوحة مخرَج. والمخرَج إنجليزيٌّ كلُّه، فلا عربيةَ تُصاب. */
export function lexOutput(text: string): string {
  let out = '';
  let at = 0;
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index!;
    if (i > at) out += escape(text.slice(at, i));
    const t = m[0];
    const k = kindOf(t);
    out += k === 'plain' ? escape(t) : `<span class="o-${k}">${escape(t)}</span>`;
    at = i + t.length;
  }
  return out + escape(text.slice(at));
}

/** الفئات التي يستعملها المعجم — تُعرَض مفتاحاً في صفحة «من يضمن؟». */
export const LEX_KEY: { kind: Exclude<Kind, 'plain'>; what: string }[] = [
  { kind: 'spec', what: 'اسمٌ تفرضه المعمارية: سجلٌّ، أو متّجهُ استثناء، أو بنيةٌ يقرؤها المعالج' },
  { kind: 'ours', what: 'اسمٌ عرّفه كودُنا في `programs/kernel/` — يُستخرَج من المصادر لا من قائمةٍ بيد' },
  { kind: 'env', what: 'رقمٌ من هذا التشغيل: عنوانٌ، أو عدّاد، أو حجم' },
];
