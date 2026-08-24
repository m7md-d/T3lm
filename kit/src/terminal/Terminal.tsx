import { useEffect, useMemo, useState } from 'react';
import type { RunStatus } from '../editor/runtimes/types';

export interface TerminalLabels {
  status: Record<RunStatus, string>;
  empty: string;
}

export const defaultTerminalLabels: TerminalLabels = {
  status: { ok: 'تمّ', error: 'خطأ', timeout: 'مهلة', unavailable: 'غير متاح' },
  empty: 'بلا مخرَج.',
};

export interface TerminalProps {
  /** الأمر المعروض بعد المحثّ الأول — مثل `go run main.go` */
  command?: string;
  stdout?: string;
  stderr?: string;
  /** ملاحظة قبل المخرَج: سبب عدم التوفّر أو تحذير صدق */
  note?: string;
  status?: RunStatus;
  ms?: number;
  /** رمز المحثّ */
  prompt?: string;
  /** تأخير ظهور المحثّ الختامي بالمللي ثانية — لحظة «رجعت الصدفة» */
  promptDelay?: number;
  /** يعيد تشغيل التأخير عند تغيّره — مرّره من عدّاد التشغيل */
  runKey?: string | number;
  labels?: Partial<TerminalLabels> & { status?: Partial<Record<RunStatus, string>> };
  className?: string;
}

/**
 * لوحة مخرَج بهيئة طرفية: محثّ في البداية، ثم المخرَج، ثم محثّ ختامي يظهر
 * بعد لحظة — كما ترجع الصدفة بعد انتهاء الأمر. للقراءة فقط، فلا مؤشّر وامض.
 *
 * مكوّن مستقلّ: يُستعمل وحده لعرض مخرَج جاهز، أو يرثه `Runner` لعرض نتيجة
 * التشغيل. بلا لون ولا شكل ولا نصّ مثبَّت.
 */
export default function Terminal({
  command, stdout, stderr, note, status, ms,
  prompt = '$', promptDelay = 100, runKey, labels, className,
}: TerminalProps) {
  const L = useMemo<TerminalLabels>(() => ({
    ...defaultTerminalLabels,
    ...labels,
    status: { ...defaultTerminalLabels.status, ...labels?.status },
  }), [labels]);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), promptDelay);
    return () => clearTimeout(t);
  }, [runKey, stdout, stderr, note, promptDelay]);

  const nothing = !stdout && !stderr && !note;

  return (
    <div className={className ? `ck-term ${className}` : 'ck-term'} data-status={status}>
      <div className="ck-term-head">
        <span className="ck-term-line">
          <span className="ck-term-prompt" aria-hidden="true">{prompt}</span>
          {command && <span className="ck-term-cmd">{command}</span>}
        </span>
        <span className="ck-term-meta">
          {status && <span className="ck-term-chip">{L.status[status] ?? status}</span>}
          {ms != null && ms > 0 && <span className="ck-term-ms">{Math.round(ms)}ms</span>}
        </span>
      </div>

      <div className="ck-term-body">
        {note && <p className="ck-term-note">{note}</p>}
        {stdout && <pre className="ck-term-stream">{stdout}</pre>}
        {stderr && <pre className="ck-term-stream ck-term-err">{stderr}</pre>}
        {nothing && <p className="ck-term-note">{L.empty}</p>}
      </div>

      {/* المحثّ الختامي: إشارة أن الأمر انتهى والصدفة رجعت.
          بلا مؤشّر وامض — الوميض يَعِد بالكتابة، واللوحة للقراءة فقط. */}
      <div className="ck-term-line ck-term-tail" data-ready={ready || undefined} aria-hidden="true">
        <span className="ck-term-prompt">{prompt}</span>
      </div>
    </div>
  );
}
