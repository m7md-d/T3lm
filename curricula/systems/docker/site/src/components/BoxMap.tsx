/**
 * الخريطة: `programs/01-box.c` بأسطره الثمانية والتسعين.
 *
 * المنهج مبنيٌّ على برنامجٍ واحد — «الأصل أن كل حزمةٍ تفكّك سطراً من `box`»
 * (`../../README.md`) — فخريطته هي البرنامج، لا قائمةُ أربعةٍ وثلاثين صفّاً.
 *
 * والمصدر يُقرأ من الملفّ نفسه وقت البناء: لا نصَّ منسوخاً هنا.
 */
import { highlightToHtml } from '@t3lm/kit/highlight/c';
import src from '../../../programs/01-box.c?raw';

const SRC = src.replace(/\n$/, '');
const LINES = SRC.split('\n');
/* المحلّل يفصل الأسطر بنفسه ولا يمدّ رمزاً عبرها، فالقسمة على `\n` سليمة. */
const PAINTED = highlightToHtml(SRC, 'c').split('\n');

export function BoxMap({ hit = [] }: { hit?: [number, number][] }) {
  const inHit = (n: number) => hit.some(([a, b]) => n >= a && n <= b);
  const anyHit = hit.length > 0;

  return (
    <div className="boxmap">
      <pre className="boxmap__code en">
        {LINES.map((_, i) => {
          const n = i + 1;
          const on = inHit(n);
          return (
            <span className="boxmap__ln" key={n} data-hit={on} data-dim={anyHit && !on}>
              <span className="boxmap__no">{n}</span>
              <span
                className="boxmap__src"
                dangerouslySetInnerHTML={{ __html: PAINTED[i] || '&nbsp;' }}
              />
            </span>
          );
        })}
      </pre>
    </div>
  );
}

export const BOX_LINE_COUNT = LINES.length;
