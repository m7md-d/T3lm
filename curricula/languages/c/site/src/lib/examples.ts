import { regions } from './content';
import { splitBlocks } from './structure';
import type { Auth, Block } from './structure';

/**
 * أمثلةٌ محلولة للواجهة — **تُنتقى من الماركداون ولا تُكتَب هنا**.
 *
 * الأدلّة §٤: التتبّع شرطٌ سابق للكتابة (R² = 0.46)، ومنهج الدواخل **≥ ٨٠٪
 * بلوكات قراءةٍ وتتبّع**. وقارئ هذا المنهج بلا مخطَّطاتٍ في المجال أصلاً —
 * وحدُّ الأدلّة §١ على «الكلّ المبكر» هو هذا القارئ بعينه. فيُعرَض عليه الكلّ
 * **مثالاً يُقرأ**، لا نظاماً يُبنى بارداً.
 *
 * والانتقاء بقاعدةٍ لا بذوق: من كل إقليمٍ مطلوب، **أقصرُ برنامجٍ كاملٍ فيه
 * ومخرَجُه**، بشرطين: أن يكون مخرَجُه ممّا **تعده المواصفة**، وأن يُقرأ في
 * سطرين. فتقريرُ كاشفٍ أو عنوانُ ذاكرةٍ موضعُه المتن بعد أن يملك القارئ ما
 * يقرأ به — لا الواجهة التي هي أوّل ما يراه من لم يكتب سطراً.
 *
 * وما يُعرَض بعد ذلك أبسطُ ما يملكه الإقليم فعلاً، ويتبع المتنَ إن تغيّر.
 */
export interface Example {
  num: string;
  region: string;
  shot: string;
  at: number;
  code: string;
  out: string;
  auth: Auth;
}

const lines = (s: string) => s.trim().split('\n').length;

/** أقصرُ زوجٍ (برنامجٌ كامل ← مخرَجُه) في هذا الإقليم */
function pick(num: string): Example | null {
  const r = regions.find((x) => x.num === num);
  if (!r) return null;

  let best: Example | null = null;
  let bestScore = Infinity;

  r.chapter.sections.forEach((s, at) => {
    const blocks: Block[] = splitBlocks(s.raw, `ex:${num}`);
    for (let i = 0; i < blocks.length - 1; i++) {
      const a = blocks[i]!;
      if (a.type !== 'code' || a.lang !== 'c') continue;
      /* المقتطع ليس برنامجاً — عرضُه على مبتدئٍ بلا سياقه تشويش */
      if (a.partial) continue;

      /* اللوحة تتلو البرنامج بعد نثرٍ بينهما، فيُبحَث عنها حتى البرنامج التالي */
      let b: Block | null = null;
      for (let j = i + 1; j < blocks.length; j++) {
        const t = blocks[j]!;
        if (t.type === 'code') break;
        if (t.type === 'out' && t.kind === 'out') { b = t; break; }
      }
      if (!b || b.type !== 'out') continue;
      /* الواجهة تعرض ما تعده المواصفة وحده */
      if (b.auth !== 'spec' && b.auth !== 'posix') continue;
      if (lines(b.text) > 2) continue;
      if (b.text.split('\n').some((l) => l.length > 56)) continue;

      const score = lines(a.code) + lines(b.text) * 3;
      if (score >= bestScore) continue;
      bestScore = score;
      best = {
        num, region: r.title, shot: s.title, at,
        code: a.code.replace(/^\/\/!.*$\n?/gm, '').trim(),
        out: b.text.trim(),
        auth: b.auth,
      };
    }
  });

  return best;
}

/** ستّةُ أقاليم موزّعةٍ على الطريق: من أوّل سطرٍ يُكتَب إلى الذاكرة التي تُطلَب */
export const EXAMPLE_REGIONS = ['01', '02', '03', '05', '09', '16'];

export const examples: Example[] = EXAMPLE_REGIONS
  .map(pick)
  .filter((e): e is Example => e !== null);
