import { useMemo, useState } from 'react';
import Lab, { Chip, Stat, Verdict } from './Lab.jsx';

/* ══════════════════════════════════════════════════════════════════════════
   ١) مختبر الحدود — الإقليم ٠١
   الادّعاء: «لا يمكن أن يظهر المحدِّد داخل البيانات» + «المحلّل التزايدي يجب
   أن يقبل أن يُطعَم بايتاً واحداً في المرّة».
   المُدخَل: استراتيجية التأطير · حمولةٌ ثنائيّة · شكل وصول البايتات · المحلّل.
   ══════════════════════════════════════════════════════════════════════════ */

const NL = 10;
const MSGS = [12, 5, 40];

function payload(i, binary) {
  const n = MSGS[i];
  const out = [];
  for (let k = 0; k < n; k++) out.push(0x41 + ((i * 7 + k) % 26));
  if (binary && i === 1) out[2] = NL; // بايتٌ يساوي المحدِّد داخل البيانات
  return out;
}

function encode(strategy, slot, binary) {
  const wire = [];
  const segs = [];
  for (let i = 0; i < MSGS.length; i++) {
    const p = payload(i, binary);
    const start = wire.length;
    if (strategy === 'delim') {
      p.forEach((v) => wire.push({ v, m: i, k: 'd' }));
      wire.push({ v: NL, m: i, k: 'f' });
    } else if (strategy === 'len') {
      [0, 0, 0, p.length].forEach((v) => wire.push({ v, m: i, k: 'f' }));
      p.forEach((v) => wire.push({ v, m: i, k: 'd' }));
    } else {
      for (let k = 0; k < slot; k++) {
        if (k < p.length) wire.push({ v: p[k], m: i, k: 'd' });
        else wire.push({ v: 0, m: i, k: 'p' });
      }
    }
    segs.push([start, wire.length]);
  }
  return { wire, segs };
}

function chunkize(wire, segs, mode) {
  if (mode === 'msg') return segs.map(([a, b]) => wire.slice(a, b).map((c) => c.v));
  if (mode === 'all') return [wire.map((c) => c.v)];
  const out = [];
  for (let i = 0; i < wire.length; i += 7) out.push(wire.slice(i, i + 7).map((c) => c.v));
  return out;
}

/** محلّلٌ تزايديّ (يحتفظ بحالته) مقابل محلّلٍ ساذج (يفترض أن الدفعة = رسالة) */
function decode(chunks, strategy, slot, incremental) {
  const msgs = [];
  if (incremental) {
    let buf = [];
    let need = -1;
    for (const c of chunks) {
      buf = buf.concat(c);
      for (;;) {
        if (strategy === 'delim') {
          const i = buf.indexOf(NL);
          if (i === -1) break;
          msgs.push(buf.slice(0, i));
          buf = buf.slice(i + 1);
        } else if (strategy === 'len') {
          if (need < 0) {
            if (buf.length < 4) break;
            need = buf[3];
            buf = buf.slice(4);
          }
          if (buf.length < need) break;
          msgs.push(buf.slice(0, need));
          buf = buf.slice(need);
          need = -1;
        } else {
          if (buf.length < slot) break;
          msgs.push(buf.slice(0, slot).filter((v, k, a) => k < a.length));
          buf = buf.slice(slot);
        }
      }
    }
  } else {
    for (const c of chunks) {
      if (strategy === 'delim') {
        let cur = [];
        for (const v of c) {
          if (v === NL) {
            msgs.push(cur);
            cur = [];
          } else cur.push(v);
        }
        if (cur.length) msgs.push(cur); // الساذج يسلّم ما بقي كأنه رسالة
      } else if (strategy === 'len') {
        if (c.length < 4) continue;
        msgs.push(c.slice(4, 4 + c[3]));
      } else {
        msgs.push(c.slice(0, slot));
      }
    }
  }
  return msgs;
}

