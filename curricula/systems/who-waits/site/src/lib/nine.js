/**
 * استخراج بنيتين من الإقليم ٠٩ **من الماركداون نفسه** — لا نسخ نصٍّ في الكود:
 *   • الأنماط الثمانية المتكرّرة  ⇒ صفحة الخيوط
 *   • الجدول الجامع للأربعة       ⇒ صفحة المصفوفة
 * كلتاهما موجودتان في المنهج أصلاً؛ الموقع يصرّفهما ولا يفرّعهما.
 */

const AR = '٠١٢٣٤٥٦٧٨٩';
export const toAscii = (s) => String(s).replace(/[٠-٩]/g, (d) => AR.indexOf(d));

/** الأنماط: قائمةٌ مرقّمة تحت «الأنماط التي تكرّرت» */
export function extractPatterns(raw) {
  const sec = raw.split(/^###\s+الأنماط التي تكرّرت.*$/m)[1];
  if (!sec) return [];
  const body = sec.split(/^###\s+/m)[0];
  const out = [];
  const re = /^(\d+)\.\s+([\s\S]*?)(?=^\d+\.\s+|^\s*$(?![\s\S]*^\d+\.)|\Z)/gm;
  const lines = body.split('\n');
  let cur = null;
  for (const ln of lines) {
    const m = ln.match(/^(\d+)\.\s+(.*)$/);
    if (m) {
      if (cur) out.push(cur);
      cur = { n: +m[1], text: m[2] };
    } else if (cur && /^\s{2,}\S/.test(ln)) {
      cur.text += ` ${ln.trim()}`;
    } else if (cur && ln.trim() === '') {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  void re;

  return out.map((p) => {
    const t = p.text.match(/^\*\*(.+?)\*\*/);
    const title = t ? t[1].replace(/\.$/, '') : p.text.slice(0, 40);
    const rest = p.text.replace(/^\*\*.+?\*\*\s*/, '');
    const ids = [...new Set((p.text.match(/٠[٠-٩]/g) || []))];
    return { n: p.n, title, rest, ids };
  });
}

/** الجدول الجامع: أوّل جدولٍ بعد «الجدول الجامع» */
export function extractMatrix(raw) {
  const sec = raw.split(/^###\s+الجدول الجامع\s*$/m)[1];
  if (!sec) return null;
  const rows = sec
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|'));
  if (rows.length < 3) return null;
  const cells = (l) =>
    l
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  const head = cells(rows[0]).slice(1);
  const body = rows
    .slice(2)
    .map((l) => {
      const c = cells(l);
      return { label: c[0].replace(/\*\*/g, ''), cells: c.slice(1) };
    })
    .filter((r) => r.label);
  return { head, body };
}
