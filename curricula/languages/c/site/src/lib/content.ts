import { parseChapter } from '@t3lm/kit/md';
import type { Chapter } from '@t3lm/kit/md';

/* الماركداون في ../regions هو المصدر الوحيد — يُقرأ ولا يُنسَخ (الثابت ٤). */
const files = import.meta.glob('../../../regions/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const readme = import.meta.glob('../../../README.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

export interface Region {
  num: string;
  slug: string;
  /** نوع الفصل كما يسمّيه هو — «الفصل صفر» أو «الإقليم». يُقرأ لا يُفترَض */
  label: string;
  title: string;
  /** أوّل جملةٍ من نبذة الفصل: ادّعاؤه بكلماته هو، لا وصفٌ نكتبه له */
  hook: string;
  chapter: Chapter;
}

/**
 * الجملة الأولى من نبذة الفصل.
 *
 * كل إقليمٍ يفتح باقتباسٍ يقول ما الذي يقلبه — «رأيتَ هذه العبارة في أربعة عشر
 * إقليماً»، «منذ الإقليم ٠١ وأنت تحمل سؤالاً». فهي **ادّعاء الفصل** لا وصفه،
 * وحملُها في البطاقة يجعل التسعةَ والعشرين تسعةً وعشرين لا واحداً مكرّراً.
 */
function hookOf(lead: string): string {
  const first = lead
    .replace(/^> ?/gm, '')
    .split(/```/)[0]!
    .split(/\n\s*\n/)[0]!
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const cut = first.search(/[.؟!](\s|$)/);
  return (cut > 40 ? first.slice(0, cut + 1) : first).replace(/\s*[:：]$/, '');
}

export const regions: Region[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, raw]) => {
    const name = path.split('/').pop()!.replace(/\.md$/, '');
    const num = name.slice(0, 2);
    const chapter = parseChapter(raw);
    /* «الإقليم ٠٢ — البت والبايت» ← نوعٌ وعنوان. والفصل صفر يسمّي نفسه
       «الفصل صفر»، فلا يُقحَم في تسمية الأقاليم: هو نظريةٌ لا إقليم. */
    const [head, ...rest] = chapter.heading.split('—');
    const title = rest.length ? rest.join('—').trim() : chapter.heading.trim();
    const label = rest.length ? (head ?? '').trim().replace(/\s*[٠-٩]+$/, '') : 'الإقليم';
    return { num, slug: num, label, title, hook: hookOf(chapter.lead), chapter };
  });

export const intro: Chapter = parseChapter(Object.values(readme)[0] ?? '');

/** الأداة التي شُغِّل عليها كل شيء في هذا المنهج — تُعلَن ولا تُخفى */
export const TOOLCHAIN = 'Apple clang 16 · c17 · darwin/arm64';

export const byNum = (n: string): Region | undefined => regions.find((r) => r.num === n);

export const nextOf = (n: string): Region | undefined =>
  regions[regions.findIndex((r) => r.num === n) + 1];

export const prevOf = (n: string): Region | undefined => {
  const i = regions.findIndex((r) => r.num === n);
  return i > 0 ? regions[i - 1] : undefined;
};

/** حزمةٌ من الطريق: مجموعةُ أقاليم تجيب سؤالاً واحداً. */
export interface Band {
  from: string;
  to: string;
  /** اسم الحزمة كما يسمّيها المنهج */
  name: string;
  /** سطرُها في `README` — السؤال الذي تجيبه */
  say: string;
  regions: Region[];
}

/**
 * الحِزَم تُقرأ من جدول `README` §«الطريق»، **لا تُكتَب هنا** (الثابت ٤).
 * وحدودُها ليست ذوقاً: الإقليم ٠٦ يقول عن نفسه «آخر أقاليم التمثيل»، و٠٧
 * يفتتح بـ«ستّة أقاليم عن ما تحمله القيمة. من هنا يبدأ سؤالٌ آخر»، و٢٣ «الموضع
 * الذي تغادر فيه اللغة». فالمنهج يعلن مفاصله، والموقع يصرّفها.
 */
const BAND_ROW = /^\|\s*`(\d{2})[–—-](\d{2})`\s*\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*$/gm;

export const bands: Band[] = (() => {
  const raw = Object.values(readme)[0] ?? '';
  const out: Band[] = [];
  for (const m of raw.matchAll(BAND_ROW)) {
    const [, from, to, name, say] = m as unknown as string[];
    out.push({
      from: from!, to: to!, name: name!, say: say!,
      regions: regions.filter((r) => r.num >= from! && r.num <= to!),
    });
  }
  return out;
})();

/** الحزمة التي يسكنها إقليم — يستعملها الإقليم ليقول أين هو من الطريق */
export const bandOf = (n: string): Band | undefined =>
  bands.find((b) => n >= b.from && n <= b.to);
