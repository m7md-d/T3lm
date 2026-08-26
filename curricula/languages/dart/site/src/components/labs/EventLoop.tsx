/**
 * مختبر «الطابوران» — يُحقَن بعد لقطة «ولهذا تُجَوَّع الحلقة» (١٣).
 *
 * **الادّعاء الذي يقلبه:** «المهامّ الدقيقة تُستنزَف كلُّها قبل أي حدث… ولو لم
 * يكن للعدّاد حدّ، لما وصل الحدث **أبداً**، والبرنامج حيٌّ لا معلّق». يُقرأ في
 * سطرين ويُصدَّق، وهنا يُخطَى خطوةً خطوة حتى يُرى الطابور الآخر لا يُخدَم.
 *
 * **والحالة المفاجئة** زرٌّ: «مهمّة دقيقة تُسجّل مثلها» — يبقى الحدث المسجَّل
 * أوّلاً واقفاً مهما خطوتَ.
 *
 * وهذه **محاكاةٌ للقاعدة التي يرسمها هذا الإقليم**، لا مشغّل Dart. والبرنامج
 * الافتراضيّ هو برنامج اللقطة الأولى بعينه، فترتيبه قابلٌ للمقارنة باللوحة
 * المسجَّلة فوقه سطراً بسطر.
 *
 * ولا تقدّمَ تلقائيّ: كل خطوةٍ بضغطة (الركيزة ٦).
 */
import { useMemo, useState } from 'react';
import { Play, RotateCcw, StepForward } from 'lucide-react';

type Kind = 'sync' | 'micro' | 'microF' | 'then' | 'timer' | 'future' | 'delayed' | 'loop';

const CALL: Record<Kind, string> = {
  sync:    "print('sync')",
  micro:   'scheduleMicrotask',
  microF:  'Future.microtask',
  then:    'Future.value(0).then',
  timer:   'Timer.run',
  future:  'Future(() => …)',
  delayed: 'Future.delayed(zero)',
  loop:    'scheduleMicrotask(loop)',
};

/** أيّ طابورٍ يستقبله — القاعدة كما يرسمها الإقليم في مخطّطه. */
const QUEUE: Record<Kind, 'now' | 'micro' | 'event'> = {
  sync: 'now', micro: 'micro', microF: 'micro', then: 'micro', loop: 'micro',
  timer: 'event', future: 'event', delayed: 'event',
};

const PALETTE: Kind[] = ['sync', 'micro', 'microF', 'then', 'timer', 'future', 'delayed'];

/** برنامج اللقطة الأولى في الإقليم، بترتيب تسجيله فيها. */
const DEFAULT: Kind[] = ['sync', 'timer', 'future', 'delayed', 'micro', 'microF', 'then', 'sync'];

interface Item { id: number; kind: Kind }
interface State { micro: Item[]; event: Item[]; printed: Item[]; started: boolean; born: number }

const fresh: State = { micro: [], event: [], printed: [], started: false, born: 0 };

