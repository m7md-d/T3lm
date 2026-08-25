/**
 * البوّابة — **عشرون موضعاً بالضبط**، حيث كتب المؤلّف `> **توقّع…`.
 *
 * ولا تُقفَل الاثنتان والتسعون لوحة: بوّابةٌ بلا مرساةٍ معرفية حاجزٌ إداريٌّ لا
 * تمرين (الأسلوب §٤). وما يُكتَب هنا يُحفَظ لأنه مادّة «فرق الإتقان» — كلُّ
 * محفوظٍ يُعرَض، وحقلٌ يُحفَظ ولا يُعرَض وعدٌ لم يُنفَّذ.
 *
 * والمخرج بيد القارئ: بلا مؤقّتٍ وبلا عدّ محاولاتٍ وبلا مراقبة (§٧).
 */
import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { store } from '../lib/store';
import { Prose } from './Prose';

export function PredictionGate({
  id, askHtml, children,
}: { id: string; askHtml: string; children: React.ReactNode }) {
  const saved = store.prediction(id);
  const [text, setText] = useState(saved ?? '');
  const [open, setOpen] = useState(saved !== undefined);
  /* المخرج بيد القارئ، ويُبطَّأ عشر ثوانٍ بعد طلبه: يكبح النقر الانعكاسيّ
     بلا أن يراقبه أحد (g = 0.38). ولا مؤقّتَ يحكم عليه ولا عدَّ محاولات. */
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (left === null) return;
    if (left <= 0) { setOpen(true); return; }
    const t = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  const fix = () => { store.setPrediction(id, text.trim()); setOpen(true); };

  if (open) return <>{children}</>;

  return (
    <div className="gate">
      <div className="gate__head">
        <Lock aria-hidden />
        <span>توقّع قبل أن تشغّل</span>
      </div>
      <Prose className="gate__ask" html={askHtml} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="اكتب ما تتوقّعه…"
        aria-label="توقّعك"
      />
      <div className="gate__row">
        <button type="button" className="gate__open" onClick={fix} disabled={!text.trim()}>
          ثبّت توقّعك
        </button>
        <button
          type="button"
          className="copybtn"
          onClick={() => setLeft(10)}
          disabled={left !== null}
        >
          {left === null ? 'افتح بلا توقّع' : <>يُفتَح بعد <span className="num">{left}</span></>}
        </button>
      </div>
      <p className="gate__note">يبقى ما تكتبه في متصفّحك، ويُعرَض بجانب اللوحة عند نهاية الإقليم.</p>
    </div>
  );
}
