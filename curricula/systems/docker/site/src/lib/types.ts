/**
 * أشكال المحتوى التي يُنتجها التصريف. **قوالبُ فارغة الآن**: الخطوة التالية
 * تملؤها من `../../regions/*.md` و`../../README.md`، ولا يُكتَب نصُّ محتوًى هنا
 * ولا في أيّ مكوّن (الثابت ٤).
 */

/** سلطة اللوحة: ستّة وسومٍ في المصدر، أربع فئاتٍ في الموقع. */
export type Authority = 'kernel' | 'tool' | 'env' | 'run';

/** الوسم كما يُكتَب في الماركداون. */
export type AuthorityTag = '@kernel' | '@oci' | '@impl' | '@distro' | '@vm' | '@machine';

/** موضع التنفيذ — محورٌ مستقلٌّ عن السلطة، فلا يحمل لوناً دلالياً. */
export type RunSite = 'lab' | 'host';

export interface Block {
  kind:
    | 'prose'      // نثرٌ مصرَّف من ماركداون
    | 'code'       // مقطعٌ يُقرأ (sh · c · json · dockerfile)
    | 'panel'      // لوحة مخرَجٍ مسجَّلة — gate/out/runs
    | 'part'       // مقتطف برنامجٍ من programs/
    | 'gate'       // بوّابة تنبّؤ — عشرون بالضبط
    | 'summary'    // جدول الخلاصة
    | 'exercise'
    | 'seed'
    | 'figure';
}

export interface ProseBlock extends Block { kind: 'prose'; html: string }

export interface CodeBlock extends Block {
  kind: 'code';
  lang: string;
  code: string;
  /** اسم البرنامج حين يكون المقطع `<!-- part: NAME -->` */
  part?: string;
}

export interface PanelBlock extends Block {
  kind: 'panel';
  /** `gate` لوحةٌ يُقارَن بها، `out` مخرَجٌ معروض، `runs` تشغيلٌ بلا مقارنةِ نصّ */
  role: 'gate' | 'out' | 'runs';
  site: RunSite;
  tag: AuthorityTag;
  /** الأمر الذي أنتجها — للنسخ */
  command: string;
  /** المخرَج المسجَّل؛ `…` تبقى كما هي ويصيّرها المكوّن */
  output: string;
}

export interface PartBlock extends Block { kind: 'part'; program: string; code: string; lang: string }

export interface GateBlock extends Block {
  kind: 'gate';
  id: string;
  /** نصّ الطلب كما كتبه المؤلّف — `> **توقّع…` */
  askHtml: string;
}

export interface SummaryRow { learned: string; node: string }
export interface SummaryBlock extends Block { kind: 'summary'; rows: SummaryRow[] }

export interface ExerciseBlock extends Block { kind: 'exercise'; count: number; html: string }
export interface SeedBlock extends Block { kind: 'seed'; html: string }
export interface FigureBlock extends Block { kind: 'figure'; html: string }

export type AnyBlock =
  | ProseBlock | CodeBlock | PanelBlock | PartBlock
  | GateBlock | SummaryBlock | ExerciseBlock | SeedBlock | FigureBlock;

/** اللقطة: ادّعاءٌ + دليله + مكسبه. الحدّ ≤٢٥٠ كلمة · ≤بلوكان · ≤٣ عناصر. */
export interface Shot {
  id: string;
  title: string;
  blocks: AnyBlock[];
  /** جزءٌ من الفصل صفر وحده — حيث `###` أكثر من `##` */
  part?: string;
}

export interface Region {
  /** `00` … `33` */
  no: string;
  slug: string;
  title: string;
  leadHtml: string;
  shots: Shot[];
  summary?: SummaryBlock;
  seed?: SeedBlock;
  exercise?: ExerciseBlock;
}

/** حزمةٌ من جدول `../../README.md` — ولكلٍّ سطرُها الذي تفكّكه من `box`. */
export interface Package {
  id: string;
  range: [string, string];
  name: string;
  takes: string;
  /** «السطر الذي تفكّكه في box» — نصّاً من الجدول */
  line: string;
  /** مدى الأسطر في programs/01-box.c — يُقرَّر في خطوة التصريف */
  lines?: [number, number][];
  regions: string[];
}

export interface Axiom { n: number; claim: string; falls: string }

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
