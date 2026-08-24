/**
 * ثيم المحرّر — **بلا لون ولا خطّ مكتوب هنا**.
 * كل قيمة متغيّر CSS، و`derive.css` يشتقّها من هوية المنهج العالمية.
 * وضع قيمة لون حرفية في هذا الملف خرقٌ لعقد الفصل.
 */
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const v = (name: string) => `var(--ck-ed-${name})`;

export const editorTheme = EditorView.theme(
  {
    '&': {
      color: v('fg'),
      backgroundColor: v('bg'),
      fontSize: v('font-size'),
      height: '100%',
    },
    '.cm-content': {
      caretColor: v('caret'),
      fontFamily: v('font'),
      padding: '10px 0',
      lineHeight: v('line-height'),
    },
    '.cm-scroller': { fontFamily: v('font'), overflow: 'auto' },
    '&.cm-focused': { outline: 'none' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: v('caret'), borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackgroundding, .cm-selectionBackground, .cm-content ::selection':
      { backgroundColor: v('selection') },
    '&.cm-focused .cm-selectionBackground': { backgroundColor: v('selection') },
    '.cm-activeLine': { backgroundColor: v('active-line') },
    '.cm-gutters': {
      backgroundColor: v('bg'),
      color: v('gutter'),
      border: 'none',
      borderInlineEnd: `1px solid ${v('gutter-border')}`,
      userSelect: 'none',
    },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: v('gutter-active') },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 12px 0 8px', minWidth: '2.2ch' },
    '.cm-foldPlaceholder': {
      backgroundColor: 'transparent', border: `1px solid ${v('gutter')}`, color: v('gutter'),
    },
    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      backgroundColor: 'transparent', outline: `1px solid ${v('bracket')}`,
    },
    /* طبقة النظائر: مستطيلات بهندسة التحديد نفسها (RectangleMarker) */
    '.ck-match-layer': { zIndex: -1 },
    '.ck-match': {
      backgroundColor: v('selection-match'),
      borderRadius: v('match-r'),
    },
    /* المسافات المرئية عند التحديد */
    '.ck-ws-space': { position: 'relative' },
    '.ck-ws-space::before': {
      content: 'attr(data-ws)',
      position: 'absolute',
      insetInlineStart: 0,
      pointerEvents: 'none',
      color: v('whitespace'),
    },
    '.ck-ws-tab': {
      position: 'relative',
      display: 'inline-block',
      verticalAlign: 'top',
    },
    '.ck-ws-tab::before': {
      content: '"→"',
      position: 'absolute',
      insetInlineStart: '2px',
      pointerEvents: 'none',
      color: v('whitespace'),
    },
  },
  { dark: true }
);

const style = HighlightStyle.define([
  { tag: [t.keyword, t.moduleKeyword], color: v('keyword') },
  { tag: [t.controlKeyword, t.operatorKeyword], color: v('keyword-control') },
  { tag: [t.string, t.special(t.string), t.regexp], color: v('string') },
  { tag: [t.number, t.bool, t.null], color: v('number') },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: v('comment'), fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: v('function') },
  { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: v('type') },
  { tag: [t.variableName, t.propertyName, t.attributeName], color: v('variable') },
  { tag: [t.constant(t.variableName), t.standard(t.variableName)], color: v('constant') },
  { tag: [t.operator, t.punctuation, t.separator, t.bracket, t.paren, t.brace], color: v('punctuation') },
  { tag: [t.definition(t.variableName), t.definition(t.propertyName)], color: v('variable') },
  /* توجيهات ما قبل الترجمة — `#include` و`#define`. عائلةٌ قائمة في C
     وفي كل لغةٍ فيها طبقةٌ تعمل قبل المترجم. */
  { tag: [t.meta, t.processingInstruction, t.annotation], color: v('meta') },
  { tag: t.invalid, color: v('invalid') },
  { tag: [t.heading, t.strong], fontWeight: 'bold' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.link, color: v('link'), textDecoration: 'underline' },
]);

export const editorHighlight = syntaxHighlighting(style);
