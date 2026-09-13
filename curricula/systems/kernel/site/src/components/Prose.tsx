/** نثرٌ مصرَّف. والجداول تُلفّ بحاويةٍ تمرّ أفقياً فلا يمرّ جسم الصفحة. */
export function Prose({ html, className = '' }: { html: string; className?: string }) {
  const wrapped = html.includes('<table')
    ? html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>')
    : html;
  return <div className={`prose ${className}`} dangerouslySetInnerHTML={{ __html: wrapped }} />;
}

/** فقرةُ حدٍّ على الادّعاء الذي قبلها. والرمز قناتُها الثانية، فلا لون خامس. */
export function Limit({ html }: { html: string }) {
  return (
    <div className="limit">
      <span className="limit-mark" aria-hidden="true">⚠</span>
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
