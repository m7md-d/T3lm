import { useState } from 'react';
import { fileOf } from '../content/sources';
import { highlight, langOfFile } from '../lib/hl';
import { store } from '../lib/store';

/**
 * بلوك كود. والمقتطع الموسوم `<!-- part: PATH -->` يعرض مسار ملفّه، لأن
 * المقتطع لا يُترجَم وحده وملفُّه يُترجَم.
 *
 * وفتحُ الملفّ كاملاً **مشروط**: الأسلوب `kernel-dfs` §٧ يجعل `programs/kernel/`
 * مرجعاً مفتوحاً ويشترط أن **يُكتَب التوقّع قبل فتح المصدر**. فالشرط هنا سلوك
 * لا نصيحة — ويُسأل مرّةً واحدةً في الفصل.
 */
export function CodeBlock({ lang, code, file, chapter }: {
  lang: string; code: string; file: string | null; chapter: string;
}) {
  const full = file ? fileOf(file) : null;
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState(false);
  const [text, setText] = useState(() => store.prediction(`src:${chapter}`) ?? '');
  const passed = (store.prediction(`src:${chapter}`) ?? '').trim().length > 0;

  const want = () => {
    if (passed) { setOpen((v) => !v); return; }
    setAsking(true);
  };

  const save = () => {
    if (!text.trim()) return;
    store.setPrediction(`src:${chapter}`, text.trim());
    setAsking(false);
    setOpen(true);
  };

  const shown = open && full ? full : code;
  const shownLang = open && file ? langOfFile(file) : lang;

  return (
    <>
      <div className="code">
        <div className="code-top">
          {file ? <span className="code-file">programs/{file}</span> : <span className="code-file">{lang}</span>}
          <span className="code-sp" />
          {full && (
            <button type="button" className="code-open" onClick={want} aria-expanded={open}>
              {open ? 'المقتطع' : 'الملفّ كاملاً'}
            </button>
          )}
        </div>
        <pre><code dangerouslySetInnerHTML={{ __html: highlight(shown, shownLang) }} /></pre>
      </div>

      {asking && !passed && (
        <div className="gate">
          <div className="gate-h">قبل أن يُفتَح المصدر: ما الذي تتوقّع أن تجده فيه؟</div>
          <div className="gate-s">
            أيُّ حالةٍ يجب أن توجد، وأيُّ ثابتٍ يجب أن يصحّ، وأيُّ آليةٍ عتادية لازمة.
          </div>
          <textarea className="write" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="btn-row">
            <button type="button" className="btn btn-go" onClick={save} disabled={!text.trim()}>
              افتح المصدر
            </button>
            <button type="button" className="btn" onClick={() => setAsking(false)}>لاحقاً</button>
          </div>
        </div>
      )}
    </>
  );
}
