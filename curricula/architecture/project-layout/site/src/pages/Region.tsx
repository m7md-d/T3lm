/**
 * صفحة الإقليم — **لقطةٌ واحدة في الشاشة**، والانتقال بيد القارئ.
 *
 * والملاحة من بنية النصّ (ركيزة ٤): «بذرة» آخر كل فصلٍ **هي** رابط الذي بعده،
 * فلا pager عامّ بجانبها. و«يستفيد/مضادّ» يُدمَجان في لقطةٍ واحدة لأنهما حجّةٌ
 * واحدة لا تصحّ مقطوعة.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { regions, shotsOf } from '../lib/content';
import { store } from '../lib/store';
import Blocks from './../components/Blocks';
import Verdict from './../components/Verdict';
import { inline } from '../lib/inline';

export default function Region() {
  const { num = '00' } = useParams();
  const [params, setParams] = useSearchParams();
  const r = regions.find((x) => x.num === num);
  const next = regions[regions.findIndex((x) => x.num === num) + 1];

  /* «يستفيد» و«مضادّ» لقطةٌ واحدة — والدمج في `content.ts` ليُقرأ منه رقمُ
     اللقطة نفسه في الواجهة و«ما توقّعتَه». */
  const shots = useMemo(() => (r ? shotsOf(r) : []), [r]);

  const at = Math.min(Math.max(Number(params.get('s') ?? store.lastShot(num)), 0), shots.length - 1);
  const [, force] = useState(0);

  useEffect(() => {
    if (!r) return;
    store.see(num, at);
    force((x) => x + 1);
    window.scrollTo({ top: 0 });
  }, [num, at, r]);

  if (!r) return <main className="region"><p>لا إقليم بهذا الرقم.</p></main>;

  const shot = shots[at];
  const go = (i: number) => setParams(i === 0 ? {} : { s: String(i) }, { replace: false });
  /* ما عُبر مرّةً يبقى مفتوحاً — ولا يُعاد المرور تسلسلياً لبلوغ نقطةٍ معلومة */
  const far = Math.max(at, store.furthest(num));
  const isSeed = shot?.title === 'بذرة';

  return (
    <main className="region">
      <nav className="trail" aria-label="أثرك في هذا الإقليم">
        <span className="en n">{r.num}</span>
        <b>{inline(r.title)}</b>
        <ol>
          {shots.map((s, i) => {
            if (i > far) return null;
            return (
              <li key={s.id} className={i === at ? 'now' : ''}>
                <button type="button" onClick={() => go(i)}>{inline(s.title)}</button>
              </li>
            );
          })}
        </ol>
      </nav>

      <article className="shot">
        {at === 0 && (
          <header className="lead">
            <h1>{inline(r.title)}</h1>
            <div className="prose" dangerouslySetInnerHTML={{ __html: leadHtml(r.chapter.lead) }} />
          </header>
        )}

        <h2>{inline(shot?.title ?? '')}</h2>
        {shot && (shot.pair
          ? <Verdict good={shot} bad={shot.pair} />
          : <Blocks blocks={shot.blocks} />)}

        {isSeed && next ? (
          <Link className="seed-door" to={`/r/${next.num}`}>
            <span className="en">{next.num}</span>
            <b>{inline(next.title)}</b>
          </Link>
        ) : (
          <nav className="pager" aria-label="التنقّل بين اللقطات">
            <button type="button" disabled={at === 0} onClick={() => go(at - 1)}>السابقة</button>
            <button type="button" disabled={at >= shots.length - 1} onClick={() => go(at + 1)}>
              <span>{shots[at + 1] ? inline(shots[at + 1]!.title) : 'انتهى'}</span>
            </button>
          </nav>
        )}
      </article>
    </main>
  );
}

/* النبذة اقتباسٌ في الماركداون؛ تُنظَّف علاماته ويبقى نصّها */
function leadHtml(lead: string): string {
  return lead
    .replace(/^> ?/gm, '')
    .split(/\n\s*\n/)
    .map((p) => `<p>${p.replace(/\*\*(.+?)\*\*/gs, '<b>$1</b>').replace(/`(.+?)`/g, '<code class="en">$1</code>')}</p>`)
    .join('');
}
