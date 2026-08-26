/**
 * البوّابة — **ثمانيةُ مواضعَ بالضبط**، حيث كتب المؤلّف `**المخرَج**:` بعد
 * فقرةٍ يطلب فيها التوقّع.
 *
 * ولا تُقفَل الـ١٤٣ لوحة: بوّابةٌ بلا مرساةٍ معرفية حاجزٌ إداريٌّ لا تمرين،
 * والرابعة في الإقليم بلا عائدٍ يُذكر (d = 1.20 من الأولى للثالثة، ثم 0.15).
 *
 * وما يُكتَب هنا يُحفَظ لأنه مادّة «فرق الإتقان» — وكلُّ محفوظٍ يُعرَض.
 * والمخرج بيد القارئ: بلا مؤقّتٍ يحكم عليه وبلا عدّ محاولات.
 */
import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { store } from '../lib/store';
import { Prose } from './Prose';

export function Gate({
  id, askHtml, children,
}: { id: string; askHtml: string; children: React.ReactNode }) {
  const saved = store.prediction(id);
  const [text, setText] = useState(saved ?? '');
  const [open, setOpen] = useState(saved !== undefined);
  /* المخرج بيد القارئ، ويُبطَّأ عشر ثوانٍ بعد طلبه: يكبح النقر الانعكاسيّ
     بلا أن يراقبه أحد (g = 0.38). */
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (left === null) return;
    if (left <= 0) { setOpen(true); return; }
    const t = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);

  if (open) return <>{children}</>;

  return (
    <div className="gate">
      <div className="gate__head">
        <Lock aria-hidden />
        <span>اكتب ما تتوقّعه قبل أن ترى</span>
      </div>
      <Prose className="gate__ask" html={askHtml} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="المخرَج الذي تتوقّعه…"
        aria-label="توقّعك"
        rows={3}
      />
      <div className="gate__row">
        <button
          type="button"
          className="gate__fix"
          onClick={() => { store.setPrediction(id, text.trim()); setOpen(true); }}
          disabled={!text.trim()}
        >
          ثبّت توقّعك
        </button>
        <button type="button" className="copybtn" onClick={() => setLeft(10)} disabled={left !== null}>
          {left === null ? 'افتح بلا توقّع' : <>يُفتَح بعد <span className="num en">{left}</span></>}
        </button>
      </div>
      <p className="gate__note">يبقى ما تكتبه في متصفّحك، ويُعرَض بجانب اللوحة عند نهاية الإقليم.</p>
    </div>
  );
}
