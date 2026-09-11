/**
 * المختبر — الاكتفاء الذاتي (الثابت ٣): كلُّ لوحةٍ هنا تُعاد بأمر.
 * ونصُّه من `../../../README.md` §الأدوات و§التحقّق، يُصرَّف ولا يُنسَخ.
 */
import { TopBar } from '../components/TopBar';
import { Prose } from '../components/Prose';
import { labCommands, section } from '../content/plan';
import { html } from '../lib/md';
import { programCount } from '../content/programs';
import { chapters } from '../content/regions';

const panelCount = chapters.reduce((n, c) => n + c.panels.length, 0);

export function LabPage() {
  return (
    <>
      <TopBar where="المختبر" />
      <main id="main" className="doc">
        <h1 className="doc-h">المختبر</h1>
        <p className="lede">
          لوحات هذا الموقع — <span className="en">{panelCount}</span> لوحة — خرجت من صورةٍ واحدة،
          وبرامجُها <span className="en">{programCount}</span> ملفاً في <code className="en">programs/</code>.
          والأمران أدناه يعيدان بناءها وتشغيلها عندك.
        </p>

        <pre className="repro-cmd en"><code>{labCommands.join('\n')}</code></pre>

        <h2 className="h2">الأدوات</h2>
        <Prose html={html(section('الأدوات'))} />

        <h2 className="h2">ما يفرضه الموضوع على الفاحص</h2>
        <Prose html={html(section('التحقّق'))} />
      </main>
    </>
  );
}
