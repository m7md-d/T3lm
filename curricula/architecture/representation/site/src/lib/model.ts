/**
 * منقولٌ حرفياً عن `../../programs/model.py` — من السطح إلى الـIR، والتحويلُ
 * موضعُ التحقّق، والموضعُ محمولٌ معه.
 *
 * ويفحص `scripts/conform.ts` أنّ رفضَه هو رفضُ Python بنصّه وموضعه.
 */
import { DslError, parse } from './dsl';
import type { Token } from './dsl';

export const TYPES: Record<string, Record<string, string>> = {
  source: { out: 'flow' },
  filter: { in: 'flow', out: 'flow' },
  sink: { in: 'flow' },
  meter: { in: 'signal' },
};
export const DEFAULT_TYPE = 'filter';

export type Component = {
  id: string;
  label: string;
  kind: string;
  params: Record<string, string | number>;
  at: Token;
  ports: Record<string, string>;
};

export type Edge = {
  src: Component; srcPort: string;
  dst: Component; dstPort: string;
  at: Token;
};

export type Diagram = { components: Map<string, Component>; edges: Edge[] };

/** يبني الـIR ويرفض بموضع. ولا يمرّ إلى الرسم إلا ما نجا من هنا. */
export function build(source: string): Diagram {
  const table = new Map<string, Component>();
  const edges: Edge[] = [];

  for (const node of parse(source)) {
    if (node.t !== 'Box') continue;
    if (table.has(node.name)) {
      const first = table.get(node.name)!.at;
      throw new DslError(
        `الاسم «${node.name}» معرَّفٌ سلفاً في السطر ${first.line}`,
        node.at.line, node.at.col, source);
    }
    const kind = String(node.props['type'] ?? DEFAULT_TYPE);
    if (!(kind in TYPES)) {
      throw new DslError(
        `نوعٌ لا تعرفه اللغة: «${kind}» — المعروف ${Object.keys(TYPES).join(', ')}`,
        node.at.line, node.at.col, source);
    }
    table.set(node.name, {
      id: node.name, label: node.label, kind, params: node.props,
      at: node.at, ports: TYPES[kind]!,
    });
  }

  for (const node of parse(source)) {
    if (node.t !== 'Link') continue;
    const ends: [Component, string][] = [];
    for (const side of [node.src, node.dst]) {
      const comp = table.get(side.box);
      if (comp === undefined) {
        const known = [...table.keys()].sort(byCode).join(', ') || 'لا شيء';
        throw new DslError(
          `لا صندوقَ اسمُه «${side.box}» — المعرَّف ${known}`,
          side.at.line, side.at.col, source);
      }
      if (!(side.port in comp.ports)) {
        const have = Object.keys(comp.ports).join(', ') || 'لا منافذ';
        throw new DslError(
          `المنفذ «${side.port}» ليس في نوع «${comp.kind}» — منافذُه ${have}`,
          side.at.line, side.at.col, source);
      }
      ends.push([comp, side.port]);
    }
    const [a, b] = ends as [[Component, string], [Component, string]];
    const [src, sport] = a;
    const [dst, dport] = b;
    if (src.ports[sport] !== dst.ports[dport]) {
      throw new DslError(
        `منفذان لا يتوافقان: ${src.id}.${sport} من نوع «${src.ports[sport]}» ` +
        `و${dst.id}.${dport} من نوع «${dst.ports[dport]}»`,
        node.at.line, node.at.col, source);
    }
    edges.push({ src, srcPort: sport, dst, dstPort: dport, at: node.at });
  }
  return { components: table, edges };
}

/** ترتيبُ Python للسلاسل بنقاط الترميز — و`localeCompare` يخالفه. */
export const byCode = (x: string, y: string): number => (x < y ? -1 : x > y ? 1 : 0);

export const SAMPLE = [
  'box a "المصدر"   { type: source }',
  'box f "المرشّح"  { type: filter }',
  'box s "المصبّ"   { type: sink }',
  'link a.out -> f.in',
  'link f.out -> s.in',
  '',
].join('\n');
