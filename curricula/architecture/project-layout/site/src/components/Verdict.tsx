/**
 * «مشروعٌ يستفيد» و«ومثالٌ مضادّ» — **اثنتا عشرة مرّة، ولا واحدة بلا أختها**.
 *
 * وعرضهما متقابلين هو حجّة المنهج نفسها (المبدأ الخامس): لكل هيكلةٍ ثمنٌ في
 * موضعٍ آخر. وعرض إحداهما وحدها يكذب على القارئ.
 */
import type { Shot } from '../lib/structure';
import Blocks from './Blocks';
import { inline } from '../lib/inline';

export default function Verdict({ good, bad }: { good: Shot; bad: Shot }) {
  return (
    <div className="verdict">
      <article className="v-good">
        <h3>{inline(good.title)}</h3>
        <Blocks blocks={good.blocks} />
      </article>
      <article className="v-bad">
        <h3>{inline(bad.title)}</h3>
        <Blocks blocks={bad.blocks} />
      </article>
    </div>
  );
}
