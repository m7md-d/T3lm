import { useState } from 'react';
import { Link } from 'react-router-dom';
import Markdown from './Markdown.jsx';

/**
 * مكوّنات مُصرَّفة من علاماتٍ متكرّرة في نصّ المنهج — لا HTML يدوي.
 * كل مكوّنٍ هنا له صفٌّ في جدول الاشتقاق (site/README.md).
 */

/* `> **محور الإجهاد:** …` + `> **السؤال:** …` — صدر كل إقليم */
export function StressCard({ axis, question }) {
  if (!axis && !question) return null;
  return (
    <div className="stress">
      <div className="axis">
        <em>محور الإجهاد</em>
        <b>{axis}</b>
      </div>
      <div className="q">{question}</div>
    </div>
  );
}

/**
 * `> 🧨 …` — المنهج يقول إنه لا يشرح الخطأ بل **كيف انحرف المنطق**.
 * فالادّعاء ظاهرٌ دائماً، والانحراف خلف زرٍّ يسأل السؤال نفسه.
 */
export function BlastBox({ head, body }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="blast">
      <div className="bh">
        <span className="mk" aria-hidden="true">
          🧨
        </span>
        <div className="tx">
          <Markdown>{head}</Markdown>
        </div>
      </div>
      {body && (
        <>
          <button type="button" className="why" onClick={() => setOpen(!open)}>
            {open ? '— أخفِ الانحراف' : '+ أين انحرف المنطق؟'}
          </button>
          {open && (
            <div className="bb">
              <Markdown>{body}</Markdown>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** يعرض مصفوفة كتلٍ ناتجة عن `splitBlast` */
export function Blocks({ blocks }) {
  return (
    <>
      {(blocks || []).map((b, i) =>
        b.type === 'blast' ? (
          <BlastBox key={i} head={b.head} body={b.body} />
        ) : (
          <Markdown key={i}>{b.text}</Markdown>
        )
      )}
    </>
  );
}

/**
 * البابان — كل إقليمٍ يُختم ببابٍ فُتِح وآخر لم يُفتح.
 * الباب المغلق **هو** رابط الإقليم التالي: البنية نفسها صارت ملاحة.
 */
export function Doors({ doors, next }) {
  if (!doors) return null;
  const [open, shut] = doors;
  const Shut = next ? Link : 'div';
  const shutProps = next ? { to: next.path, className: 'door shut' } : { className: 'door shut' };
  return (
    <div className="doors">
      <div className="door open">
        <span className="lbl">{open.label}</span>
        <Markdown>{open.text}</Markdown>
      </div>
      <Shut {...shutProps}>
        <span className="lbl">{shut.label}</span>
        <Markdown>{shut.text}</Markdown>
        {next && (
          <span className="go">
            ← افتحه: {next.id} · {next.title}
          </span>
        )}
      </Shut>
    </div>
  );
}

/**
 * بوّابة اللغز — تنفيذٌ حرفيّ لتعليمة المنهج: «لا تكمل قبل أن تكتب الجواب».
 * المخرج موجودٌ عمداً وبتسميةٍ صادقة؛ الإجبار عدوانٌ لا تعليم.
 */
export function Gate({ onTry, onSkip }) {
  return (
    <div className="gate">
      <h4>هذه المحطّة قبل أي شرح — وهذا مقصود</h4>
      <p>
        المنهج يقول: «لا تكمل قبل أن تكتب الجواب. ما ستقرأه بعد قليل يكون بلا قيمةٍ إن لم يكن عندك
        جوابٌ يُكسر». الدرس مقفولٌ حتى تحاول. ولا يوجد في هذا المنهج حلولٌ أصلاً — البوّابة لا تخفي
        عنك إجابة، بل تحمي لحظة اكتشافك.
      </p>
      <div className="row">
        <button type="button" className="btn" onClick={onTry}>
          كتبتُ محاولتي — افتح الدرس
        </button>
        <button type="button" className="btn ghost" onClick={onSkip}>
          تجاوز (وأنت تعرف الثمن)
        </button>
      </div>
    </div>
  );
}

export function Locked({ title, note, onOpen, cta = 'افتح رغم ذلك' }) {
  return (
    <div className="locked">
      <div className="ic">— محجوب —</div>
      <h3>{title}</h3>
      <p>{note}</p>
      <button type="button" className="btn ghost" onClick={onOpen}>
        {cta}
      </button>
    </div>
  );
}
