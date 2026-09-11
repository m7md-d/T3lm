/** نثرٌ مصرَّف من الماركداون. الموقع يعرض ولا ينسخ (الثابت ٤). */
export function Prose({ html, className = 'prose' }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
