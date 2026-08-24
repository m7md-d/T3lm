import { parseChapter } from '@t3lm/kit/md';
import type { Chapter } from '@t3lm/kit/md';

/* الماركداون في ../regions هو المصدر الوحيد — يُقرأ ولا يُنسَخ. */
const files = import.meta.glob('../../../regions/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const readme = import.meta.glob('../../../README.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

export interface Region {
  num: string;
  slug: string;
  /** نوع الفصل كما يسمّيه هو: «المدخل» أو «الإقليم» — يُقرأ من عنوانه لا يُفترَض */
  label: string;
  title: string;
  /** أوّل جملةٍ من نبذة الفصل — ادّعاؤه الافتتاحيّ بكلماته هو */
  hook: string;
  chapter: Chapter;
}

/**
 * الجملة الأولى من نبذة الفصل.
 *
 * عشرةٌ من الاثني عشر تفتح بسطرٍ يعود إلى المخزن («في مخزنك…»)، فهي **ادّعاء
 * الفصل** لا وصفه. وبطاقة الخريطة تحملها بدل وسمٍ ثابت لا يفرّق بين فصلٍ وفصل.
 */
function hookOf(lead: string): string {
  const first = lead
    .replace(/^> ?/gm, '')
    .split(/```/)[0]!
    .split(/\n\s*\n/)[0]!
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  /* أوّل جملةٍ تامّة، ما لم تكن أقصر من أن تقول شيئاً */
  const cut = first.search(/[.؟!](\s|$)/);
  /* ونقطتان تعلّقان على بلوكٍ لا يظهر في البطاقة — تُقطَعان */
  return (cut > 40 ? first.slice(0, cut + 1) : first).replace(/\s*[:：]$/, '');
}

export const regions: Region[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, raw]) => {
    const name = path.split('/').pop()!.replace(/\.md$/, '');
    const num = name.slice(0, 2);
    const chapter = parseChapter(raw);
    /* «الإقليم ٠١ — المخزن» ← نوعٌ وعنوان. والمدخل يسمّي نفسه «المدخل»، فلا
       يُقحَم في تسميةٍ ليست له: القصّة ليست إقليماً، وعرضها كإقليمٍ يكذب. */
    const [head, ...rest] = chapter.heading.split('—');
    const title = rest.length ? rest.join('—').trim() : chapter.heading.trim();
    const label = rest.length ? (head ?? '').trim().replace(/\s*[٠-٩]+$/, '') : 'الإقليم';
    return { num, slug: num, label, title, hook: hookOf(chapter.lead), chapter };
  });

export const intro: Chapter = parseChapter(Object.values(readme)[0] ?? '');

/**
 * سلسلة الأدوات كما يعلنها المنهج في README تحت «الإصدار المستهدف».
 * تُستخرَج ولا تُكتب في الكود: كل مخرَج مسجَّل في المتن يعود إليها، فلو تغيّرت
 * في المنهج تغيّرت في الموقع في نفس اللحظة.
 */
export const TOOLCHAIN: string = (() => {
  const sec = intro.sections.find((x) => /الإصدار المستهدف/.test(x.title));
  return sec?.raw.match(/```\s*\n([^\n]+)\n```/)?.[1]?.trim() ?? '';
})();

/**
 * الفصول المختومة — كشفٌ تدريجيّ. **فارغةٌ الآن**: كل فصلٍ في المنهج مفتوح.
 * تعود إن أُضيف فصلٌ لم يُكتب بعد.
 */
export const sealed: { num: string; teaser: string }[] = [];

/**
 * البديهيات الخمس — **تُستخرَج من جدولها في الفصل ٠٠**، ولا تُكتب هنا.
 *
 * كانت منسوخةً في هذا الملفّ، فصار للنصّ الواحد ثلاثة مواضع (المتن وREADME
 * والكود). وقانون ملكيّة المحتوى يمنع ذلك: الموقع **يُصرِّف** ولا يُفرِّع.
 */
export interface Reject { what: string; price: string }

export interface Axiom {
  n: number;
  /** نصّ البديهية كما في جدولها */
  short: string;
  /** «أوّل ما يتساقط منها» — مقسومٌ على الفاصل الذي كتبه المؤلّف */
  falls: string[];
  /** شرحها كاملاً من لقطتها في الفصل ٠٠، بلا الكود (للكود موضعه في الفصل) */
  body: string;
  /** ما رفضته اللغة لحمايتها، وثمنه — من جدول «ما رفضته اللغة عمداً» */
  rejects: Reject[];
  /** موضع لقطتها في الفصل ٠٠، لفتحها هناك بنقرة */
  shot: number;
  /** الفصول التي تستعملها لاحقاً باسمها — «وسأشير إليها بأرقامها في كل فصل» */
  seen: { num: string; title: string }[];
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const ORDINALS = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];

const arNum = (s: string) => [...s].reduce((a, c) => a * 10 + AR_DIGITS.indexOf(c), 0);

/** صفوف جدولٍ من ثلاثة أعمدة، بلا رأسه ولا فاصله. */
function rows3(md: string): string[][] {
  return [...md.matchAll(/^\|([^|\n]+)\|([^|\n]+)\|([^|\n]+)\|\s*$/gm)]
    .map((m) => m.slice(1, 4).map((c) => c.trim()))
    .filter((r) => !/^-+:?$/.test(r[0]!) && r[0] !== '#');
}

/**
 * البديهيات الخمس — **تُستخرَج من الفصل ٠٠**، ولا تُكتب هنا.
 *
 * كانت منسوخةً في هذا الملفّ، فصار للنصّ الواحد ثلاثة مواضع (المتن وREADME
 * والكود). وقانون ملكيّة المحتوى يمنع ذلك: الموقع **يُصرِّف** ولا يُفرِّع.
 *
 * ويُجمَع لكل بديهية أربعة أشياء كتبها المؤلّف **متفرّقةً في ثلاث لقطات**:
 * نصّها، وما يتساقط منها، وشرحها، وما رُفض لحمايتها وثمنه. والجمع هنا لأن
 * المؤلّف نفسه ربطها: العمود الأوسط في جدول المرفوضات **رقمُ بديهية**.
 */
export const AXIOMS: Axiom[] = (() => {
  const zero = regions.find((r) => r.num === '00');
  const secs = zero?.chapter.sections ?? [];
  const at = (re: RegExp) => secs.findIndex((s) => re.test(s.title));

  const table = secs[at(/لماذا خمسٌ بالذات/)]?.raw ?? '';
  const rejected = secs[at(/ما رفضته اللغة عمداً/)]?.raw ?? '';

  return rows3(table)
    .filter((r) => /^[٠-٩]+$/.test(r[0]!))
    .map((r) => {
      const n = arNum(r[0]!);
      const ord = ORDINALS[n - 1] ?? '';
      const i = at(new RegExp(`^${ord} —`));
      /* الكود يُحذف من البطاقة لا لأنه زائد، بل لأن له موضعاً واحداً: لقطته.
         وتكراره هنا يجعل القارئ يقرأ نفس البرنامج مرّتين بلا مكسب. */
      const body = (secs[i]?.raw ?? '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim();

      const mention = new RegExp(`البديهية ${ord}`);
      return {
        n,
        short: r[1]!,
        falls: r[2]!.split('·').map((x) => x.trim()).filter(Boolean),
        body,
        shot: i,
        rejects: rows3(rejected)
          .filter((x) => arNum(x[1]!) === n)
          .map((x) => ({ what: x[0]!, price: x[2]! })),
        seen: regions
          .filter((g) => g.num !== '00' && g.chapter.sections.some((s) => mention.test(s.raw)))
          .map((g) => ({ num: g.num, title: g.title })),
      };
    })
    .sort((a, b) => a.n - b.n);
})();
