/**
 * أشكال المحتوى التي يُنتجها التصريف. **لا نصَّ محتوًى هنا ولا في أيّ مكوّن**
 * (الثابت ٤): المصدر `../../../regions/*.md` و`../../../README.md`.
 */

/** العلامة كما تُكتَب في الماركداون، وكما يقرؤها `../../../tools/verify.py`. */
export type Mark =
  | 'out' | 'err' | 'web' | 'web-err' | 'aot' | 'aot-err' | 'c' | 'runs' | 'shell';

/**
 * فئة اللون — **ثلاثٌ لا أربع**، والعدد مقيسٌ من المصدر لا مقدَّر.
 * `ok` قَبِلت (١٠٢) · `no` رَفَضت (٣٥) · `c` لغة المرساة (٤).
 */
export type Verdict = 'ok' | 'no' | 'c';

/**
 * الآلة التي أنتجت اللوحة — **القناة الثانية، وسمٌ نصّيّ واحد بلا أيقونة**.
 * وهي بعينها سلّم السلطة في `../../../README.md`: و`@spec` ليس منها لأنه
 * ادّعاءٌ في النثر لا لوحةٌ تُنتَج.
 */
export type Machine = '@vm' | '@web' | '@aot' | 'C' | '$';

/** خطوةٌ في لوحة صدفة: أمرٌ بادئٌ بـ`$ ` وما تحته. */
export interface Step { cmd: string; out: string }

export interface Panel {
  mark: Mark;
  verdict: Verdict;
  machine: Machine;
  /** الأمر الذي شغّله الفاحص — يُعرَض لينسخه القارئ */
  command: string;
  output: string;
  /** `runs`: الأرقام تختلف بين تشغيلين، فتُعلَن ولا تُقارَن */
  volatile: boolean;
  /** `shell` وحدها: أوامرُها ومخرَجُ كلٍّ منها */
  steps?: Step[];
  /** `shell: DIR` — تُشغَّل داخل نسخةٍ من `programs/DIR/` */
  dir?: string;
  /** `**المخرَج**:` ⇒ بوّابةُ تنبّؤ تقفل هذه اللوحة */
  gate?: { id: string; askHtml: string };
}

export interface Program {
  lang: string;
  code: string;
  /** `part: NAME` ⇒ الملفّ الكامل `programs/NAME.dart` */
  file?: string;
  /** `part` بلا اسم ⇒ مقتطعٌ لا يعمل وحده */
  excerpt: boolean;
}

export interface ProseBlock  { kind: 'prose';  html: string }
export interface FigureBlock { kind: 'figure'; text: string }
export interface GateBlock   { kind: 'gate';   id: string; askHtml: string }
/** برنامجٌ ولوحاتُه معاً. أكثرُ من لوحةٍ ⇒ **الآلتان جوابان لسؤالٍ واحد**. */
export interface RunBlock    { kind: 'run';    program?: Program; panels: Panel[] }
/** تشغيلان متجاوران بآلتين مختلفتين — وجها الطيّة، يُعرضان متقابلين. */
export interface FacetsBlock { kind: 'facets'; runs: RunBlock[] }

export type AnyBlock = ProseBlock | FigureBlock | GateBlock | RunBlock | FacetsBlock;

/** اللقطة: ادّعاءٌ + دليله + مكسبه. */
export interface Shot {
  id: string;
  title: string;
  blocks: AnyBlock[];
  /** جزءٌ من الفصل صفر وحده — حيث `###` أكثر من `##` */
  part?: string;
}

/** صفٌّ من «الخلاصة»: ثلاثة أعمدة في المصدر، والثالث **روابط أمامية**. */
export interface SummaryRow {
  saw: string;
  axiom: string;
  /** أرقام أقاليم مستخرَجة من العمود الثالث، إن كان أرقاماً */
  next: string[];
  nextRaw: string;
}

export interface Region {
  no: string;
  slug: string;
  title: string;
  /** العنوان بلا «الإقليم ٠٢ — » */
  name: string;
  leadHtml: string;
  shots: Shot[];
  parts: string[];
  summary: SummaryRow[];
  /** رؤوس أعمدة الخلاصة كما كتبها المؤلّف — تختلف بين الأقاليم فتُقرأ ولا تُفترَض */
  summaryHead: string[];
  exerciseHtml?: string;
  seedHtml?: string;
}

/** بديهيةٌ من جدول `../../../README.md` — خمسٌ. */
export interface Axiom { n: string; claim: string; falls: string }

/** حزمةٌ من جدول «الطريق — خمس حِزَم». */
export interface Pack { id: string; from: string; to: string; name: string; takes: string }

/** مختبرٌ محقونٌ بعد لقطته بالضبط؛ فحصٌ آليٌّ يفرض مطابقةً واحدة. */
export interface LabDef {
  id: string;
  region: string;
  /** مقطعٌ من عنوان اللقطة التي يلي حقنُه */
  after: string;
  name: string;
  /** الادّعاء الذي يقلبه — جملةٌ من نصّ المنهج */
  claim: string;
}
