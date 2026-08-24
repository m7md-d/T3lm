/**
 * بطاقة الكلمة المفتاحية — ٧ بطاقات بنفس الحقول الخمسة.
 * حقل «ماذا لا تفعل» يُبرَز لأنه موضع دفن الاعتقاد في كل بطاقة.
 */
export default function KeywordCard({ name, rows }: { name: string; rows: [string, string][] }) {
  return (
    <section className="kw">
      <header className="kw-head">
        <span className="kw-tag">كلمة مفتاحية</span>
        <code className="kw-name">{name}</code>
      </header>
      <dl className="kw-body">
        {rows.map(([k, v], i) => (
          <div key={i} className="kw-row" data-bury={/لا تفعل/.test(k) || undefined}>
            <dt>{k.replace(/\*\*/g, '')}</dt>
            <dd dangerouslySetInnerHTML={{ __html: v.replace(/`([^`]+)`/g, '<code>$1</code>') }} />
          </div>
        ))}
      </dl>
    </section>
  );
}
