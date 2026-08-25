/**
 * معرض المكوّنات — **أداة بناء، لا صفحة في الموقع**.
 *
 * كل ما فيه بياناتٌ اصطناعية موضوعها المكوّن نفسه: **لا نصَّ محتوًى منسوخاً من
 * `../../regions/`** (الثابت ٤). غايته أن يُرى كل مكوّنٍ في متصفّحٍ حقيقيّ قبل
 * أن يُوصَل بالتصريف، فتبقى الخطوة التالية وصلَ بيانات لا تصميماً.
 *
 * ولا يُدرَج في الملاحة ولا في خريطة الموقع.
 */
import { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Panel } from '../components/Panel';
import { CodeBlock } from '../components/CodeBlock';
import { AuthorityTag } from '../components/AuthorityTag';
import { SiteTag } from '../components/SiteTag';
import { VmNotice } from '../components/VmNotice';
import { PredictionGate } from '../components/PredictionGate';
import { MasteryDiff } from '../components/MasteryDiff';
import { SummaryTable } from '../components/SummaryTable';
import { Exercise } from '../components/Exercise';
import { Seed } from '../components/Seed';
import { NextShot } from '../components/NextShot';
import { LabSlot } from '../components/LabSlot';
import { ProcessCard, FIELDS } from '../components/ProcessCard';
import { NsStrip } from '../components/NsStrip';
import { Trace } from '../components/Trace';
import { CopyButton } from '../components/CopyButton';
import { TAGS } from '../lib/authority';
import type { PanelBlock } from '../lib/types';

const panel = (tag: PanelBlock['tag'], site: PanelBlock['site']): PanelBlock => ({
  kind: 'panel',
  role: 'gate',
  site,
  tag,
  command: 'readlink /proc/self/ns/pid',
  output: [
    'pid:[4026531836]',
    'exit: 137',
    'oom_kill 1',
    'docker run -m 64m alpine:3.20',
    'mkdir: Operation not permitted',
    'max …',
  ].join('\n'),
});

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--dk-gap-xl)' }}>
      <header className="section-head"><h2>{title}</h2></header>
      <div className="stack">{children}</div>
    </section>
  );
}

export function KitPage() {
  const [ns, setNs] = useState<boolean[]>([true, true, false, true, false, false, true]);
  const NAMES = ['mnt', 'pid', 'net', 'ipc', 'uts', 'user', 'cgroup'] as const;
  const own = Object.fromEntries(NAMES.map((n, i) => [n, ns[i]])) as Record<(typeof NAMES)[number], boolean>;

  return (
    <>
      <TopBar where="معرض المكوّنات" />
      <main className="main" id="main">
        <header className="section-head"><h1>معرض المكوّنات</h1></header>
        <p className="measure" style={{ color: 'var(--dk-muted)' }}>
          بياناتٌ اصطناعية. أداة بناءٍ لا صفحة موقع.
        </p>

        <Row title="سلّم السلطة">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TAGS.map((t) => <AuthorityTag key={t} tag={t} />)}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <SiteTag site="lab" /><SiteTag site="host" />
          </div>
        </Row>

        <Row title="التشريح مرسًى إلى سطره">
          <Panel
            block={panel('@kernel', 'lab')}
            notes={{ 0: 'inode النطاق — رقمٌ يخصّ هذا التشغيل.', 1: '١٢٨ + ٩ ⇒ SIGKILL.', 5: 'ما لا تضمنه اللوحة.' }}
          />
        </Row>

        <Row title="لوحة المخرَج">
          <Panel block={panel('@kernel', 'lab')} />
          <Panel block={panel('@impl', 'host')} />
          <Panel block={panel('@vm', 'host')} />
          <Panel block={panel('@machine', 'lab')} />
        </Row>

        <Row title="سلسلة المختبر — جلسةٌ واحدةٌ للإقليم">
          <div className="labchain stack">
            <Panel block={panel('@kernel', 'lab')} />
            <Panel block={panel('@kernel', 'lab')} />
          </div>
        </Row>

        <Row title="الكود والبرنامج">
          <CodeBlock lang="c" name="demo.c" code={'/* تعليق */\nint main(int argc, char **argv)\n{\n\tlong n = 64;\n\treturn n == 0 ? 1 : 0;\n}\n'} />
          <CodeBlock lang="sh" name="sh" code={"# سطرُ تعليق\necho 64M > /sys/fs/cgroup/mem/memory.max\nsh -c 'echo $$ > cgroup.procs; exec /tmp/eat 512' 2>/dev/null\necho \"exit: $?\"\n"} />
          <CopyButton text="—" />
        </Row>

        <Row title="بيئتك">
          <VmNotice>الرقم أدناه يتبع نواةَ الآلة الافتراضية.</VmNotice>
        </Row>

        <Row title="البوّابة وفرق الإتقان">
          <PredictionGate id="kit-demo" askHtml="<p>ماذا يطبع السطر التالي؟</p>">
            <Panel block={panel('@kernel', 'lab')} />
          </PredictionGate>
          <MasteryDiff predicted="توقّعٌ مكتوبٌ بخطّ القارئ." was={'exit: 137\nvalue: …'} />
        </Row>

        <Row title="نهاية اللقطة ونهاية الإقليم">
          <NextShot title="عنوان اللقطة القادمة" onGo={() => {}} />
          <SummaryTable rows={[
            { learned: 'عبارةٌ اصطناعية أولى', node: 'العقدة التي تتعلّق بها' },
            { learned: 'عبارةٌ اصطناعية ثانية', node: 'عقدةٌ أخرى' },
          ]} />
          <Exercise count={2} html="<ol><li>تمرينٌ اصطناعيّ.</li><li>وآخر.</li></ol>" />
          <Seed html="<p>سطرُ بذرةٍ اصطناعيّ.</p>" />
        </Row>

        <Row title="الموتيف">
          <ProcessCard on={[FIELDS[0], FIELDS[3]]} values={{ [FIELDS[0]]: '7', [FIELDS[3]]: '14/41' }} />
          <div className="stack">
            <NsStrip own={own} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {NAMES.map((n, i) => (
                <button key={n} type="button" className="copybtn"
                        onClick={() => setNs((v) => v.map((x, j) => (j === i ? !x : x)))}>
                  <span className="en">{n}</span>
                </button>
              ))}
            </div>
          </div>
        </Row>

        <Row title="موضع مختبر">
          <LabSlot name="مختبرٌ اصطناعيّ" claim="ادّعاءٌ يقلبه المُدخَل.">
            <p style={{ color: 'var(--dk-muted)' }}>المزالج والنتيجة هنا.</p>
          </LabSlot>
        </Row>

        <Row title="الأثر">
          <Trace rows={[{ from: '13', what: 'سطرُ أثرٍ اصطناعيّ' }, { from: '14', what: 'وآخر' }]} />
        </Row>
      </main>
    </>
  );
}
