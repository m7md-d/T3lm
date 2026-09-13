/**
 * الحِزَم والبديهيات ووسوم السلطة — تُقرأ من `../../../README.md` **برمجياً**.
 * لا يُكتب منها شيءٌ في الكود (الركيزة ١، والثابت ٤).
 */
import { inline, plain } from '../lib/md';
import type { Axiom, Pack } from '../lib/types';

const g = import.meta.glob('../../../README.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const md = Object.values(g)[0] ?? '';

/** بيانات المنهج — من `../../../curriculum.json`، ولا تُكتب هنا. */
const cj = import.meta.glob('../../../curriculum.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
export const meta = JSON.parse(Object.values(cj)[0] ?? '{}') as {
  slug: string; title: string; tagline: string; hook: string; url: string;
};

/** جسمُ قسمٍ في README حتى أوّل عنوانٍ بمستواه أو أعلى — فلا تبتلعه عناوينُه الفرعية. */
const section = (h: string): string => {
  const head = md.match(new RegExp(`^(#{2,4})\\s+${h}[^\\n]*$`, 'm'));
  if (!head) return '';
  const level = head[1]!.length;
  const from = head.index! + head[0].length;
  const rest = md.slice(from);
  const stop = rest.search(new RegExp(`^#{1,${level}}\\s`, 'm'));
  return stop === -1 ? rest : rest.slice(0, stop);
};

/** الحِزَم السبع تحت §الطريق — عنوانُ كلٍّ `### N — …`، وصفوفُها الفصول. */
export const packs: Pack[] = (() => {
  const road = section('الطريق');
  const out: Pack[] = [];
  for (const chunk of road.split(/^###\s+/m).slice(1)) {
    const head = chunk.slice(0, chunk.indexOf('\n'));
    const nums = [...chunk.matchAll(/\|\s*\[`(\d\d)`\]/g)].map((x) => Number(x[1]));
    if (!nums.length) continue;
    const from = Math.min(...nums);
    const to = Math.max(...nums);
    out.push({
      title: head.replace(/^\S+\s+—\s+/, '').trim(),
      from,
      to,
      range: `${String(from).padStart(2, '0')}–${String(to).padStart(2, '0')}`,
    });
  }
  return out;
})();

/** نبذةُ كل فصلٍ كما كتبها `README` في جدول حزمته. */
export const gists: Record<string, string> = (() => {
  const road = section('الطريق');
  const out: Record<string, string> = {};
  for (const m of road.matchAll(/\|\s*\[`(\d\d)`\]\([^)]*\)\s*\|\s*(.+?)\s*\|/g)) out[m[1]!] = m[2]!;
  return out;
})();

/** البديهيات الخمس — قائمةٌ مرقّمة، ونصُّ كلٍّ بين `**`. */
export const axioms: Axiom[] = [...section('البديهيات الخمس').matchAll(/^(\d)\.\s+\*\*(.+?)\*\*\s*$/gm)].map((m) => ({
  n: m[1]!,
  claim: m[2]!.replace(/\.$/, ''),
  where: '',
}));

/** جدول وسوم السلطة — الوسم وما يملك تقريره. */
export const tagRows: { tag: string; owner: string }[] = [
  ...section('البيئة، ومقياس الرصد').matchAll(/^\|\s*`@(\w+)`\s*\|\s*(.+?)\s*\|/gm),
].map((m) => ({ tag: m[1]!, owner: m[2]! }));

/** جدول البيئة — المعمارية والمترجم والأدوات والإقلاع والتشغيل. */
export const envRows: { what: string; value: string }[] = [
  ...section('البيئة، ومقياس الرصد').matchAll(/^\|\s*(المعمارية|المترجم والرابط|الأدوات|الإقلاع|التشغيل)\s*\|\s*(.+?)\s*\|/gm),
].map((m) => ({ what: m[1]!, value: m[2]! }));

/** «ولا يُشرَح هنا من الصفر» — قائمةٌ يفصلها `·`. */
export const assumed: string[] = (() => {
  const s = section('ولا يُشرَح هنا من الصفر').trim();
  return s ? s.replace(/\n/g, ' ').split('·').map((x) => plain(x).trim()).filter(Boolean) : [];
})();

export const inlineMd = inline;

/** «من يملك تقرير الادّعاء» لكل وسم — من جدول `README` لا من قائمةٍ في الكود. */
export const tagMeans: Record<string, string> = Object.fromEntries(tagRows.map((r) => [r.tag, r.owner]));

/**
 * حدُّ اللوحات كما كتبه `README` بعد جدول الوسوم — الجملة التي تمنع قراءة
 * التشغيل ضماناً. تُقرأ من مكانها ولا تُنسَخ.
 */
export const limitLine: string = (() => {
  const m = md.match(/\*\*والغياب في التشغيل ليس منعاً\*\*[^\n]*(\n[^\n#|]*)*/);
  return m ? m[0].replace(/\s*\n\s*/g, ' ').trim() : '';
})();
