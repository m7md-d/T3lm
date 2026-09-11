/**
 * الانتقال — **بضغطةٍ واحدة في نفس الموضع دائماً**، وزرُّ التالي يسمّي ما بعده.
 * وترتيب الـpager في RTL: «السابق» أوّلاً في الـDOM.
 */
import { Link } from 'react-router-dom';
import { Title } from './Title';

interface Step { to: string; title: string }

export function ShotNav({ prev, next, nextKind = 'القسم التالي' }: { prev?: Step; next?: Step; nextKind?: string }) {
  return (
    <nav className="pager">
      {prev ? (
        <Link className="pager-a pager-prev" to={prev.to}>
          <span className="pager-kind">السابق</span>
          <Title md={prev.title} className="pager-title" />
        </Link>
      ) : <span />}
      {next ? (
        <Link className="pager-a pager-next" to={next.to}>
          <span className="pager-kind">{nextKind}</span>
          <Title md={next.title} className="pager-title" />
        </Link>
      ) : <span />}
    </nav>
  );
}
