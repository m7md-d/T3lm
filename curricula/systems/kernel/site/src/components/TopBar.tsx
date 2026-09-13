import { Link, NavLink } from 'react-router-dom';

/**
 * الرمز: شريطان وبينهما فتحةٌ واحدة يعبرها خطّ.
 *
 * وهو **ما يُدرَّس** لا اسم الموضوع: البديهية ٣ — «العبور بين الحلقات لا يقع
 * إلا ببوّابةٍ يعرّفها الكيرنل بنفسه». الشريط الأعلى غير مميَّز، والأسفل
 * مميَّز، والعبور من موضعٍ واحد.
 */
export function Mark({ className = 'bar-mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="20" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <rect x="2" y="15" width="20" height="6" rx="1" fill="currentColor" opacity="0.16" />
      <rect x="2" y="15" width="20" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 9v6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function TopBar() {
  return (
    <header className="bar">
      <Link className="bar-home" to="/">
        <Mark />
        <span>الكيرنل من الجذور</span>
      </Link>
      <span className="bar-sp" />
      <NavLink className="bar-link" to="/trail">الأثر</NavLink>
      <NavLink className="bar-link" to="/sources">من يضمن</NavLink>
      <NavLink className="bar-link" to="/appendix">الملاحق</NavLink>
    </header>
  );
}