export function EventLoop() {
  const [program, setProgram] = useState<Kind[]>(DEFAULT);
  const [s, setS] = useState<State>(fresh);

  const reset = () => setS(fresh);
  const edit = (fn: (p: Kind[]) => Kind[]) => { setProgram(fn); reset(); };

  const start = () => {
    let id = 0;
    const st: State = { micro: [], event: [], printed: [], started: true, born: 0 };
    for (const k of program) {
      const it = { id: id++, kind: k };
      if (QUEUE[k] === 'now') st.printed.push(it);
      else if (QUEUE[k] === 'micro') st.micro.push(it);
      else st.event.push(it);
    }
    setS(st);
  };

  /* خطوةٌ واحدة: **الدقيق أوّلاً دائماً** — أولويةٌ مطلقة لا أسبقية. */
  const step = () => setS((p) => {
    if (p.micro.length) {
      const [it, ...rest] = p.micro;
      const next: State = { ...p, micro: rest, printed: [...p.printed, it!] };
      if (it!.kind === 'loop') {
        next.born = p.born + 1;
        next.micro = [...rest, { id: 1000 + next.born, kind: 'loop' }];
      }
      return next;
    }
    if (p.event.length) {
      const [it, ...rest] = p.event;
      return { ...p, event: rest, printed: [...p.printed, it!] };
    }
    return p;
  });

  const starving = s.started && s.born >= 6 && s.event.length > 0;
  const done = s.started && !s.micro.length && !s.event.length;

  const stats = useMemo(() => ({
    micro: s.micro.length, event: s.event.length, printed: s.printed.length,
  }), [s]);

  return (
    <section className="lab">
      <header className="lab__head">
        <h3>الطابوران، خطوةً خطوة</h3>
        <p className="lab__claim">
          الطابور الدقيق أولويةٌ مطلقة لا أسبقية. سجِّل ما شئت، ثم خُذ خطوةً
          واحدة في كل ضغطة وانظر أيّ طابورٍ يُخدَم.
        </p>
      </header>

      <div className="loop__prog">
        <div className="loop__proghead">
          <span className="loop__label en">main()</span>
          <span className="spacer" />
          {s.started ? (
            <button type="button" className="chip" onClick={reset}>
              <RotateCcw aria-hidden /><span>من البداية</span>
            </button>
          ) : (
            <button type="button" className="chip chip--go" onClick={start} disabled={!program.length}>
              <Play aria-hidden /><span>شغّل main</span>
            </button>
          )}
        </div>
        <ol className="loop__lines">
          {program.map((k, i) => (
            <li key={i} className="en">
              <span className="loop__n num">{String(i + 1).padStart(2, '0')}</span>
              <span>{CALL[k]}</span>
              {!s.started ? (
                <button
                  type="button"
                  className="loop__del"
                  aria-label="احذف السطر"
                  onClick={() => edit((p) => p.filter((_, j) => j !== i))}
                >×</button>
              ) : null}
            </li>
          ))}
        </ol>
        {!s.started ? (
          <div className="loop__palette">
            {PALETTE.map((k) => (
              <button key={k} type="button" className="chip en" onClick={() => edit((p) => [...p, k])}>
                + {CALL[k]}
              </button>
            ))}
            <button
              type="button"
              className="chip chip--warn"
              onClick={() => edit(() => ['timer', 'loop', 'sync'])}
            >
              مهمّة دقيقة تُسجّل مثلها
            </button>
          </div>
        ) : null}
      </div>

      {s.started ? (
        <>
          <div className="loop__queues">
            <div className="loop__q" data-q="micro">
              <div className="loop__qhead">
                <span>الطابور الدقيق</span>
                <span className="num en">{stats.micro}</span>
              </div>
              <ul>{s.micro.slice(0, 7).map((it) => <li key={it.id} className="en">{CALL[it.kind]}</li>)}</ul>
              {s.micro.length > 7 ? <div className="loop__more num en">+{s.micro.length - 7}</div> : null}
            </div>
            <div className="loop__q" data-q="event">
              <div className="loop__qhead">
                <span>طابور الأحداث</span>
                <span className="num en">{stats.event}</span>
              </div>
              <ul>{s.event.map((it) => <li key={it.id} className="en">{CALL[it.kind]}</li>)}</ul>
            </div>
          </div>

          <div className="loop__outrow">
            <button type="button" className="chip chip--go" onClick={step} disabled={done}>
              <StepForward aria-hidden /><span>خطوة</span>
            </button>
            <ol className="loop__printed">
              {s.printed.map((it, i) => (
                <li key={it.id} className="en">
                  <span className="loop__n num">{String(i + 1).padStart(2, '0')}</span>
                  <span>{CALL[it.kind]}</span>
                </li>
              ))}
            </ol>
          </div>

          {starving ? (
            <p className="lab__verdict" data-same="false">
              ستّ خطواتٍ ولم يُخدَم حدثٌ واحد. المهمّة الدقيقة تُطيل طابورها وهو
              يُستنزَف، فلو لم يكن لها حدٌّ لما وصل الحدث أبداً — والبرنامج حيٌّ
              لا معلّق.
            </p>
          ) : null}
          {done ? <p className="lab__verdict" data-same="true">فرغ الطابوران.</p> : null}
        </>
      ) : null}

      <p className="lab__disclaimer">
        محاكاةٌ للقاعدة التي يرسمها هذا الإقليم، لا مشغّل Dart. والبرنامج
        الافتراضيّ هو برنامج اللقطة الأولى، فقارن ترتيبه بلوحتها.
      </p>
    </section>
  );
}
