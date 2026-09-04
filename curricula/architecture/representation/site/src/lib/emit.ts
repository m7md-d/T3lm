/**
 * منقولٌ حرفياً عن `../../programs/emit.py` — البنية إلى نصّ، شكلٌ واحدٌ لكلّ
 * بنية. ويفحص `scripts/conform.ts` أنّ مخرَجه يطابق مخرَج Python حرفاً بحرف.
 */
import { byCode } from './model';
import type { Diagram, Edge } from './model';

/** يكتب المخطّط بشكلٍ قانونيّ: ترتيبٌ مثبَّت، ولا مشتقّ يُكتَب. */
export function dump(diagram: Diagram): string {
  const lines: string[] = [];

  const comps = [...diagram.components.values()].sort((a, b) => byCode(a.id, b.id));
  for (const comp of comps) {
    const keys = Object.keys(comp.params).filter((k) => k !== 'type').sort(byCode);
    const body = keys.map((k) => `${k}: ${comp.params[k]}`).join(', ');
    const tail = ` { type: ${comp.kind}` + (body ? `, ${body}` : '') + ' }';
    lines.push(`box ${comp.id} "${comp.label}"${tail}`);
  }

  /* المفتاح رباعيّ ويُقارَن عنصراً عنصراً — كما تقارن Python الصفوف. */
  const key = (e: Edge) => [e.src.id, e.srcPort, e.dst.id, e.dstPort];
  const edges = [...diagram.edges].sort((a, b) => {
    const x = key(a), y = key(b);
    for (let i = 0; i < x.length; i++) {
      const c = byCode(x[i]!, y[i]!);
      if (c) return c;
    }
    return 0;
  });
  for (const e of edges) lines.push(`link ${e.src.id}.${e.srcPort} -> ${e.dst.id}.${e.dstPort}`);

  return lines.join('\n') + '\n';
}
