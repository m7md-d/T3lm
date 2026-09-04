/** أنواع المحتوى — مفرداتها مفردات ماركداون هذا المنهج كما يفرضها `tools/verify.py`. */

/** الضوامن الأربعة — تصنيفُ المنهج لمن يضمن الادّعاء (الفصل `00`). */
export type Guarantor = 'grammar' | 'validator' | 'solver' | 'convention';

/** علامةُ كتلةٍ يُقرَأ نصُّها ولا يُشغَّل: مخرَجٌ أو مصدرٌ أو مواصفة. */
export type PanelKind = 'out' | 'err' | 'runs' | 'shell' | 'suite' | 'file' | 'spec' | 'math' | 'diagram';

export type Block =
  | { t: 'prose'; html: string }
  /** كتلةُ كودٍ تُقرأ. `file` برنامجُها في `programs/`، و`from` ملفٌّ اقتُطعت منه. */
  | { t: 'code'; lang: string; code: string; file?: string; from?: string; task?: boolean; label?: string }
  /** كتلةٌ تُعرَض نصّاً. `note` سببٌ للقارئ، و`arg` اسمُ البرنامج أو الملفّ. */
  | { t: 'panel'; kind: PanelKind; text: string; note?: string; arg?: string; label?: string }
  /** سؤالُ توقّع: يقفل ما بعده حتى يكتب القارئ توقّعه. */
  | { t: 'gate' };

export type Shot = {
  id: string;
  n: number;
  title: string;
  titleHtml: string;
  blocks: Block[];
};

export type Region = {
  n: number;
  num: string;
  slug: string;
  title: string;
  titleHtml: string;
  /** العنوان بلا «الفصل NN» — لأن الرقم معروضٌ بجانبه. */
  shortHtml: string;
  short: string;
  intro: string;
  shots: Shot[];
  /** الأرضيّة: التمرين، مصرَّفاً كتلاً فيكون كودُه مُلوَّناً كغيره. */
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
};
