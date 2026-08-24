import { useMemo, useState } from 'react';
import Lab, { Chip, Stat, Verdict } from './Lab.jsx';

/* ══════════════════════════════════════════════════════════════════════════
   ٤) مختبر الحلقة — الإقليم ٠٤
   الادّعاء: خمس محاولاتٍ كلٌّ تنهار، والخطوة الثابتة وحدها تشتري أربعة أشياء
   معاً: استقلاليّةً عن العتاد، وحتميّةً، واستقراراً، ومناعةً من النفق.
   المُدخَل: نوع الحلقة · سرعة الجهاز · تجميدٌ مفاجئ · سماكة الجدار.
   ══════════════════════════════════════════════════════════════════════════ */

const SPEED = 50; // خليّة/ثانية
const WALL = 30; // موضع الجدار
const DUR = 2; // ثانية

function runLoop(kind, mult, stallMs, wall) {
  const trace = [];
  let x = 0;
  let tunneled = false;
  let biggest = 0;
  /* حركةٌ حرّة، والجدار يُفحَص كما تفحصه لعبةٌ ساذجة: بالموضع لا بالمسار.
     فإن قفزت خطوةٌ واحدة من قبل الجدار إلى ما بعده، لم يُفحَص الجدار قط. */
  const push = (nx) => {
    if (x < WALL && nx > WALL + wall) tunneled = true;
    biggest = Math.max(biggest, nx - x);
    x = nx;
    trace.push(x);
  };

  if (kind === 'max' || kind === 'sleep') {
    const fps = kind === 'max' ? 400 * mult : 1000 / (16 + 4 / mult);
    const frames = Math.round(fps * DUR);
    for (let i = 0; i < frames; i++) push(x + 0.8); // "بكسلٌ لكل إطار"
  } else if (kind === 'vardt') {
    const fps = 60 * mult;
    const frames = Math.round(fps * DUR);
    const at = Math.floor(frames * 0.25); // قبل الجدار، وإلا لم يكن للنفق معنى
    for (let i = 0; i < frames; i++) {
      const dt = i === at ? stallMs / 1000 : 1 / fps;
      push(x + SPEED * dt);
    }
  } else {
    const STEP = 1 / 60;
    const MAXSTEPS = 5;
    const fps = 60 * mult;
    const frames = Math.round(fps * DUR);
    const at = Math.floor(frames * 0.25); // قبل الجدار، وإلا لم يكن للنفق معنى
    let acc = 0;
    for (let i = 0; i < frames; i++) {
      acc += i === at ? stallMs / 1000 : 1 / fps;
      let n = 0;
      while (acc >= STEP && n < MAXSTEPS) {
        push(x + SPEED * STEP);
        acc -= STEP;
        n++;
      }
      if (n === MAXSTEPS) acc = 0; // الوقت الزائد يُرمى عمداً
    }
  }
  return { x, trace, tunneled, biggest };
}

