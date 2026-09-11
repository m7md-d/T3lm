/**
 * عنوانٌ مصرَّف — أربعةٌ وعشرون عنواناً في المنهج تحمل `` `code` ``، فلا يصل
 * القارئَ ماركداونٌ خام (فحصٌ آليّ في `scripts/verify.mjs`).
 */
import { inline } from '../lib/md';

export function Title({ md, as = 'span', className }: { md: string; as?: 'h1' | 'h2' | 'h3' | 'span'; className?: string }) {
  const T = as;
  return <T className={className} dangerouslySetInnerHTML={{ __html: inline(md) }} />;
}
