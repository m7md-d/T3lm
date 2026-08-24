import { marked } from 'marked';

/** ماركداون سطريّ في نصٍّ قصير — عنوانٌ أو ذيلُ لوحة. */
export function inline(md: string) {
  return <span dangerouslySetInnerHTML={{ __html: marked.parseInline(md) as string }} />;
}
