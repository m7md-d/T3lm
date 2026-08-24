import { useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

/**
 * مختبر تخطيط البنية.
 *
 * الادّعاء (الإقليم ٠١): «`A` و`B` تحملان نفس الحقول تماماً، وتختلفان في الحجم
 * بمقدار الثلث». هنا يقلبه القارئ بيده: يعيد ترتيب الحقول فيرى الحشو يظهر
 * ويختفي، والحجم يهبط من ٢٤ إلى ١٦.
 *
 * قواعد التخطيط هي قواعد Go: كل حقل يبدأ عند إزاحة تقبل القسمة على محاذاته،
 * والحجم يُقرَّب لأكبر محاذاة، وحقلٌ صفريّ في النهاية يضيف بايت حشو.
 */
interface Kind { name: string; size: number; align: number; }

const KINDS: Kind[] = [
  { name: 'string', size: 16, align: 8 },
  { name: '[]byte', size: 24, align: 8 },
  { name: 'bool', size: 1, align: 1 },
];

interface Cell { kind: 'field' | 'pad'; label?: string; type?: string; at: number; len: number; }

function layout(fields: Kind[]) {
  const cells: Cell[] = [];
  let off = 0;
  let maxAlign = 1;
  fields.forEach((f, i) => {
    const pad = (f.align - (off % f.align)) % f.align;
    if (pad) { cells.push({ kind: 'pad', at: off, len: pad }); off += pad; }
    cells.push({ kind: 'field', label: NAMES[i] ?? String.fromCharCode(97 + i), type: f.name, at: off, len: f.size });
    off += f.size;
    maxAlign = Math.max(maxAlign, f.align);
  });
  const tail = (maxAlign - (off % maxAlign)) % maxAlign;
  if (tail) cells.push({ kind: 'pad', at: off, len: tail });
  return { cells, size: off + tail, align: maxAlign, wasted: cells.filter((c) => c.kind === 'pad').reduce((s, c) => s + c.len, 0) };
}

/* حقول `Record` من الإقليم ٠٠ بالضبط: ٤١ بايتاً تصير ٤٨ */
const START: Kind[] = [KINDS[0]!, KINDS[1]!, KINDS[2]!];
const NAMES = ['Key', 'Value', 'Deleted'];

export default function LayoutLab() {
  const [fields, setFields] = useState<Kind[]>(START);
  const { cells, size, align, wasted } = useMemo(() => layout(fields), [fields]);

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setFields(next);
  };

  const best = useMemo(() => layout([...fields].sort((a, b) => b.align - a.align)).size, [fields]);
  const optimal = size === best;

  return (
    <section className="lab">
      <header className="lab-head">
        <span className="lab-tag">مختبر</span>
        <h3>حقول <span className="en">Record</span> — أعِد ترتيبها</h3>
        <p>هذه بنية المخزن في الإقليم ٠٠. مجموع حقولها ٤١ بايتاً. جرّب كل ترتيب.</p>
      </header>

      <div className="lab-fields">
        {fields.map((f, i) => (
          <div key={i} className="chip" data-t={f.name}>
            <button type="button" onClick={() => move(i, 1)} disabled={i === fields.length - 1}
                    aria-label="أخّر الحقل"><ChevronLeft size={14} /></button>
            <span><b>{NAMES[i] ?? ''}</b> {f.name}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                    aria-label="قدّم الحقل"><ChevronRight size={14} /></button>
          </div>
        ))}
      </div>

      <div className="lab-bytes" style={{ ['--n' as string]: size }}>
        {cells.map((c, i) => (
          /* الخانة الأضيق من أربعة بايتات لا تسع اسماً — والاسم المقصوص يقرأه
             القارئ كلمةً أخرى. يبقى في `title` وفي البطاقة فوقه. */
          <div key={i} className="seg" data-pad={c.kind === 'pad' || undefined}
               data-narrow={c.len < 4 || undefined}
               style={{ ['--len' as string]: c.len, ['--at' as string]: c.at }}
               title={c.kind === 'pad' ? `حشو ${c.len} بايت` : `${c.label} ${c.type} — إزاحة ${c.at}`}>
            <span className="en">{c.kind === 'pad' ? `+${c.len}` : c.label}</span>
          </div>
        ))}
      </div>
      <div className="lab-ruler" aria-hidden="true">
        {Array.from({ length: Math.max(1, size / 8) }, (_, i) => <span key={i}>{i * 8}</span>)}
      </div>

      <div className="lab-out">
        <span className="lab-stat"><i className="en">unsafe.Sizeof</i><b className="num">{size}</b></span>
        <span className="lab-stat"><i className="en">unsafe.Alignof</i><b className="num">{align}</b></span>
        <span className="lab-stat" data-warn={wasted > 0 || undefined}><i>حشوٌ ضائع</i><b className="num">{wasted}</b></span>
        <span className="lab-verdict" data-ok={optimal || undefined}>
          {optimal ? 'لا ترتيب أفضل — الضياع في الذيل' : `يمكن الوصول إلى ${best}`}
        </span>
      </div>
    </section>
  );
}
