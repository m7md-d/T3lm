/** أنواع المحتوى — مفرداتها مفردات ماركداون هذا المنهج، لا مفرداتٌ عامّة. */

/** علامةُ لوحةٍ في المصدر. و`ref` تخصّ هذا المنهج: **مقارنةُ صورةٍ بمصيّرٍ
 *  ناضج**، لا مخرَجَ برنامج. */
export type PanelKind = 'out' | 'ref' | 'runs' | 'err' | 'shell';

/** السلطات الأربع — تصنيفُ المنهج لمن يضمن الرقم. تُنتزَع من نصّ اللوحة. */
export type Authority = 'math' | 'rule' | 'precision' | 'colorspace';

export type Block =
  | { t: 'prose'; html: string }
  /** بلوكُ كودٍ يُقرأ. `file` برنامجُه الكامل، و`head` رأسٌ مشترك. */
  | { t: 'code'; lang: string; code: string; file?: string; head?: string; task?: boolean }
  /** صيغةٌ رياضية — ليست مخرَجَ تشغيل، ولا تُلوَّن كوداً. */
  | { t: 'math'; text: string }
  /** لوحةٌ. `note` سببٌ للقارئ، و`arg` اسمُ المشهد أو البرنامج. */
  | { t: 'panel'; kind: PanelKind; text: string; note?: string; arg?: string; authority?: Authority }
  /** بوّابةُ تنبّؤ: تقفل اللوحة التي بعدها حتى يكتب القارئ توقّعه. */
  | { t: 'gate' };

export type Shot = {
  id: string;
  n: number;
  title: string;
  titleHtml: string;
  part?: string;
  partIntro?: string;
  blocks: Block[];
};

export type Region = {
  n: number;
  num: string;
  slug: string;
  title: string;
  titleHtml: string;
  shortHtml: string;
  short: string;
  intro: string;
  shots: Shot[];
  exercise?: Block[];
  summary?: Block[];
};

/** حزمةٌ من حزم الطريق الخمس — تُقرأ من جدول README المنهج. */
export type Pack = { name: string; from: number; to: number; gist: string };
