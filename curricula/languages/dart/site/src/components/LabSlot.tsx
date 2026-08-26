/**
 * موضع المختبر — بعد اللقطة التي أنتجت ادّعاءه بالضبط.
 * ويُحمَّل كسولاً: المختبران ليسا في مسار قراءة الأقاليم الأخرى.
 */
import { Suspense, lazy } from 'react';
import { labFor } from '../content/labs';

const TwoMachines = lazy(() => import('./labs/TwoMachines').then((m) => ({ default: m.TwoMachines })));
const EventLoop = lazy(() => import('./labs/EventLoop').then((m) => ({ default: m.EventLoop })));

export function LabSlot({ region, title }: { region: string; title: string }) {
  const lab = labFor(region, title);
  if (!lab) return null;
  return (
    <Suspense fallback={<div className="lab lab--loading" />}>
      {lab.id === 'two-machines' ? <TwoMachines /> : <EventLoop />}
    </Suspense>
  );
}
