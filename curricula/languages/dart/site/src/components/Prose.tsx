/** نثرٌ مصرَّفٌ من الماركداون. المصدر `../../../regions/`، ولا نصَّ هنا. */
export function Prose({ html, className }: { html: string; className?: string }) {
  return <div className={className ? `prose ${className}` : 'prose'} dangerouslySetInnerHTML={{ __html: html }} />;
}