export function LoopLab() {
  const [kind, setKind] = useState('vardt');
  const [mult, setMult] = useState(1);
  const [stall, setStall] = useState(500);
  const [wall, setWall] = useState(2);

  const a = useMemo(() => runLoop(kind, mult, stall, wall), [kind, mult, stall, wall]);
  const b = useMemo(() => runLoop(kind, mult * 2, stall, wall), [kind, mult, stall, wall]);
  const deterministic = Math.abs(a.x - b.x) < 0.01;

  const W = 620;
  const H = 74;
  const sx = (v) => Math.min(W, (v / 90) * W);
  const step = Math.max(1, Math.floor(a.trace.length / 160));

  return (
    <Lab
      title="مختبر الحلقة: لماذا تنهار لعبتك على جهازٍ أسرع؟"
      tag="الإقليم ٠٤"
      note="نفس اللاعب، نفس السرعة (٥٠ خليّة/ث)، ونفس الثانيتين — والفرق كلّه في شكل الحلقة."
    >
      <div className="ctrls">
        <div className="ctrl">
          <label>شكل الحلقة</label>
          <div className="chips">
            <Chip on={kind === 'max'} onClick={() => setKind('max')} color="#ff6b57">بأقصى سرعة</Chip>
            <Chip on={kind === 'sleep'} onClick={() => setKind('sleep')} color="#e0a83f">نومٌ ثابت</Chip>
            <Chip on={kind === 'vardt'} onClick={() => setKind('vardt')} color="#c06fd0">dt متغيّر</Chip>
            <Chip on={kind === 'fixed'} onClick={() => setKind('fixed')} color="#5fbf7f">خطوةٌ ثابتة + مُراكِم</Chip>
          </div>
          <span />
        </div>
        <div className="ctrl">
          <label>سرعة الجهاز</label>
          <input type="range" min="0.5" max="4" step="0.5" value={mult} onChange={(e) => setMult(+e.target.value)} />
          <span className="val">×{mult}</span>
        </div>
        <div className="ctrl">
          <label>تجميدٌ مفاجئ</label>
          <input type="range" min="0" max="900" step="50" value={stall} onChange={(e) => setStall(+e.target.value)} />
          <span className="val">{stall} ms</span>
        </div>
        <div className="ctrl">
          <label>سماكة الجدار</label>
          <input type="range" min="1" max="6" step="1" value={wall} onChange={(e) => setWall(+e.target.value)} />
          <span className="val">{wall} خليّة</span>
        </div>
      </div>

      <div className="viz">
        <svg viewBox={`0 0 ${W} ${H}`}>
          <rect x={sx(WALL)} y="10" width={Math.max(2, sx(WALL + wall) - sx(WALL))} height="26" fill="#ff6b57" opacity=".55" />
          <line x1="0" y1="46" x2={W} y2="46" stroke="var(--line)" />
          {a.trace.filter((_, i) => i % step === 0).map((v, i) => (
            <circle key={i} cx={sx(v)} cy="46" r="1.6" fill="var(--core)" opacity=".8" />
          ))}
          <circle cx={sx(a.x)} cy="23" r="5" fill="var(--fg)" />
          <text x={sx(WALL) + 3} y="66" fill="var(--fg-3)" fontSize="10" textAnchor="middle">
            جدار
          </text>
        </svg>
      </div>

      <div className="stats">
        <Stat k="الموضع بعد ثانيتين" v={a.x.toFixed(1)} unit="خليّة" />
        <Stat k="على جهازٍ ضعف السرعة" v={b.x.toFixed(1)} unit="خليّة" tone={deterministic ? 'ok' : 'bad'} />
        <Stat k="أكبر إزاحةٍ في خطوة" v={a.biggest.toFixed(2)} unit="خليّة" tone={a.biggest > wall ? 'bad' : 'ok'} />
        <Stat k="عبر الجدار؟" v={a.tunneled ? 'نعم' : 'لا'} tone={a.tunneled ? 'bad' : 'ok'} />
      </div>

      <Verdict tone={a.tunneled || !deterministic ? 'bad' : 'ok'}>
        {!deterministic
          ? 'جهازٌ أسرع = عالمٌ مختلف. لم تُعرِّف السرعة بـ«لكل ثانية» بل بـ«لكل إطار» — والوحدة نفسها هي الخطأ، لا الضبط.'
          : a.tunneled
          ? `إزاحةٌ واحدة قدرها ${a.biggest.toFixed(1)} خليّة تجاوزت جداراً سماكته ${wall}. اللاعب لم يمرّ عبر الجدار — بل قفز فوق وجوده، لأنك تفحص مواضع لا مسارات.`
          : kind === 'fixed'
          ? 'نفس الموضع على كل جهاز، ولا قفزة تتجاوز الجدار مهما جمّدتَ. الخطوة الثابتة اشترت الحتميّة والمناعة من النفق بقرارٍ واحد.'
          : 'مستقرٌّ الآن — ارفع التجميد أو سرعة الجهاز حتى ينكسر. المشكلة لا تظهر أبداً على جهاز المطوّر.'}
      </Verdict>
    </Lab>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ٥) مختبر إخفاء التأخير — الإقليم ٠٦
   الادّعاء: «الاستيفاء للآخرين، والتنبّؤ لك، والمصالحة للتصحيح» — وكلٌّ يصلح
   شيئاً ويكلّف شيئاً، ولا واحدة منها تُلغي الفجوة.
   ══════════════════════════════════════════════════════════════════════════ */

export function LatencyLab() {
  const [rtt, setRtt] = useState(160);
  const [jitter, setJitter] = useState(30);
  const [loss, setLoss] = useState(5);
  const [interp, setInterp] = useState(0);
  const [predict, setPredict] = useState(false);
  const [reconcile, setReconcile] = useState(false);

  const r = useMemo(() => {
    const inputLag = predict ? 0 : rtt;
    const seeOthers = rtt / 2 + interp;
    const covered = interp >= jitter * 2;
    const freezes = covered ? 0 : Math.round((loss / 100) * 20 * (1 - interp / (jitter * 2 || 1)) * 3);
    const jumps = interp > 0 ? 0 : 20;
    const snaps = predict && !reconcile ? Math.round((loss / 100) * 20 * 1.5) : predict ? 1 : 0;
    return { inputLag, seeOthers, freezes: Math.max(0, freezes), jumps, snaps, covered };
  }, [rtt, jitter, loss, interp, predict, reconcile]);

  const W = 620;
  return (
    <Lab
      title="مختبر إخفاء التأخير: من يدفع ثمن الضوء البطيء؟"
      tag="الإقليم ٠٦"
      note="نبضة الخادم ٢٠/ث، والرسم ٦٠/ث. «قفزات» = مرّاتٌ يقفز فيها الآخرون في الثانية."
    >
      <div className="ctrls">
        <div className="ctrl">
          <label>RTT</label>
          <input type="range" min="20" max="400" step="10" value={rtt} onChange={(e) => setRtt(+e.target.value)} />
          <span className="val">{rtt} ms</span>
        </div>
        <div className="ctrl">
          <label>ارتعاش</label>
          <input type="range" min="0" max="120" step="5" value={jitter} onChange={(e) => setJitter(+e.target.value)} />
          <span className="val">±{jitter} ms</span>
        </div>
        <div className="ctrl">
          <label>فقد</label>
          <input type="range" min="0" max="20" step="1" value={loss} onChange={(e) => setLoss(+e.target.value)} />
          <span className="val">{loss}٪</span>
        </div>
        <div className="ctrl">
          <label>مخزن الاستيفاء</label>
          <input type="range" min="0" max="250" step="10" value={interp} onChange={(e) => setInterp(+e.target.value)} />
          <span className="val">{interp} ms</span>
        </div>
        <div className="ctrl">
          <label>التقنيات</label>
          <div className="chips">
            <Chip on={predict} onClick={() => setPredict(!predict)} color="#e0a83f">تنبّؤٌ محلّي</Chip>
            <Chip on={reconcile} onClick={() => setReconcile(!reconcile)} color="#5fbf7f">مصالحة</Chip>
          </div>
          <span />
        </div>
      </div>

      <div className="viz">
        <svg viewBox={`0 0 ${W} 96`}>
          <text x={W - 4} y="14" textAnchor="end" fill="var(--fg-3)" fontSize="11">لاعبك</text>
          <line x1="0" y1="26" x2={W} y2="26" stroke="var(--line)" />
          <rect x="0" y="20" width={(r.inputLag / 500) * W} height="12" fill="#e0a83f" opacity=".7" />
          <text x={W - 4} y="60" textAnchor="end" fill="var(--fg-3)" fontSize="11">الآخرون</text>
          <line x1="0" y1="72" x2={W} y2="72" stroke="var(--line)" />
          <rect x="0" y="66" width={((rtt / 2) / 500) * W} height="12" fill="#3fb6cc" opacity=".7" />
          <rect x={((rtt / 2) / 500) * W} y="66" width={(interp / 500) * W} height="12" fill="#c06fd0" opacity=".7" />
          <text x="4" y="92" fill="var(--fg-3)" fontSize="10" direction="ltr">0 → 500 ms</text>
        </svg>
      </div>

      <div className="stats">
        <Stat k="تأخّر استجابتك" v={r.inputLag} unit="ms" tone={r.inputLag === 0 ? 'ok' : r.inputLag > 120 ? 'bad' : 'warn'} />
        <Stat k="تراهم في الماضي بـ" v={Math.round(r.seeOthers)} unit="ms" tone={r.seeOthers > 200 ? 'warn' : 'ok'} />
        <Stat k="قفزاتٌ في الثانية" v={r.jumps} tone={r.jumps ? 'bad' : 'ok'} />
        <Stat k="تجمّدٌ من الفقد" v={r.freezes} unit="/د" tone={r.freezes ? 'warn' : 'ok'} />
        <Stat k="ارتدادٌ مرئي" v={r.snaps} unit="/د" tone={r.snaps > 2 ? 'bad' : r.snaps ? 'warn' : 'ok'} />
      </div>

      <Verdict tone={r.inputLag === 0 && r.jumps === 0 && r.snaps <= 1 ? 'ok' : 'warn'}>
        {r.jumps > 0
          ? 'بلا مخزن استيفاء، تعرض الآخرين عند آخر لقطةٍ وصلت: عشرون قفزةً في الثانية بينما ترسم ستّين إطاراً. الحلّ أن تعرضهم في الماضي عمداً.'
          : r.inputLag > 0
          ? `حركتك تنتظر موافقة الخادم: ${rtt} مللي ثانيةً بين إصبعك وعينك. شغّل التنبّؤ — تصير الاستجابة صفراً، وتشتري مكانها احتمال الخطأ.`
          : r.snaps > 1
          ? 'التنبّؤ بلا مصالحة يعني أنك تخمّن ولا تصحّح: كل خطأٍ يظهر ارتداداً مرئياً. والمصالحة مستحيلةٌ بلا حتميّة الإقليم ٠٤.'
          : `استجابةٌ فوريّة وحركةٌ ناعمة — والثمن مدفوعٌ ومرئي: أنت ترى الآخرين متأخّرين ${Math.round(
              r.seeOthers
            )} مللي ثانية. هنا بالضبط تولد شكوى «أصبتُه وما مات».`}
      </Verdict>
    </Lab>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ٦) مختبر السيّد — الإقليم ٠٧
   الادّعاء: «الصوت سيّد الوقت»، وبلّورتان مستقلّتان تنحرفان حتماً.
   ══════════════════════════════════════════════════════════════════════════ */

export function SyncLab() {
  const [cam, setCam] = useState(40);
  const [mic, setMic] = useState(-60);
  const [master, setMaster] = useState('system');
  const [mins, setMins] = useState(60);

  const r = useMemo(() => {
    const secs = mins * 60;
    const rel = (cam - mic) * 1e-6; // انحرافٌ نسبيّ بين الساعتين
    if (master === 'audio') {
      // الفيديو يُقدَّم بموضع التشغيل الصوتي ⇒ الانحراف يُبتلع بإسقاط/تكرار إطارات
      return { offset: 0, dropped: Math.round(Math.abs(rel) * secs * 30), xrun: 0 };
    }
    if (master === 'video') {
      // الصوت يُجبَر على إيقاع الفيديو ⇒ مخزنه يفرغ أو يفيض
      return { offset: 0, dropped: 0, xrun: Math.round((Math.abs(rel) * secs * 1000) / 20) };
    }
    return { offset: rel * secs * 1000, dropped: 0, xrun: 0 };
  }, [cam, mic, master, mins]);

  const W = 620;
  const H = 110;
  const cap = 400;
  const y = (ms) => H / 2 - Math.max(-cap, Math.min(cap, ms)) / (cap / (H / 2 - 6));

  return (
    <Lab
      title="مختبر السيّد: أي ساعةٍ تحكم الصوت والصورة؟"
      tag="الإقليم ٠٧"
      note="ppm = جزءٌ من المليون. بلّورتان تجاريّتان تختلفان ±٥٠ ppm بسهولة، وهذا كافٍ."
    >
      <div className="ctrls">
        <div className="ctrl">
          <label>انحراف الكاميرا</label>
          <input type="range" min="-100" max="100" step="5" value={cam} onChange={(e) => setCam(+e.target.value)} />
          <span className="val">{cam > 0 ? '+' : ''}{cam} ppm</span>
        </div>
        <div className="ctrl">
          <label>انحراف المايك</label>
          <input type="range" min="-100" max="100" step="5" value={mic} onChange={(e) => setMic(+e.target.value)} />
          <span className="val">{mic > 0 ? '+' : ''}{mic} ppm</span>
        </div>
        <div className="ctrl">
          <label>السيّد</label>
          <div className="chips">
            <Chip on={master === 'audio'} onClick={() => setMaster('audio')} color="#5fbf7f">الصوت</Chip>
            <Chip on={master === 'video'} onClick={() => setMaster('video')} color="#e0a83f">الصورة</Chip>
            <Chip on={master === 'system'} onClick={() => setMaster('system')} color="#ff6b57">ساعة النظام</Chip>
          </div>
          <span />
        </div>
        <div className="ctrl">
          <label>مدّة البثّ</label>
          <input type="range" min="5" max="180" step="5" value={mins} onChange={(e) => setMins(+e.target.value)} />
          <span className="val">{mins} دقيقة</span>
        </div>
      </div>

      <div className="viz">
        <svg viewBox={`0 0 ${W} ${H}`}>
          <rect x="0" y={y(125)} width={W} height={y(-45) - y(125)} fill="var(--chat)" opacity=".08" />
          <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="var(--line-2)" />
          <line x1="0" y1={y(125)} x2={W} y2={y(125)} stroke="var(--chat)" strokeDasharray="3 3" opacity=".6" />
          <line x1="0" y1={y(-45)} x2={W} y2={y(-45)} stroke="var(--chat)" strokeDasharray="3 3" opacity=".6" />
          <path d={`M0 ${H / 2} L${W} ${y(r.offset)}`} stroke={Math.abs(r.offset) > 125 ? '#ff6b57' : 'var(--core)'} strokeWidth="1.8" fill="none" />
          <text x="62" y="12" textAnchor="middle" fill="var(--fg-3)" fontSize="10">
            الصوت متأخّر +
          </text>
          <text x="62" y={H - 4} textAnchor="middle" fill="var(--fg-3)" fontSize="10">
            الصوت سابق −
          </text>
          <text x={W - 4} y={H / 2 - 5} textAnchor="end" fill="var(--fg-3)" fontSize="10">
            نطاق التسامح البشري
          </text>
        </svg>
      </div>

      <div className="stats">
        <Stat k="انفصال الشفاه" v={Math.abs(r.offset) > 999 ? '999+' : Math.round(r.offset)} unit="ms" tone={Math.abs(r.offset) > 125 ? 'bad' : Math.abs(r.offset) > 45 ? 'warn' : 'ok'} />
        <Stat k="إطاراتٌ مسقطة" v={r.dropped} tone={r.dropped > 3000 ? 'warn' : 'ok'} />
        <Stat k="xrun صوتي" v={r.xrun} tone={r.xrun ? 'bad' : 'ok'} />
      </div>

      <Verdict tone={master === 'audio' ? 'ok' : 'bad'}>
        {master === 'system'
          ? `ساعةٌ ثالثة لا تحكم أيّاً منهما: بعد ${mins} دقيقة صار الفرق ${Math.round(Math.abs(r.offset))} مللي ثانية. الانحراف ليس عطلاً — هو ما تفعله بلّورتان مستقلّتان دائماً.`
          : master === 'video'
          ? `تجبر الصوت على إيقاع الصورة، فيفرغ مخزنه أو يفيض: ${r.xrun} انقطاعاً مسموعاً. الأذن تلتقط كل واحدٍ منها؛ العين لا تلتقط إطاراً ضائعاً.`
          : `الصوت سيّداً: التزامن محفوظٌ إلى الأبد، والثمن ${r.dropped} إطاراً مسقطاً أو مكرّراً خلال ${mins} دقيقة — لا يراها أحد.`}
      </Verdict>
    </Lab>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ٧) مختبر الوصفة الذرّيّة — الإقليم ٠٨
   الادّعاء: «`write` الناجحة ليست حفظاً»، و«نسيان fsync للمجلّد يُبطل الوصفة
   كلّها» — وهي الخطوة التي يسقط فيها الجميع.
   ══════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  { id: 'tmp', t: 'اكتب في ملفٍّ مؤقّت' },
  { id: 'fsf', t: 'fsync(الملفّ)' },
  { id: 'ren', t: 'rename(مؤقّت → الهدف)' },
  { id: 'fsd', t: 'fsync(المجلّد)' },
];

export function DurabilityLab() {
  const [on, setOn] = useState({ tmp: true, fsf: false, ren: true, fsd: false });
  const [crash, setCrash] = useState(4);

  const steps = STEPS.filter((s) => on[s.id]);
  const at = Math.min(crash, steps.length);

  const r = useMemo(() => {
    const done = steps.slice(0, at).map((s) => s.id);
    const has = (x) => done.includes(x);
    if (!on.tmp) {
      return at === 0
        ? { s: 'الملفّ القديم سليم', ok: true, why: 'لم تبدأ الكتابة بعد.' }
        : { s: 'ملفٌّ نصفيٌّ بالاسم الصحيح', ok: false, why: 'الكتابة المباشرة فوق الهدف تعني أن الانقطاع يترك خليطاً من القديم والجديد — والاسم يقول إنه سليم.' };
    }
    if (!has('ren')) return { s: 'القديم سليم + مؤقّتٌ يتيم', ok: true, why: 'ما دام الاسم لم يتغيّر، فالقارئ يرى النسخة القديمة كاملة. المؤقّت نفايةٌ تُنظَّف.' };
    if (!has('fsf')) return { s: 'الاسم يشير لمحتوىً غير مضمون', ok: false, why: 'أعطيتَ الاسم لملفٍّ لم تتأكّد أن بياناته وصلت القرص. الاسم وصل والبيانات لا — وهذا أسوأ من الفشل الصريح.' };
    if (!has('fsd')) return { s: 'قد يعود الاسم القديم', ok: false, why: 'المحتوى دائم، والربط الجديد ما زال في مخبّأ صفحات المجلّد. `rename` تعديلٌ في ملفٍّ آخر — والمجلّد ملفّ.' };
    return { s: 'إمّا القديم كاملاً أو الجديد كاملاً', ok: true, why: 'لا حالة ثالثة. هذا كل ما تعنيه «الذرّيّة».' };
  }, [on, at, steps]);

  return (
    <Lab
      title="مختبر الوصفة الذرّيّة: اقطع الكهرباء ثم انظر"
      tag="الإقليم ٠٨"
      note="نقطة الانقطاع تعني: نُفِّذت هذه الخطوات ثم انقطعت الطاقة فوراً."
    >
      <div className="ctrls">
        <div className="ctrl">
          <label>خطوات الوصفة</label>
          <div className="chips">
            {STEPS.map((s) => (
              <Chip key={s.id} on={on[s.id]} onClick={() => setOn({ ...on, [s.id]: !on[s.id] })} color="#d0784f">
                {s.t}
              </Chip>
            ))}
          </div>
          <span />
        </div>
        <div className="ctrl">
          <label>الانقطاع بعد</label>
          <input type="range" min="0" max="4" step="1" value={crash} onChange={(e) => setCrash(+e.target.value)} />
          <span className="val">{at === 0 ? 'لا شيء' : `${at} خطوة`}</span>
        </div>
      </div>

      <div className="viz">
        <svg viewBox="0 0 620 46">
          {STEPS.map((s, i) => {
            const active = on[s.id];
            const idx = steps.findIndex((x) => x.id === s.id);
            const done = active && idx > -1 && idx < at;
            return (
              <g key={s.id}>
                <rect x={8 + i * 152} y="8" width="140" height="26" rx="3" fill={done ? 'color-mix(in srgb, var(--files) 22%, var(--bg-2))' : 'var(--bg-2)'} stroke={active ? 'var(--files)' : 'var(--line)'} opacity={active ? 1 : 0.35} />
                <text x={78 + i * 152} y="25" textAnchor="middle" fill={active ? 'var(--fg)' : 'var(--fg-3)'} fontSize="11">
                  {s.t}
                </text>
              </g>
            );
          })}
          {at < steps.length && (
            <line
              x1={8 + STEPS.findIndex((s) => s.id === steps[at]?.id) * 152 - 4}
              y1="2"
              x2={8 + STEPS.findIndex((s) => s.id === steps[at]?.id) * 152 - 4}
              y2="42"
              stroke="#ff6b57"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      <div className="stats">
        <Stat k="ما على القرص بعد العودة" v={r.s} tone={r.ok ? 'ok' : 'bad'} />
      </div>
      <Verdict tone={r.ok ? 'ok' : 'bad'}>{r.why}</Verdict>
    </Lab>
  );
}
