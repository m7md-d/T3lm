/**
 * الخطّة — تُقرأ من `../../../README.md`. **لا يُكتَب في الكود رقمُ فصلٍ ولا
 * اسمُ حِزمة**: جدولُ المنهج هو المصدر، وفحص المحتوى يقارنه بـ`regions/`.
 */
import { inline, plain } from '../lib/md';
import type { Axiom, Pack } from '../lib/types';

const readme = (
  import.meta.glob('../../../README.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
)['../../../README.md']!;

/** ما بين عنوانٍ وما يليه من عناوين بنفس عمقه أو أعلى. */
export function section(title: string): string {
  const re = new RegExp(`^(#{2,3})\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'm');
  const m = re.exec(readme);
  if (!m) return '';
  const depth = m[1]!.length;
  const from = readme.indexOf(m[0]) + m[0].length;
  const rest = readme.slice(from);
  const next = new RegExp(`^#{1,${depth}}\\s`, 'm').exec(rest);
  return (next ? rest.slice(0, next.index) : rest).trim();
}

const rows = (md: string): string[][] =>
  md.split('\n')
    .filter((l) => l.trim().startsWith('|') && !/^\|[\s:|-]+\|$/.test(l.trim()))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()));

const road = section('الطريق');

/** الحِزَم الأربع — صفوفها `` `00–06` `` في جدول «الطريق». */
export const packs: Pack[] = rows(road).flatMap((r) => {
  const m = /^`(\d\d)[\u2013-](\d\d)`$/.exec(r[0] ?? '');
  if (!m) return [];
  return [{
    range: `${m[1]}–${m[2]}`,
    from: Number(m[1]),
    to: Number(m[2]),
    title: plain(r[1] ?? ''),
    gist: r[2] ?? '',
    axioms: [] as string[],
  }];
});

/** سطرُ كل فصلٍ في جدول الحِزمة: `` `07` `` واسمُه وما فيه. */
export interface PlanRow { num: string; title: string; gist: string }

export const planRows: PlanRow[] = rows(road).flatMap((r) => {
  const m = /^`(\d\d)`$/.exec(r[0] ?? '');
  return m ? [{ num: m[1]!, title: plain(r[1] ?? ''), gist: r[2] ?? '' }] : [];
});

/** البديهيات الخمس الجديدة — الجدول في «البديهيات الخمس الجديدة». */
export const axioms: Axiom[] = rows(section('البديهيات الخمس الجديدة'))
  .filter((r) => /^[٠-٩]+$/.test(r[0] ?? ''))
  .map((r) => ({ n: r[0]!, claim: r[1] ?? '', falls: r[2] ?? '' }));

/** كل بديهيةٍ وحزمتُها: الحزمة الثالثة تحمل اثنتين. */
const AXIOM_PACK: Record<string, string> = {
  '٦': '00–06', '٧': '07–12', '٨': '13–18', '٩': '13–18', '١٠': '19–26',
};
for (const a of axioms) {
  const p = packs.find((x) => x.range === AXIOM_PACK[a.n]);
  if (p) p.axioms.push(a.n);
}

/** جدول المصادر العشرة. */
export const sources = rows(section('مصادر السلطة'))
  .filter((r) => r[0]?.startsWith('**'))
  .map((r) => ({ name: inline(r[0]!), decides: inline(r[1] ?? '') }));

/** جدول ما يفرضه الموضوع على الفاحص. */
export const verifyMarks = rows(section('التحقّق'))
  .filter((r) => r[0]?.startsWith('`'))
  .map((r) => ({ mark: plain(r[0]!), means: inline(r[1] ?? '') }));

export const packOf = (num: string): Pack | undefined =>
  packs.find((p) => Number(num) >= p.from && Number(num) <= p.to);

/**
 * أمرا المختبر كما في README المنهج — يُقرآن ولا يُكتبان.
 * و`verify.py` يقبل أرقام فصولٍ بعد اسمه: `python3 tools/verify.py 03 04`.
 */
export const labCommands: string[] = (/```\n([\s\S]*?)```/.exec(readme)?.[1] ?? '')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

export const verifyCommand = labCommands.find((c) => c.includes('verify.py')) ?? '';

export const readmeRaw = readme;
