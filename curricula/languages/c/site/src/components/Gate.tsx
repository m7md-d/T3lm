import { useState } from 'react';
import { store } from '../lib/store';
import { TOOLCHAIN } from '../lib/content';
import { inline } from '../lib/inline';
import { AUTH } from '../lib/structure';
import type { Auth } from '../lib/structure';

/**
 * بوّابة التنبّؤ — عند كل «المخرَج:» في المتن.
 *
 * تنفيذ حرفيّ لتعليمة المنهج لقارئه: «توقّع السطرين قبل أن تشغّل». والكشف بلا
 * توقّعٍ مكتوب **ممنوعٌ تقنياً** لا منصوحاً عنه، ولا يوجد في الموقع كلّه زرٌّ
 * يكشف الكلّ.
 *
 * وما يُكشَف **مخرَجٌ مسجَّل** لا تشغيلٌ جرى الآن: الموقع لا يشغّل C نيابةً عن
 * القارئ ولا يدّعي ذلك. التشغيل فعلُه هو، على جهازه — والمقارنة هي الدرس.
 */
export default function Gate({
  id, output, note, auth,
}: { id: string; output: string; note?: string; auth: Auth }) {
  const saved = store.prediction(id);
  const [draft, setDraft] = useState(saved ?? '');
  const [open, setOpen] = useState(Boolean(saved));

  if (open) {
    return (
      <div className="gate-open">
        <figure className="rec" data-family={AUTH[auth].family}>
          <figcaption className="rec-head">
            <span className="rec-tag">مخرَج مسجَّل</span>
            <span className="rec-auth" title={AUTH[auth].says}>{AUTH[auth].word}</span>
          </figcaption>
          <pre className="rec-body en">{output}</pre>
          {note && <figcaption className="rec-foot">مقتطع — {inline(note)}</figcaption>}
        </figure>
        <p className="gate-foot">
          نُقِل من تشغيل المؤلّف على {inline(`\`${TOOLCHAIN}\``)}. شغّله عندك وقارن.
        </p>
        {saved !== undefined && saved.trim() && (
          <details className="gate-mine">
            <summary>توقّعك المثبَّت — قارنه سطراً بسطر</summary>
            <pre className="en">{saved}</pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="gate">
      <p className="gate-ask">
        <b>اكتب المخرَج الذي تتوقّعه — بالحرف — قبل أن تفتح.</b>
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
        ثبّت توقّعي واكشف المسجَّل
      </button>
    </div>
  );
}
