/**
 * إظهار المسافات **داخل التحديد فقط** — كما يفعل VS Code مع
 * `renderWhitespace: "selection"`.
 *
 * الحيلة: لا نُدخل محارف جديدة (لأن ذلك يزيح النصّ ويكسر المحاذاة)، بل نرسم
 * النقاط والسهم في `::before` بموضع مطلق فوق المسافة الحقيقية. العرض لا يتغيّر
 * ولا بكسل واحد.
 */
import { Decoration, ViewPlugin } from '@codemirror/view';
import type { DecorationSet, EditorView, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const cache = new Map<string, Decoration>();
function deco(text: string): Decoration {
  let d = cache.get(text);
  if (!d) {
    d = Decoration.mark(
      text === '\t'
        ? { attributes: { class: 'ck-ws-tab' } }
        : { attributes: { class: 'ck-ws-space', 'data-ws': '·'.repeat(text.length) } }
    );
    cache.set(text, d);
  }
  return d;
}

/** يبني الزخارف على تقاطع (التحديد × الجزء المرئي) — لا على المستند كلّه */
function build(view: EditorView): DecorationSet {
  const b = new RangeSetBuilder<Decoration>();
  const sel = view.state.selection.ranges.filter((r) => !r.empty);
  if (!sel.length) return b.finish();

  for (const vis of view.visibleRanges) {
    for (const r of sel) {
      const from = Math.max(vis.from, r.from);
      const to = Math.min(vis.to, r.to);
      if (from >= to) continue;

      const text = view.state.doc.sliceString(from, to);
      const re = /\t| +/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const s = from + m.index;
        b.add(s, s + m[0].length, deco(m[0]));
      }
    }
  }
  return b.finish();
}

export const whitespaceOnSelection = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = build(view); }
    update(u: ViewUpdate) {
      if (u.docChanged || u.selectionSet || u.viewportChanged) this.decorations = build(u.view);
    }
  },
  { decorations: (v) => v.decorations }
);
