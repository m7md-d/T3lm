/**
 * «توقّع قبل أن تشغّل» — يقفل المخرَج حتى يكتب القارئ توقّعه.
 *
 * وموضعُه حيث يأمر المتن بذلك: خمسُ فقراتٍ في `regions/` تبدأ بـ«توقّع»،
 * و`verify.py` يسمّي الوسم `gate` ويقول صراحةً إنه «**بوّابةُ تنبّؤ في الموقع**».
 *
 * ويبقى التوقّع محفوظاً بجانب ما خرج فعلاً — وهو «فرق الإتقان» (أدلّة §٧).
 * بلا مؤقّتٍ يحكم على القارئ، وبلا عدٍّ لمحاولاته.
 */
import { useState } from 'react';
import { store } from '../lib/store';
import { Prose } from './Prose';

export function Predict({ id, askHtml, children }: { id: string; askHtml: string; children: React.ReactNode }) {
  const saved = store.prediction(id);
  const [open, setOpen] = useState(!!saved);
  const [text, setText] = useState(saved ?? '');

  if (open) {
    return (
      <>
        {saved ? (
          <div className="predict-kept">
            <span className="predict-kept-label">توقّعتَ</span>
            <span className="predict-kept-text">{saved}</span>
          </div>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <form
      className="predict"
      onSubmit={(e) => {
        e.preventDefault();
        const v = text.trim();
        if (!v) return;
        store.setPrediction(id, v);
        setOpen(true);
      }}
    >
      <Prose html={askHtml} className="predict-ask" />
      <textarea
        className="predict-in"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="اكتب ما تتوقّعه"
        aria-label="توقّعك"
      />
      <button className="predict-go" type="submit" disabled={!text.trim()}>
        اكشف المخرَج
      </button>
    </form>
  );
}
