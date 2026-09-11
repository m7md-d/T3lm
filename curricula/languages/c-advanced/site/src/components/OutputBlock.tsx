/**
 * المخرَج المسجَّل. رموزُه تأخذ ألوان الجهات نفسها — انظر `../lib/outlex.ts`.
 * **ولا يُعرَض مسجَّلٌ بهيئة تشغيلٍ حيّ**: بلا محثٍّ وامضٍ وبلا زرّ.
 */
import { lexOutput } from '../lib/outlex';

export function OutputBlock({ text }: { text: string }) {
  return (
    <pre className="out en"><code dangerouslySetInnerHTML={{ __html: lexOutput(text) }} /></pre>
  );
}
