/**
 * المخطّطات تبقى LTR كما تعرضها أدوات التحليل — شجرة الجبل، سلسلة NAT، طبقات
 * الصورة. وقلبُها للعربية يصادم الأداة التي سيفتحها القارئ.
 *
 * ونصّ SVG العربيّ يحتاج `text-anchor` صريحاً: `unicode-bidi` لا يعمل داخل svg.
 */
export function Figure({ html, caption }: { html: string; caption?: string }) {
  return (
    <figure className="ltr-figure">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {caption ? <figcaption style={{ direction: 'rtl' }}>{caption}</figcaption> : null}
    </figure>
  );
}
