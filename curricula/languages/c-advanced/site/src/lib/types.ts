/** أنواع الموقع — مفرداتها من `../../tools/verify.py` و`../../README.md`. */

/** الوسوم التسعة التي يعرفها الفاحص. بلا وسمٍ في المصدر ⇒ `spec`. */
export type Tag =
  | 'spec' | 'posix' | 'abi'
  | 'os' | 'env' | 'impl' | 'unspec'
  | 'machine'
  | 'ub';

/** الفئات الأربع التي تُطوى فيها، و`none` لِما لا يضمنه أحد. */
export type Family = 'spec' | 'sys' | 'tool' | 'hw' | 'none';

/** كيف تحقّق الفاحص من هذه اللوحة — لا هل «نجحت». */
export type Grade = 'exact' | 'semantic' | 'manual' | 'reject' | 'warn';

/** ما يربط البلوك ببرنامجه في `../../programs/`. */
export type Bind = 'part' | 'runs' | null;

export interface ProseBlock {
  kind: 'prose';
  html: string;
  /** الماركداون قبل التصريف — منه تُنتزَع فقرة «توقّع…» */
  rawMd: string;
}
export interface CodeBlock { kind: 'code'; lang: string; code: string }

export interface PanelBlock {
  kind: 'panel';
  /** مفتاحٌ ثابت عبر البناءات — لحفظ التوقّع */
  id: string;
  grade: Grade;
  /** اللوحة اليدوية وحدها بلا مصدرٍ موسوم، وهي مُعلَنة */
  tag: Tag | null;
  family: Family | null;
  /** ملاحظة المؤلّف بعد الوسم، كما كتبها */
  note: string;
  /** البرنامج الذي أنتج المخرَج، إن كان خارج المتن */
  program: string | null;
  bind: Bind;
  lang: string;
  /** المقتطع المعروض؛ فارغٌ في اللوحة اليدوية */
  code: string;
  /** نثرٌ وقع بين البلوك ومخرَجه */
  midHtml: string;
  output: string;
  /** «توقّع قبل أن تشغّل…» — يقفل المخرَج حتى يكتب القارئ */
  askHtml: string | null;
}

export type Block = ProseBlock | CodeBlock | PanelBlock;

export interface Shot {
  /** عنوان القسم ماركداوناً — فيه `code` وتوكيد، ويُصرَّف عند العرض */
  titleMd: string;
  /** نصّاً صِرفاً — للعنوان في التبويب ولقارئ الشاشة */
  title: string;
  id: string;
  blocks: Block[];
  words: number;
}

export interface Chapter {
  /** رقم الفصل بخانتين — `00` … `26` */
  num: string;
  heading: string;
  titleMd: string;
  title: string;
  file: string;
  lead: Block[];
  shots: Shot[];
  /** «الفصل التالي: …» مستخرجاً من آخر قسم */
  seedHtml: string | null;
  panels: PanelBlock[];
}

export interface Pack {
  /** `00–06` كما في README */
  range: string;
  from: number;
  to: number;
  title: string;
  gist: string;
  /** رقم البديهية التي تسقط منها هذه الحزمة */
  axioms: string[];
}

export interface Axiom {
  n: string;
  claim: string;
  falls: string;
}
