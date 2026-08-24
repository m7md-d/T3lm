import { parseChapter } from '@t3lm/kit/md';
import type { Chapter } from '@t3lm/kit/md';

/* الماركداون في ../regions و../appendix هو المصدر الوحيد — يُقرأ ولا يُنسَخ. */
const files = import.meta.glob('../../../regions/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const readme = import.meta.glob('../../../README.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

const codes = import.meta.glob('../../../appendix/rejections.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

export interface Region {
  num: string;
  label: string;
  title: string;
  /** أوّل جملةٍ من نبذة الفصل — ادّعاؤه بكلماته هو */
  hook: string;
  chapter: Chapter;
}

function hookOf(lead: string): string {
  const first = lead
    .replace(/^> ?/gm, '')
    .split(/```/)[0]!
    .split(/\n\s*\n/)[0]!
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const cut = first.search(/[.؟!](\s|$)/);
  return (cut > 40 ? first.slice(0, cut + 1) : first).replace(/\s*[:：]$/, '');
}

export const regions: Region[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, raw]) => {
    const name = path.split('/').pop()!.replace(/\.md$/, '');
    const chapter = parseChapter(raw);
    const [head, ...rest] = chapter.heading.split('—');
    const title = rest.length ? rest.join('—').trim() : chapter.heading.trim();
    const label = rest.length ? (head ?? '').trim().replace(/\s*[٠-٩]+$/, '') : 'الإقليم';
    return { num: name.slice(0, 2), label, title, hook: hookOf(chapter.lead), chapter };
  });

export const intro: Chapter = parseChapter(Object.values(readme)[0] ?? '');

/** سلسلة الأدوات كما يعلنها المنهج — تُستخرَج ولا تُكتب في الكود. */
export const TOOLCHAIN: string = (() => {
  const sec = intro.sections.find((x) => /الإصدار المستهدف/.test(x.title));
  return sec?.raw.match(/```\s*\n([^\n]+)\n```/)?.[1]?.trim() ?? '';
})();

/**
 * البديهيات الخمس، **ولكلٍّ رمزُ الرفض الذي يحرسها**.
 *
 * الجدولان مكتوبان في موضعين مختلفين — البديهيات في الفصل ٠٠، والرموز في
 * `appendix/rejections.md` — **والمؤلّف هو من ربطهما**: عمودٌ في جدول الرموز
 * اسمه «البديهية». والوصل هنا قراءةٌ لذلك العمود.
 */
export interface Axiom {
  n: number;
  short: string;
  falls: string[];
  body: string;
  guards: { code: string; gist: string }[];
  shot: number;
}

const AR = '٠١٢٣٤٥٦٧٨٩';
const ORD = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
const arNum = (s: string) => [...s].reduce((a, c) => a * 10 + AR.indexOf(c), 0);

function rows(md: string, cols: number): string[][] {
  const re = new RegExp(`^\\|${'([^|\\n]+)\\|'.repeat(cols)}\\s*$`, 'gm');
  return [...md.matchAll(re)]
    .map((m) => m.slice(1, cols + 1).map((c) => c.trim()))
    .filter((r) => !/^-+:?$/.test(r[0]!) && r[0] !== '#' && r[0] !== 'الرمز');
}

export const AXIOMS: Axiom[] = (() => {
  const zero = regions.find((r) => r.num === '00');
  const secs = zero?.chapter.sections ?? [];
  const at = (re: RegExp) => secs.findIndex((s) => re.test(s.title));
  const table = secs[at(/لماذا خمسٌ بالذات/)]?.raw ?? '';
  const codeRows = rows(Object.values(codes)[0] ?? '', 4);

  return rows(table, 3)
    .filter((r) => /^[٠-٩]+$/.test(r[0]!))
    .map((r) => {
      const n = arNum(r[0]!);
      const ord = ORD[n - 1] ?? '';
      const i = at(new RegExp(`^${ord} —`));
      return {
        n,
        short: r[1]!,
        falls: r[2]!.split('·').map((x) => x.trim()).filter(Boolean),
        body: (secs[i]?.raw ?? '')
          .replace(/```[\s\S]*?```/g, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .trim(),
        shot: i,
        guards: codeRows
          .filter((c) => c[2]!.split('،').map((x) => arNum(x.trim())).includes(n))
          .map((c) => ({ code: c[0]!.replace(/`/g, ''), gist: c[1]! })),
      };
    })
    .sort((a, b) => a.n - b.n);
})();

/**
 * الطريق كما يعلنه `README.md` — مصدرٌ واحد لعدد الفصول وأسمائها ومحتوياتها.
 *
 * فما يُضاف إلى `regions/` وليس في الجدول (أو العكس) **يُفشِل فحص الدخان**.
 */
export interface Stop {
  num: string;
  title: string;
  gist: string;
}

export const ROAD: Stop[] = (() => {
  const sec = intro.sections.find((x) => /^الطريق/.test(x.title));
  return rows(sec?.raw ?? '', 3)
    .filter((r) => /^`\d\d`$/.test(r[0]!))
    .map((r) => ({
      num: r[0]!.replace(/`/g, ''),
      title: r[1]!.replace(/\*\*/g, '').trim(),
      gist: r[2]!,
    }));
})();

/** الفصول المُعلَنة في الطريق ولم تُكتب بعد — كشفٌ تدريجيّ يُصفّي نفسه. */
export const sealed: Stop[] = ROAD.filter((s) => !regions.some((r) => r.num === s.num));
