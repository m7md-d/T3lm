import { useState } from 'react';
import { TOOLCHAIN } from '../lib/content';
import { inline } from '../lib/inline';
import { store } from '../lib/store';

/**
 * بوّابة التنبّؤ — أربعة مواضع في المتن (١ في المدخل، ٣ في الإقليم ٠١)،
 * عند كل «المخرَج:».
 *
 * تنفيذ حرفيّ لتعليمة المنهج لقارئه: «اكتب توقّعك قبل أن تشغّل». الكشف بلا
 * توقّع مكتوب **ممنوع تقنياً** لا منصوحاً عنه — ولا يوجد في الموقع كلّه زرّ
 * يكشف الكل.
 *
 * وما يُكشَف **مخرَجٌ مسجَّل**، لا تشغيلٌ جرى الآن. يُعرَض بهيئته الخاصّة —
 * بلا محثّ `$` وبلا شارة «تمّ» وبلا زمن — لأن هيئة الطرفية تقول «شُغِّل الآن»،
 * وقولها هنا كذب: الموقع لا يشغّل شيئاً نيابةً عن القارئ. التشغيل فعلُه هو،
 * بزرّه، على جهازه — والمقارنة بين ما سجّله المؤلّف وما خرج له هي الدرس نفسه.
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
          <span className="rec-src en">{TOOLCHAIN}</span>
        </figcaption>
        <pre className="rec-body">{output}</pre>
        <figcaption className="rec-foot">
          {note ? <><b>مقتطع — {inline(note)}.</b> وما فوق منقولٌ حرفاً بحرف. </> : null}
          نُقِل من تشغيل المؤلّف. شغّله عندك وقارن؛ الاختلاف يستحقّ سؤالاً.
        </figcaption>
        {saved !== undefined && saved.trim() && (
          <details className="rec-mine">
            <summary>توقّعك المثبَّت — قارنه سطراً بسطر</summary>
            <pre>{saved}</pre>
          </details>
        )}
      </figure>
    );
  }

  return (
    <div className="gate">
      <p className="gate-ask">
        <b>اكتب المخرَج الذي تتوقّعه — بالحرف — قبل أن تفتح.</b>
        <span>يُحفَظ ما تكتبه، ويُعرَض بجانب المخرَج حين تفتح.</span>
      </p>
      <textarea
        className="gate-input" spellCheck={false} dir="ltr" rows={4}
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
