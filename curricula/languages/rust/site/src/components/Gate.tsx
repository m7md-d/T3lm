import { useState } from 'react';
import { store } from '../lib/store';

/**
 * بوّابة تنبّؤ — يُكتب التوقّع، ثم يُكشَف المخرَج المسجَّل ويبقى التوقّع بجانبه.
 *
 * ثلاثٌ في الفصل بحدٍّ أقصى (`profiles/default.md` §٤)، وبلا مؤقّتٍ ولا عدّ
 * محاولات: **يُفتَح بيد القارئ متى شاء**.
 */
export default function Gate({ id, output, note }: { id: string; output: string; note?: string }) {
  const saved = store.prediction(id);
  const [draft, setDraft] = useState(saved ?? '');
  const [open, setOpen] = useState(Boolean(saved));

  if (open) {
    return (
      <figure className="rec">
        <figcaption className="rec-head">
          <span className="rec-tag">مخرَج مسجَّل</span>
          <span className="rec-src en">rustc 1.98.0</span>
        </figcaption>
        <pre className="rec-body en">{output}</pre>
        <figcaption className="rec-foot">
          {note ? <><b>مقتطع — {note}.</b> </> : null}
          نُقِل من تشغيل المؤلّف. شغّله عندك وقارن؛ الاختلاف يستحقّ سؤالاً.
        </figcaption>
        {saved !== undefined && saved.trim() && (
          <details className="rec-mine">
            <summary>توقّعك المثبَّت — قارنه سطراً بسطر</summary>
            <pre className="en">{saved}</pre>
          </details>
        )}
      </figure>
    );
  }

  return (
    <div className="gate">
      <p className="gate-ask">
        <b>اكتب ما تتوقّعه — بالحرف — قبل أن تفتح.</b>
        <span>يُحفَظ ما تكتبه، ويُعرَض بجانب المخرَج حين تفتح.</span>
      </p>
      <textarea
        className="gate-input en" spellCheck={false} dir="ltr" rows={4}
        value={draft} onChange={(e) => setDraft(e.target.value)}
        placeholder="توقّعي…"
      />
      <button
        type="button" className="gate-btn"
        disabled={draft.trim().length < 2}
        onClick={() => { store.setPrediction(id, draft); setOpen(true); }}
      >
        ثبِّت التوقّع واكشف
      </button>
    </div>
  );
}
