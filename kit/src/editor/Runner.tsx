import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useDraft } from './useDraft';
import CodeEditor from './CodeEditor';
import type { CodeEditorHandle, Lang } from './CodeEditor';
import type { Runtime, RunResult } from './runtimes/types';
import Terminal from '../terminal/Terminal';
import type { TerminalProps } from '../terminal/Terminal';

/**
 * كل نصّ يراه المستخدم قابل للتجاوز، و`ReactNode` لا `string` **عمداً**: أيقونة
 * الزرّ اختيارُ المنهج لا اختيارُ العدّة. والعدّة لا ترسم أيقونات ولا تصنع أصولاً
 * — رمزٌ مرسوم باليد شبيهٌ بشيء معروف يخرج مكسوراً، فيُستورَد من طقم حقيقي.
 */
export interface RunnerLabels {
  copy: ReactNode;
  copied: ReactNode;
  reset: ReactNode;
  run: ReactNode;
  running: ReactNode;
  /** يظهر حين يكون المعروض مسودّة القارئ لا كود المؤلّف */
  draft: ReactNode;
  /** اختصار التشغيل كما يُعرَض. اجعله '' لإخفائه */
  shortcut: ReactNode;
  noticePrefix: ReactNode;
}

export const defaultRunnerLabels: RunnerLabels = {
  copy: 'نسخ',
  copied: 'نُسخ',
  reset: 'استرجاع',
  run: 'تشغيل',
  running: 'يُنفَّذ…',
  draft: 'مسودّتك',
  shortcut: '⌘⏎',
  noticePrefix: 'انتبه:',
};

/**
 * `run`  محرّر كامل + تشغيل.
 * `edit` محرّر بلا تشغيل (تمارين قراءة وتعديل ذهني).
 * `view` **عرض فقط**: للقراءة، بلا تحرير وبلا تشغيل وبلا حفظ — للمقاطع التي
 *        ليست برنامجاً كاملاً، فتشغيلها وحدها بلا معنى.
 */
export type RunnerMode = 'run' | 'edit' | 'view';

export interface RunnerProps {
  /** الكود الأوّلي — وإليه يعود زرّ الاسترجاع */
  initial: string;
  mode?: RunnerMode;
  /**
   * هويّة مستقرّة لهذا المحرّر. **بدونها ينتقل الكود بين المحرّرات** حين تُعاد
   * استعمال المكوّنات، وتضيع المسودّة عند تغيّر الصفحة.
   */
  persistKey?: string;
  lang?: Lang;
  runtime?: Runtime;
  filename?: string;
  useTabs?: boolean;
  tabSize?: number;
  minHeight?: string;
  /**
   * تحذير صدق مُعلَن على هذا البلوك بعينه: موضعٌ يختلف فيه سلوك المفسّر داخل
   * المتصفّح عن سلوك الأداة الحقيقية. يظهر **قبل** التشغيل لا بعده، لأن القارئ
   * الذي رأى مخرَجاً مخالفاً بلا إنذار يبني اعتقاداً خاطئاً ثم يدافع عنه.
   */
  notice?: ReactNode;
  /** يُعرَض حين لا يوجد محرّك تنفيذ */
  fallback?: { label: ReactNode; href?: string };
  /** تجاوز نصوص شريط الأدوات — يُدمَج مع الافتراضي */
  labels?: Partial<RunnerLabels>;
  /** تخصيص لوحة المخرَج: المحثّ، تأخيره، نصوصه */
  terminal?: Pick<TerminalProps, 'prompt' | 'promptDelay' | 'labels' | 'className' | 'command'>;
  /** لتخصيص المظهر من المنهج بلا تعديل العدّة */
  className?: string;
}

const EXT: Record<string, string> = { go: 'go', python: 'py', javascript: 'js', text: 'txt' };
/** الأمر الذي كنت ستكتبه في طرفيتك لتشغيل هذا الملف */
const CMD: Record<string, (f: string) => string> = {
  go: (f) => `go run ${f}`,
  python: (f) => `python ${f}`,
  javascript: (f) => `node ${f}`,
};

