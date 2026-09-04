/** أنواع المحتوى — مفرداتها مفردات ماركداون هذا المنهج، لا مفرداتٌ عامّة. */

/** علامةُ لوحةٍ في المصدر — والأربع هي تصنيف المنهج لما يضمن المخرَج. */
export type PanelKind = 'out' | 'err' | 'runs' | 'shell';

export type Block =
  | { t: 'prose'; html: string }
  /** بلوكُ كودٍ يُقرأ. `file` اسمُ برنامجه الكامل في `programs/` إن وُجد. */
  | { t: 'code'; lang: string; code: string; file?: string; from?: string; task?: boolean }
  /** لوحةُ مخرَجٍ للبرنامج الذي قبلها. `note` سببٌ للقارئ، و`arg` اسمُ الاستثناء. */
  | { t: 'panel'; kind: PanelKind; text: string; note?: string; arg?: string }
  /** بوّابةُ تنبّؤ: تقفل اللوحة التي بعدها حتى يكتب القارئ توقّعه. */
  | { t: 'gate' };

export type Shot = {
  id: string;
  n: number;
  title: string;
  titleHtml: string;
  /** عنوان الجزء إن كان الإقليم مقسّماً أجزاءً (الفصل صفر وحده). */
  part?: string;
  /** مقدّمة الجزء — تُعرَض عند لقطته الأولى فقط. */
  partIntro?: string;
  blocks: Block[];
};

export type Region = {
  n: number;
  num: string;
  slug: string;
  title: string;
  titleHtml: string;
  /** العنوان بلا لقب «الإقليم NN» — لأن الرقم يُعرَض بجانبه. */
  shortHtml: string;
  short: string;
  /** الاقتباس الذي يفتح الإقليم. */
  intro: string;
  shots: Shot[];
  /** الأرضيّة: التمرين — يُنتزَع من التسلسل ويُعرَض بعد آخر قسم، مصرَّفاً
   *  كتلاً فيكون كودُه مُلوَّناً كغيره. */
  exercise?: Block[];
  /** جملةُ «الفصل التالي» — بنيةُ النصّ هي الملاحة. */
  next?: string;
};

/** حزمةٌ من حزم الطريق الخمس — تُقرأ من جدول README المنهج. */
export type Pack = {
  name: string;
  from: number;
  to: number;
  gist: string;
  /** أسماءُ فصول الحزمة بترتيبها — تُقرأ من نفس الخليّة. */
  titles: string[];
};
