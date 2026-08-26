/**
 * التمرين — **ولا زرّ «اكشف الحلّ» في هذا الموقع كلّه**: المنهج بلا حلول،
 * وأيّ كشفٍ هنا يكذب على القارئ. والمعيار معايير قبولٍ يفحصها بنفسه.
 */
import { Prose } from './Prose';

export function Exercise({ html }: { html: string }) {
  return (
    <section className="exercise">
      <h2>التمرين</h2>
      <Prose html={html} />
    </section>
  );
}
