/**
 * إبراز نظائر التحديد.
 *
 * **يُرسَم بطبقة (layer) لا بزخارف سطرية.** هذه هي الآلية نفسها التي يرسم بها
 * `drawSelection` التحديدَ الأصلي: `RectangleMarker.forRange` يبني المستطيلات
 * بالهندسة نفسها — ارتفاع السطر كاملاً، بلا فجوات بين الأسطر، وبلا اختلاف عن
 * التحديد العادي. الزخرفة السطرية (`Decoration.mark`) تُلوّن صندوق المحرف لا
 * صندوق السطر، فتخرج أقصر ومربكة بجانب التحديد.
 *
 * وسبب عدم استعمال `highlightSelectionMatches` من المكتبة: تأخذ نصّ التحديد
 * بلا `trim` (انظر `getDeco` في @codemirror/search)، فتحديد مسافة واحدة يطابق
 * كل مسافة في الملف. والشرط الصحيح شرطٌ واحد:
 * **إن كان التحديد فراغاً خالصاً، لا تُبرز شيئاً.**
 */
import { layer, RectangleMarker } from '@codemirror/view';
import type { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { SearchCursor } from '@codemirror/search';

const MAX_QUERY = 200;
const MAX_MATCHES = 200;

function markers(view: EditorView): readonly RectangleMarker[] {
  const { state } = view;
  const sel = state.selection;
  if (sel.ranges.length > 1) return [];

  const range = sel.main;
  if (range.empty) return [];

  const len = range.to - range.from;
  if (len > MAX_QUERY) return [];

  const query = state.sliceDoc(range.from, range.to);

  /* ── الاستثناء الوحيد: الفراغ الخالص ── */
  if (!query.trim()) return [];

  const out: RectangleMarker[] = [];
  let n = 0;
  for (const part of view.visibleRanges) {
    const cursor = new SearchCursor(state.doc, query, part.from, part.to);
    while (!cursor.next().done) {
      const { from, to } = cursor.value;
      /* لا تُبرز التحديد نفسه — التحديد الأصلي يرسمه بالفعل */
      if (from === range.from && to === range.to) continue;
      if (++n > MAX_MATCHES) return [];
      out.push(...RectangleMarker.forRange(view, 'ck-match', EditorSelection.range(from, to)));
    }
  }
  return out;
}

export const selectionMatches = layer({
  above: false,
  class: 'ck-match-layer',
  update: (u) => u.docChanged || u.selectionSet || u.viewportChanged || u.geometryChanged,
  markers,
});