const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function FramingLab() {
  const [strategy, setStrategy] = useState('delim');
  const [binary, setBinary] = useState(true);
  const [mode, setMode] = useState('split');
  const [incremental, setIncremental] = useState(false);
  const [slot, setSlot] = useState(32);

  const res = useMemo(() => {
    const { wire, segs } = encode(strategy, slot, binary);
    const chunks = chunkize(wire, segs, mode);
    const got = decode(chunks, strategy, slot, incremental);
    const want = MSGS.map((_, i) => {
      const p = payload(i, binary);
      return strategy === 'fixed' ? p.slice(0, slot) : p;
    });
    let ok = 0;
    for (let i = 0; i < want.length; i++) if (got[i] && same(got[i], want[i])) ok++;
    const dataBytes = MSGS.reduce((a, b) => a + b, 0);
    return { wire, got, ok, overhead: wire.length - dataBytes, truncated: strategy === 'fixed' && MSGS.some((n) => n > slot) };
  }, [strategy, binary, mode, incremental, slot]);

  const COLORS = ['#5fbf7f', '#e0a83f', '#c06fd0'];

  return (
    <Lab title="مختبر الحدود: أين تنتهي الرسالة؟" tag="الإقليم ٠١" note="السلك مرسومٌ بايتاً بايتاً: الملوّن حمولة، والباهت إطارٌ أو حشو، والأحمر بايتٌ يساوي المحدِّد.">
      <div className="ctrls">
        <div className="ctrl">
          <label>استراتيجية التأطير</label>
          <div className="chips">
            <Chip on={strategy === 'delim'} onClick={() => setStrategy('delim')} color="#c06fd0">محدِّد</Chip>
            <Chip on={strategy === 'len'} onClick={() => setStrategy('len')} color="#5fbf7f">بادئة طول</Chip>
            <Chip on={strategy === 'fixed'} onClick={() => setStrategy('fixed')} color="#e0a83f">طولٌ ثابت</Chip>
          </div>
          <span />
        </div>
        {strategy === 'fixed' && (
          <div className="ctrl">
            <label>حجم الخانة</label>
            <input type="range" min="8" max="64" step="4" value={slot} onChange={(e) => setSlot(+e.target.value)} />
            <span className="val">{slot} B</span>
          </div>
        )}
        <div className="ctrl">
          <label>وصول البايتات</label>
          <div className="chips">
            <Chip on={mode === 'msg'} onClick={() => setMode('msg')} color="#3fb6cc">دفعةٌ لكل رسالة</Chip>
            <Chip on={mode === 'split'} onClick={() => setMode('split')} color="#3fb6cc">مقطّعةٌ كل ٧ بايت</Chip>
            <Chip on={mode === 'all'} onClick={() => setMode('all')} color="#3fb6cc">كلّها دفعةً واحدة</Chip>
          </div>
          <span />
        </div>
        <div className="ctrl">
          <label>المستقبِل</label>
          <div className="chips">
            <Chip on={binary} onClick={() => setBinary(!binary)} color="#ff6b57">حمولةٌ ثنائيّة (فيها بايت ١٠)</Chip>
            <Chip on={incremental} onClick={() => setIncremental(!incremental)} color="#5fbf7f">محلّلٌ تزايديّ</Chip>
          </div>
          <span />
        </div>
      </div>

      <div className="viz">
        <svg viewBox={`0 0 ${Math.max(res.wire.length, 1) * 9 + 8} 30`}>
          {res.wire.map((c, i) => (
            <rect
              key={i}
              x={i * 9 + 4}
              y={8}
              width={7}
              height={14}
              rx="1"
              fill={c.v === NL && c.k === 'd' ? '#ff6b57' : c.k === 'd' ? COLORS[c.m] : 'transparent'}
              stroke={c.k === 'd' ? 'none' : 'var(--line-2)'}
              opacity={c.k === 'p' ? 0.35 : 1}
            />
          ))}
        </svg>
      </div>

      <div className="stats">
        <Stat k="رسائل سليمة" v={`${res.ok}/3`} tone={res.ok === 3 ? 'ok' : 'bad'} />
        <Stat k="ما فكّه المستقبِل" v={res.got.length} unit="رسالة" tone={res.got.length === 3 ? 'ok' : 'bad'} />
        <Stat k="حملٌ إضافي" v={res.overhead} unit="بايت" tone={res.overhead > 40 ? 'warn' : undefined} />
        <Stat k="بايتات الحمولة" v={MSGS.reduce((a, b) => a + b, 0)} unit="بايت" />
      </div>

      <Verdict tone={res.ok === 3 ? 'ok' : 'bad'}>
        {res.ok === 3
          ? 'كل الرسائل سليمة — لكن انظر الحمل الإضافي، وجرّب تغيير شكل الوصول قبل أن تطمئنّ.'
          : !incremental && mode !== 'msg'
          ? 'المحلّل الساذج يفترض أن «الدفعة = رسالة». الشبكة لا تعده بذلك أبداً — والعطل يظهر فقط حين تتقطّع البايتات.'
          : strategy === 'delim' && binary
          ? 'المحدِّد ظهر داخل الحمولة، فانشطرت رسالةٌ إلى رسالتين. لا يوجد في البايتات ما يميّز «محدِّداً» عن «بيانات».'
          : res.truncated
          ? 'الطول الثابت بتر ما تجاوز الخانة بصمت. لا خطأ، ولا إشعار — بياناتٌ ذهبت.'
          : 'شيءٌ انكسر. اقرأ السلك أعلاه وحدّد أي بايتٍ خدع المستقبِل.'}
      </Verdict>
    </Lab>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ٢) مختبر الضغط العكسي — الإقليم ٠٢
   الادّعاء: «كل مخزنٍ غير محدودٍ في نظامك هو قنبلة ذاكرةٍ مؤقّتة» + السياسات
   الثلاث (احجز / أسقِط / اقطع) إجاباتٌ مختلفة على نفس اللحظة.
   ══════════════════════════════════════════════════════════════════════════ */

export function BackpressureLab() {
  const [prod, setProd] = useState(900);
  const [cons, setCons] = useState(300);
  const [cap, setCap] = useState(0);
  const [policy, setPolicy] = useState('none');
  const MSG = 4096;
  const T = 30;

  const sim = useMemo(() => {
    const pts = [];
    let q = 0;
    let dropped = 0;
    let stalled = 0;
    let died = null;
    for (let t = 0; t <= T; t += 0.25) {
      const inflow = prod * 0.25;
      const outflow = cons * 0.25;
      let add = inflow;
      if (cap > 0 && policy === 'block') {
        const room = Math.max(0, cap - q + outflow);
        if (add > room) {
          stalled += 0.25;
          add = room;
        }
      }
      q = q + add - outflow;
      if (q < 0) q = 0;
      if (cap > 0 && q > cap) {
        if (policy === 'drop') {
          dropped += q - cap;
          q = cap;
        } else if (policy === 'kill' && died === null) {
          died = t;
          q = 0;
        } else if (policy === 'block') q = cap;
      }
      pts.push({ t, q });
    }
    const peak = Math.max(...pts.map((p) => p.q));
    return { pts, peak, dropped, stalled, died };
  }, [prod, cons, cap, policy]);

  const W = 620;
  const H = 150;
  const maxQ = Math.max(sim.peak, cap || 1, 1);
  const path = sim.pts
    .map((p, i) => `${i ? 'L' : 'M'}${(p.t / T) * W} ${H - (p.q / maxQ) * (H - 10)}`)
    .join(' ');

  const mb = (n) => ((n * MSG) / 1048576).toFixed(1);

  return (
    <Lab
      title="مختبر الضغط العكسي: مَن يدفع حين يمتلئ الطابور؟"
      tag="الإقليم ٠٢"
      note="المنتج = رسائل تريد إرسالها. المستهلك = ما تبتلعه الشبكة فعلاً. حجم الرسالة ٤ كيلوبايت."
    >
      <div className="ctrls">
        <div className="ctrl">
          <label>إنتاجٌ (رسالة/ث)</label>
          <input type="range" min="50" max="2000" step="50" value={prod} onChange={(e) => setProd(+e.target.value)} />
          <span className="val">{prod}</span>
        </div>
        <div className="ctrl">
          <label>استهلاكٌ (رسالة/ث)</label>
          <input type="range" min="50" max="2000" step="50" value={cons} onChange={(e) => setCons(+e.target.value)} />
          <span className="val">{cons}</span>
        </div>
        <div className="ctrl">
          <label>سقف الطابور</label>
          <input type="range" min="0" max="4000" step="200" value={cap} onChange={(e) => setCap(+e.target.value)} />
          <span className="val">{cap === 0 ? 'بلا حدّ' : cap}</span>
        </div>
        <div className="ctrl">
          <label>السياسة عند الامتلاء</label>
          <div className="chips">
            <Chip on={policy === 'block'} onClick={() => setPolicy('block')} color="#d0784f">احجز</Chip>
            <Chip on={policy === 'drop'} onClick={() => setPolicy('drop')} color="#c06fd0">أسقِط</Chip>
            <Chip on={policy === 'kill'} onClick={() => setPolicy('kill')} color="#5fbf7f">اقطع</Chip>
            <Chip on={policy === 'none'} onClick={() => setPolicy('none')} color="#ff6b57">بلا سياسة</Chip>
          </div>
          <span />
        </div>
      </div>

      <div className="viz">
        <svg viewBox={`0 0 ${W} ${H + 16}`}>
          {cap > 0 && (
            <line x1="0" y1={H - (cap / maxQ) * (H - 10)} x2={W} y2={H - (cap / maxQ) * (H - 10)} stroke="var(--line-2)" strokeDasharray="4 4" />
          )}
          <path d={path} fill="none" stroke={cap === 0 && prod > cons ? '#ff6b57' : 'var(--core)'} strokeWidth="1.6" />
          {sim.died !== null && <line x1={(sim.died / T) * W} y1="0" x2={(sim.died / T) * W} y2={H} stroke="#ff6b57" strokeWidth="1.5" />}
          <text x={W / 2} y={H + 13} textAnchor="middle" fill="var(--fg-3)" fontSize="10">
            ٣٠ ثانية — المحور الرأسي: طول الطابور
          </text>
        </svg>
      </div>

      <div className="stats">
        <Stat k="ذروة الطابور" v={Math.round(sim.peak)} unit="رسالة" tone={cap === 0 && prod > cons ? 'bad' : 'ok'} />
        <Stat k="ذاكرةٌ محجوزة" v={mb(sim.peak)} unit="م.ب" tone={sim.peak * MSG > 100e6 ? 'bad' : undefined} />
        <Stat k="مُسقَط" v={Math.round(sim.dropped)} unit="رسالة" tone={sim.dropped ? 'warn' : undefined} />
        <Stat k="توقّف المصدر" v={sim.stalled.toFixed(1)} unit="ث" tone={sim.stalled ? 'warn' : undefined} />
      </div>

      <Verdict tone={cap === 0 && prod > cons ? 'bad' : 'ok'}>
        {cap === 0 && prod > cons
          ? `بلا سقف، الطابور لا يستقرّ أبداً: ${mb(sim.peak)} ميجابايت في ثلاثين ثانية فقط، وينمو خطّياً إلى ما لا نهاية. المخزن غير المحدود لا يحلّ البطء — يؤجّله حتى تنفد الذاكرة.`
          : prod <= cons
          ? 'المستهلك يلحق بالمنتج، فلا يتراكم شيء — وهذه الحالة هي بالضبط ما يخدعك في التطوير. ارفع الإنتاج فوق الاستهلاك لترى المشكلة.'
          : policy === 'block'
          ? 'الحجز أوقف المصدر نفسه: لا ذاكرة ضائعة ولا بايت مفقود، والثمن أن كل شيءٍ خلفك يبطئ. هذا جواب نقل الملفّات.'
          : policy === 'drop'
          ? 'الإسقاط أبقى الذاكرة ثابتة والزمن حيّاً، وضحّى بالمحتوى. هذا جواب البثّ ومواقع اللاعبين — لأن الأحدث يُلغي الأقدم.'
          : 'القطع ضحّى بعميلٍ واحدٍ لينجو الباقون. هذا جواب خادم المحادثة: لا يُسمح لواحدٍ بإسقاط الخدمة عن التسعةٍ والأربعين.'}
      </Verdict>
    </Lab>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ٣) مختبر ميزانية الرسم — الإقليم ٠٣
   الادّعاء: «~٣٩ بايتاً للخليّة ⇒ ٧٥ك للإطار ⇒ ٢٫٢ م.ب/ث» و«الرسم التفاضلي
   تحسينٌ بألف ضعفٍ في الحالة الشائعة».
   ══════════════════════════════════════════════════════════════════════════ */

export function PaintLab() {
  const [cols, setCols] = useState(80);
  const [rows, setRows] = useState(24);
  const [depth, setDepth] = useState('true');
  const [diff, setDiff] = useState(false);
  const [changed, setChanged] = useState(0.1);
  const [merge, setMerge] = useState(false);
  const [fps, setFps] = useState(30);

  const PIPE = 8 * 1048576; // ما يبتلعه محاكي طرفيّةٍ نموذجيّاً، بايت/ث

  const r = useMemo(() => {
    const attr = depth === 'true' ? 38 : depth === '256' ? 22 : 10;
    const eff = merge ? attr / 3 + 1 : attr + 1;
    const cells = cols * rows * (diff ? changed : 1);
    const moves = diff ? (cells / 4) * 8 : 0;
    const frame = Math.max(0, cells * eff + moves);
    return { frame, perSec: frame * fps, maxFps: frame > 0 ? PIPE / frame : Infinity, cells };
  }, [cols, rows, depth, diff, changed, merge, fps]);

  const kb = (n) => (n / 1024).toFixed(n < 10240 ? 1 : 0);

  return (
    <Lab
      title="مختبر ميزانية الرسم: كم بايتاً يكلّف إطارٌ واحد؟"
      tag="الإقليم ٠٣"
      note="لا يوجد استدعاء نظامٍ للألوان — كل ما تراه بايتاتٌ تعبر الحدّ. القناة المفترضة ٨ ميجابايت/ث."
    >
      <div className="ctrls">
        <div className="ctrl">
          <label>الأعمدة × الأسطر</label>
          <input type="range" min="40" max="240" step="10" value={cols} onChange={(e) => setCols(+e.target.value)} />
          <span className="val">{cols} × {rows}</span>
        </div>
        <div className="ctrl">
          <label>الأسطر</label>
          <input type="range" min="12" max="70" step="2" value={rows} onChange={(e) => setRows(+e.target.value)} />
          <span className="val">{cols * rows} خليّة</span>
        </div>
        <div className="ctrl">
          <label>عمق اللون</label>
          <div className="chips">
            <Chip on={depth === 'true'} onClick={() => setDepth('true')} color="#c06fd0">لونٌ حقيقي</Chip>
            <Chip on={depth === '256'} onClick={() => setDepth('256')} color="#3fb6cc">٢٥٦</Chip>
            <Chip on={depth === '16'} onClick={() => setDepth('16')} color="#5fbf7f">١٦</Chip>
          </div>
          <span />
        </div>
        <div className="ctrl">
          <label>التقنيات</label>
          <div className="chips">
            <Chip on={diff} onClick={() => setDiff(!diff)} color="#5fbf7f">رسمٌ تفاضلي</Chip>
            <Chip on={merge} onClick={() => setMerge(!merge)} color="#e0a83f">دمج السمات</Chip>
          </div>
          <span />
        </div>
        {diff && (
          <div className="ctrl">
            <label>نسبة ما تغيّر</label>
            <input type="range" min="0.005" max="1" step="0.005" value={changed} onChange={(e) => setChanged(+e.target.value)} />
            <span className="val">{(changed * 100).toFixed(1)}٪</span>
          </div>
        )}
        <div className="ctrl">
          <label>معدّل الإطارات</label>
          <input type="range" min="10" max="60" step="5" value={fps} onChange={(e) => setFps(+e.target.value)} />
          <span className="val">{fps} f/s</span>
        </div>
      </div>

      <div className="stats">
        <Stat k="بايتات الإطار" v={kb(r.frame)} unit="ك.ب" tone={r.frame > 200e3 ? 'bad' : r.frame > 40e3 ? 'warn' : 'ok'} />
        <Stat k="في الثانية" v={(r.perSec / 1048576).toFixed(2)} unit="م.ب/ث" tone={r.perSec > PIPE ? 'bad' : 'ok'} />
        <Stat k="أقصى معدّلٍ ممكن" v={r.maxFps > 999 ? '999+' : Math.floor(r.maxFps)} unit="f/s" tone={r.maxFps < fps ? 'bad' : 'ok'} />
        <Stat k="خلايا تُرسَم" v={Math.round(r.cells)} />
      </div>

      <Verdict tone={r.maxFps < fps ? 'bad' : 'ok'}>
        {r.maxFps < fps
          ? `بهذه الإعدادات القناة لا تحتمل ${fps} إطاراً — سقفها ${Math.floor(r.maxFps)}. شغّل الرسم التفاضلي، أو اخفض عمق اللون، أو تقبّل معدّلاً أقلّ. لا خيار رابع.`
          : diff
          ? `الرسم التفاضلي حوّل الإطار من ${kb(cols * rows * ((depth === 'true' ? 38 : depth === '256' ? 22 : 10) + 1))} ك.ب إلى ${kb(r.frame)} ك.ب. هذا هو الفرق بين لعبةٍ ممكنةٍ ولعبةٍ مستحيلة — من فكرةٍ واحدة: لا ترسم ما لم يتغيّر.`
          : 'إعادة رسم الشاشة كاملةً في كل إطار تعمل — إلى أن تكبر الشاشة. جرّب ٢٠٠×٦٠ قبل أن تعتمد عليها.'}
      </Verdict>
    </Lab>
  );
}
