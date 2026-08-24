import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import {
  EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter,
  drawSelection, rectangularSelection, crosshairCursor, keymap, highlightSpecialChars,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentUnit, bracketMatching, foldGutter, foldKeymap, indentOnInput } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';
import { editorTheme, editorHighlight } from './theme';
import { whitespaceOnSelection } from './whitespace';
import { selectionMatches } from './selectionMatches';

export type Lang = 'c' | 'go' | 'javascript' | 'python' | 'text';

/** اللغات تُحمَّل كسولاً: صفحة بلا محرّر لا تدفع ثمن أي منها */
const LANGS: Record<string, () => Promise<Extension>> = {
  /* لا وضع C خالصاً في المنظومة، وC مجموعةٌ جزئية من قواعد C++ فيما
     يخصّ التلوين والمسافات. */
  c: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  go: () => import('@codemirror/lang-go').then((m) => m.go()),
  javascript: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  python: () => import('@codemirror/lang-python').then((m) => m.python()),
};

export interface CodeEditorHandle {
  getValue(): string;
  setValue(text: string): void;
  focus(): void;
}

export interface CodeEditorProps {
  value?: string;
  lang?: Lang;
  readOnly?: boolean;
  /** Go تستعمل التاب (gofmt) — لذلك هو الافتراضي */
  useTabs?: boolean;
  tabSize?: number;
  minHeight?: string;
  onChange?: (value: string) => void;
}

/**
 * محرّر حقيقي: أرقام أسطر، طيّ، أقواس متطابقة، تراجع، بحث، **دعم التاب**،
 * وإظهار المسافات (نقاط) والتاب (سهم) عند التحديد — كما في VS Code.
 */
const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor(
  { value = '', lang = 'go', readOnly = false, useTabs = true, tabSize = 4, minHeight = '120px', onChange },
  ref
) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const langC = useRef(new Compartment());
  const cb = useRef(onChange);
  cb.current = onChange;

  useImperativeHandle(ref, () => ({
    getValue: () => view.current?.state.doc.toString() ?? '',
    setValue: (text: string) => view.current?.dispatch({
      changes: { from: 0, to: view.current.state.doc.length, insert: text },
    }),
    focus: () => view.current?.focus(),
  }), []);

  useEffect(() => {
    if (!host.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(), highlightActiveLineGutter(), highlightActiveLine(),
        highlightSpecialChars(), foldGutter(), history(), drawSelection(),
        rectangularSelection(), crosshairCursor(), indentOnInput(),
        bracketMatching(), closeBrackets(),
        selectionMatches,
        EditorState.tabSize.of(tabSize),
        indentUnit.of(useTabs ? '\t' : ' '.repeat(tabSize)),
        whitespaceOnSelection,
        editorTheme, editorHighlight,
        langC.current.of([]),
        EditorState.readOnly.of(readOnly),
        EditorView.lineWrapping,
        /* التاب يُزيح ولا يقفز خارج المحرّر. Escape ثم Tab يخرج — شرط وصول. */
        keymap.of([
          ...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap,
          ...historyKeymap, ...foldKeymap, indentWithTab,
        ]),
        EditorView.updateListener.of((u) => { if (u.docChanged) cb.current?.(u.state.doc.toString()); }),
        EditorView.theme({ '&': { minHeight } }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current });
    return () => { view.current?.destroy(); view.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let dead = false;
    const load = LANGS[lang];
    if (!load) return;
    load().then((ext) => {
      if (!dead && view.current) view.current.dispatch({ effects: langC.current.reconfigure(ext) });
    });
    return () => { dead = true; };
  }, [lang]);

  return <div className="ck-editor-host" ref={host} />;
});

export default CodeEditor;
