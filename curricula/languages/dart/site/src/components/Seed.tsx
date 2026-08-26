/**
 * البذرة — واحدةٌ وعشرون في المصدر، وكلُّها تصف ما يفتحه الإقليم القادم.
 * فهي **رابط التالي نفسه**: بنية النصّ صارت ملاحة، ولا pager عامٌّ بجانبها.
 */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Prose } from './Prose';
import { inline } from '../lib/md';

export function Seed({ html, to, next }: { html: string; to?: string; next?: string }) {
  return (
    <section className="seed">
      <div className="seed__label">البذرة</div>
      <Prose className="seed__body" html={html} />
      {to && next ? (
        <Link className="seed__to" to={to}>
          <ArrowLeft aria-hidden />
          <span dangerouslySetInnerHTML={{ __html: inline(next) }} />
        </Link>
      ) : null}
    </section>
  );
}
