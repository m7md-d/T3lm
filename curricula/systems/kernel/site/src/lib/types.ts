/** أنواع الموقع — مفرداتها من `../../tools/verify.py` و`../../README.md`. */

/** وسوم السلطة الثمانية التي يعرفها الفاحص (`verify.py` → `TAGS`). */
export type Tag = 'arch' | 'abi' | 'boot' | 'qemu' | 'ours' | 'fw' | 'unspec' | 'host';

/**
 * العائلات الأربع التي تُطوى فيها — من يضمن اللوحة.
 * و`none` بلا لون: `@unspec` لا يضمنه أحد، فالغياب هو الدلالة.
 */
export type Family = 'spec' | 'env' | 'ours' | 'none';

export interface Limit { kind: 'limit'; html: string }
export interface Prose { kind: 'prose'; html: string }
export interface Head { kind: 'head'; titleMd: string; title: string; id: string }

/** بلوك كود. `file` موجودٌ حين وسمه `<!-- part: … -->`، وهو مسارٌ تحت `programs/`. */
export interface Code { kind: 'code'; lang: string; code: string; file: string | null }

/** لوحة مخرَج: `stage` هي المرحلة التي أُقلعت لإنتاجها، إن وُسمت بـ`runs`. */
export interface Panel {
  kind: 'panel';
  id: string;
  titleMd: string | null;
  tag: Tag;
  note: string;
  stage: string | null;
  text: string;
}

/** مسار التنفيذ: بلوكٌ بلا لغة تفصل خطواته `↓` — يُعرَض سُلّماً لا `pre`. */
export interface Trace { kind: 'trace'; steps: { md: string; html: string }[] }

export type Block = Prose | Limit | Head | Code | Panel | Trace;

/** لقطة = قسم `## ` واحد. وعنوانها مرحلةٌ من قالب الفصل حين يطابقها. */
export interface Shot {
  titleMd: string;
  title: string;
  /** اسم المرحلة في القالب — «الآلية الخام» … — أو `null` لقسمٍ خارج القالب */
  stage: string | null;
  /** ما بعد `: ` في العنوان، إن وُجد */
  sub: string | null;
  id: string;
  blocks: Block[];
  words: number;
}

export interface Trap { trap: string; right: string }
export interface ArtifactRow { label: string; body: string }

export interface Chapter {
  num: string;
  file: string;
  heading: string;
  titleMd: string;
  title: string;
  lead: Block[];
  shots: Shot[];
  /** «الفصل التالي: …» — رابط الفصل الآتي بنصّ المنهج */
  seedHtml: string | null;
  traps: Trap[];
  artifact: ArtifactRow[];
  checkpoint: string[];
  panels: Panel[];
  /** أرقام البديهيات التي يذكرها الفصل بالاسم */
  axioms: string[];
}

/** سطرٌ من `programs/stages.conf`. */
export interface Stage {
  id: string;
  /** `13x` مرحلةُ كسرٍ متعمَّد، وأصلها `13` */
  broken: boolean;
  base: string;
  files: string[];
  qemu: string;
  timeout: string;
}

export interface Pack {
  range: string;
  from: number;
  to: number;
  title: string;
}

export interface Axiom { n: string; claim: string; where: string }