/**
 * بلوك كود قابل للتحرير والتشغيل داخل صفحة المنهج.
 * الشكل من متغيّرات CSS، والنصوص والأيقونات من `labels` — العدّة لا تفرض لوناً
 * ولا كلمة ولا رمزاً.
 *
 * **لا يُشغَّل شيء إلا بضغطة القارئ.** لا تشغيل تلقائي عند الظهور ولا عند كشف
 * جواب: التشغيل فعلُه هو، وسحبُه منه يسحب معه معنى التجربة.
 */
export default function Runner({
  initial, mode = 'run', persistKey, lang = 'go', runtime, filename,
  useTabs = true, tabSize = 4, minHeight = '140px', notice, fallback, labels, terminal, className,
}: RunnerProps) {
  const ed = useRef<CodeEditorHandle>(null);
  const view = mode === 'view';
  const draft = useDraft(view ? undefined : persistKey, initial);
  const [res, setRes] = useState<RunResult | null>(null);
  const [runs, setRuns] = useState(0);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const L = useMemo<RunnerLabels>(() => ({ ...defaultRunnerLabels, ...labels }), [labels]);
  const name = filename ?? `main.${EXT[lang] ?? 'txt'}`;

  const run = useCallback(async () => {
    if (!runtime || busy) return;
    setBusy(true);
    setRes(null);
    try {
      setRes(await runtime.run(ed.current?.getValue() ?? ''));
      setRuns((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }, [runtime, busy]);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(ed.current?.getValue() ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  return (
    <div
      className={[className, 'ck-editor', view && 'ck-ed-view'].filter(Boolean).reverse().join(' ')}
      data-mode={mode}
      onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(); } }}
    >
      <div className="ck-ed-bar">
        <span className="ck-ed-name">
          {name}
          {/* الغموض هو العطب: القارئ يجب أن يعرف أن ما أمامه كتابته هو */}
          {draft.dirty && <span className="ck-ed-draft">{L.draft}</span>}
        </span>
        <div className="ck-ed-actions">
          <button type="button" className="ck-ed-btn" onClick={copy}>
            {copied ? L.copied : L.copy}
          </button>
          {!view && (
            <button type="button" className="ck-ed-btn" data-on={draft.dirty || undefined}
                    onClick={() => { draft.reset(); ed.current?.setValue(initial); setRes(null); }}>
              {L.reset}
            </button>
          )}
          {mode === 'run' && runtime ? (
            <button type="button" className="ck-ed-btn ck-ed-run" onClick={run} disabled={busy}>
              {busy ? L.running : L.run}
              {L.shortcut ? <kbd>{L.shortcut}</kbd> : null}
            </button>
          ) : mode === 'run' && fallback ? (
            <a className="ck-ed-btn" href={fallback.href} target="_blank" rel="noreferrer" onClick={copy}>
              {fallback.label}
            </a>
          ) : null}
        </div>
      </div>

      {/* المفتاح يجمع الهويّة والبصمة: تغيّر أيّهما محرّرٌ آخر، فيُعاد بناؤه */}
      <CodeEditor
        key={`${draft.storageKey ?? ''}#${draft.rev}`}
        ref={ed} value={draft.value} lang={lang} readOnly={view}
        useTabs={useTabs} tabSize={tabSize} minHeight={minHeight}
        onChange={view ? undefined : draft.save}
      />

      {(notice ?? runtime?.fidelity) && (
        <p className="ck-ed-notice">
          <b>{L.noticePrefix}</b> {notice ?? runtime?.fidelity}
        </p>
      )}

      {res && (
        <div className="ck-ed-out">
          <Terminal
            command={terminal?.command ?? CMD[lang]?.(name)}
            stdout={res.stdout} stderr={res.stderr} note={res.note}
            status={res.status} ms={res.ms} runKey={runs}
            prompt={terminal?.prompt} promptDelay={terminal?.promptDelay}
            labels={terminal?.labels} className={terminal?.className}
          />
        </div>
      )}
    </div>
  );
}
