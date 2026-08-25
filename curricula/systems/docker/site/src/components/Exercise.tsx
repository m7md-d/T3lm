/**
 * التمرين — والعدد مكتوبٌ في العنوان نفسه («اثنان» · «ثلاثة»)، فيُقرأ منه.
 *
 * **ولا زرّ «اكشف الحلّ» في هذا الموقع كلّه**: واحدٌ وثلاثون عنواناً في المصدر
 * نصُّه «ولا حلول»، وأيّ كشفٍ هنا يكذب على القارئ.
 */
import { Prose } from './Prose';

export function Exercise({ count, html }: { count: number; html: string }) {
  return (
    <section className="exercise">
      <div className="exercise__head">
        <h2>التمرين</h2>
        <span className="exercise__count num">{count}</span>
      </div>
      <Prose html={html} />
      <p className="exercise__no-solutions">لا حلول — والمعيار معايير قبولٍ تفحصها بنفسك.</p>
    </section>
  );
}
