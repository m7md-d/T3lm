import { byNum } from './content';
import { splitBlocks } from './structure';
import type { Auth, Block } from './structure';

/**
 * برهانُ الواجهة الأولى — **يُستخرَج من الفصل صفر، ولا يُكتَب هنا**.
 *
 * المنهج يستعمل نمطاً واحداً أربع مرّات: نفس النصّ حرفاً بحرف، وعلمُ ترجمةٍ
 * مختلف، وجوابان متضادّان. وأوّل وقوعه في اللقطة التي تشرح معنى «لا تعد بشيء»،
 * وهو أقصر برهانٍ في المنهج كلّه على أن السؤال الرابع — من قرّر؟ — ليس فلسفة.
 *
 * ويُلتقَط بالبنية لا بالنصّ: لقطةٌ في الفصل صفر فيها مقطعان **متطابقان
 * حرفاً بحرف بعد نزع توجيهات الفحص**، ولكلٍّ لوحتُه. والتطابق هو الادّعاء
 * نفسه، فيُفحَص هنا ولا يُصدَّق. فإن تغيّر المتن غداً تبعه الموقع، وإن زال
 * البرهان لم تظهر واجهةٌ تدّعي ما ليس في المنهج.
 */
export interface Proof {
  /** المصدر، بلا توجيهات الفحص: نفسه في الحالين — وذلك هو الادّعاء */
  source: string;
  runs: { flags: string; out: string; note: string; auth: Auth }[];
}

const strip = (code: string) => code.replace(/^\/\/!.*$\n?/gm, '').trim();

export function heroProof(): Proof | null {
  const zero = byNum('00');
  if (!zero) return null;

  for (const s of zero.chapter.sections) {
    const blocks: Block[] = splitBlocks(s.raw, 'hero');
    const outs = blocks.filter(
      (b): b is Extract<Block, { type: 'out' }> => b.type === 'out',
    );
    const codes = blocks.filter((b): b is Extract<Block, { type: 'code' }> => b.type === 'code');
    if (outs.length !== 2 || codes.length !== 2) continue;

    /* الادّعاء أن النصّين واحد — يُفحَص، ولا يُصدَّق */
    if (strip(codes[0]!.code) !== strip(codes[1]!.code)) continue;

    return {
      source: strip(codes[0]!.code),
      runs: codes.map((c, i) => ({
        flags: c.code.match(/^\/\/!\s*cc:\s*(.+)$/m)?.[1]?.trim() ?? '-O0',
        out: outs[i]!.text.trim(),
        note: outs[i]!.note ?? '',
        auth: outs[i]!.auth,
      })),
    };
  }
  return null;
}
