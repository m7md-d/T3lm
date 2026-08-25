/**
 * الحِزَم والبديهيات — **تُقرأ من `../../README.md` ولا تُكتب هنا**.
 *
 * المؤلّف قرّر في المصدر أن الطريق يُبنى حزمةً حزمة، وجدولاه (الحِزَم الثمان،
 * والسطر الذي تفكّكه كلٌّ منها من `box`) مصدرٌ يُقرأ آلياً: تحريرُ الجدول يحرّك
 * الموقع، ولا يُلمَس الكود.
 */
import readme from '../../../README.md?raw';
import type { Axiom, Package } from '../lib/types';

const rows = (table: string) =>
  table.split('\n')
    .filter((l) => l.trim().startsWith('|') && !/^\|[\s|:-]+\|$/.test(l.trim()))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()));

const between = (from: RegExp, to: RegExp) => {
  const a = readme.search(from);
  if (a < 0) return '';
  const rest = readme.slice(a);
  const b = rest.slice(1).search(to);
  return b < 0 ? rest : rest.slice(0, b + 1);
};

const strip = (s: string) => s.replace(/^\*\*|\*\*$/g, '').replace(/`/g, '').trim();

/* ── الحِزَم: `| `00–01` | **البداية** | … |` ── */
const pkgTable = between(/^\| \| \| \|$/m, /^###/m);
const lineTable = between(/^\| الحزمة \| السطر الذي تفكّكه في `box` \|$/m, /^\*\*/m);

const lineOf = (id: string): string => {
  const r = rows(lineTable).find((c) => c[0]?.includes(id.replace('-', '–')));
  return r?.[1] ?? '';
};

export const packages: Package[] = rows(pkgTable)
  .filter((c) => /^`\d\d[–-]\d\d`$/.test(c[0] ?? ''))
  .map((c) => {
    const [from, to] = strip(c[0]!).split(/[–-]/) as [string, string];
    const id = `${from}-${to}`;
    return {
      id,
      range: [from, to],
      name: strip(c[1] ?? ''),
      takes: c[2] ?? '',
      line: lineOf(id),
      regions: [],
    };
  });

/* ── البديهيات الخمس ── */
const axTable = between(/^\| # \| البديهية \| أوّل ما يتساقط منها \|$/m, /^##/m);

const AR_DIGITS: Record<string, number> = { '١': 1, '٢': 2, '٣': 3, '٤': 4, '٥': 5 };

export const axioms: Axiom[] = rows(axTable)
  .filter((c) => c[0] && AR_DIGITS[c[0]!] !== undefined)
  .map((c) => ({ n: AR_DIGITS[c[0]!]!, claim: c[1] ?? '', falls: c[2] ?? '' }));

/** أيّ حزمةٍ يقع فيها هذا الإقليم. */
export const packageOf = (no: string): Package | undefined =>
  packages.find((p) => no >= p.range[0] && no <= p.range[1]);
