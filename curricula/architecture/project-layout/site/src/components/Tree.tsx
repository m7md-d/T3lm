/**
 * الهيكل وجهان: **شجرةٌ** من العمود الأوّل، و**حوافُّ** من العمود الرابع.
 *
 * وهما نفس النصّ، فيُعرَضان متجاورين: الشكل يقول أين يسكن كل شيء، والاتّجاه يقول
 * من يعرف من. وقراءة أحدهما وحده هي بالضبط الخطأ الذي يفكّكه هذا المنهج.
 */
import { crosses, familyOf, treeOf, type Branch, type Layout } from '../lib/layout';

function Row({ b, depth }: { b: Branch; depth: number }) {
  const n = b.node;
  const fam = n ? familyOf(n.role) : 'wire';
  return (
    <>
      <li className={n ? `leaf fam-${fam}` : 'dir'} style={{ '--d': depth } as React.CSSProperties}>
        <span className="en name">{b.name}{n ? '' : '/'}</span>
        {n && <span className="en role">{n.role}</span>}
        {n && n.owns.length > 0 && (
          <span className="owns">{n.owns.map((o) => <i key={o} className="en">{o}</i>)}</span>
        )}
      </li>
      {b.children.map((c) => <Row key={c.path} b={c} depth={depth + 1} />)}
    </>
  );
}

export default function Tree({ layout }: { layout: Layout }) {
  const tree = treeOf(layout);
  const edges = layout.nodes.flatMap((n) => n.deps.map((d) => [n.path, d] as const));

  return (
    <figure className="layout">
      <figcaption>
        <b>{layout.name}</b>
        <span className="en id">{layout.id}</span>
        <span className="policy en">{layout.policy}</span>
        <span className={`guard g-${layout.enforced} en`}>{layout.enforced}</span>
      </figcaption>

      <div className="layout-body">
        <ul className="tree">
          {tree.map((b) => <Row key={b.path} b={b} depth={0} />)}
        </ul>

        <ul className="edges en">
          {edges.map(([a, b], i) => {
            const src = layout.nodes.find((n) => n.path === a)!;
            const cls = crosses(layout, a, b) ? 'cross' : '';
            return (
              <li key={i} className={`${cls} fam-${familyOf(src.role)}`}>
                <span>{a}</span>
                <em>→</em>
                <span>{b}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </figure>
  );
}
