import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { regions, docs } from '../content/index.js';
import { buildRegion, buildIndex } from '../lib/stations.js';

/**
 * لوحة الأوامر — مبرَّرة بوجود «الورقة المرجعيّة» في المنهج نفسه: ملحقٌ يقول
 * إنه «يُفتح أثناء العمل لا يُقرأ مرّة». من يعمل يطارد مصطلحاً، لا يتصفّح.
 */
export default function Palette({ open, onClose }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const inputRef = useRef(null);

  const index = useMemo(() => {
    const docsMap = Object.fromEntries(regions.map((r) => [r.slug, buildRegion(r.raw)]));
    const base = buildIndex(regions, docsMap);
    for (const d of docs) base.push({ kind: 'ملحق', to: d.path, title: d.title, sub: d.blurb, hay: `${d.title} ${d.blurb}` });
    base.push({ kind: 'صفحة', to: '/threads', title: 'الأنماط الثمانية', sub: 'خيوطٌ تعبر الأقاليم', hay: 'أنماط خيوط جيل ملكيّة مخزن' });
    base.push({ kind: 'صفحة', to: '/matrix', title: 'الجدول الجامع', sub: 'الأربعة جنباً إلى جنب', hay: 'جدول مقارنة مشاريع سياسة' });
    base.push({ kind: 'صفحة', to: '/labs', title: 'المختبرات', sub: 'ادّعاءاتٌ تُقلَب', hay: 'مختبرات تجربة' });
    return base;
  }, []);

  const hits = useMemo(() => {
    const s = q.trim();
    if (!s) return index.filter((x) => x.kind === 'إقليم' || x.kind === 'صفحة' || x.kind === 'ملحق').slice(0, 14);
    const words = s.split(/\s+/);
    return index
      .filter((x) => words.every((w) => x.hay.includes(w)))
      .slice(0, 40);
  }, [q, index]);

  useEffect(() => setI(0), [q]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setI((v) => Math.min(v + 1, hits.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setI((v) => Math.max(v - 1, 0));
      }
      if (e.key === 'Enter' && hits[i]) {
        e.preventDefault();
        onClose();
        nav(hits[i].to);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hits, i, nav, onClose]);

  if (!open) return null;

  return (
    <div className="pal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pal">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث في الأقاليم والمحطّات والخطوات وصناديق الخطأ…"
          aria-label="بحث"
        />
        {hits.length === 0 ? (
          <div className="empty">لا شيء. جرّب مصطلحاً تقنياً: epoll، fsync، RTP، termios.</div>
        ) : (
          <ul>
            {hits.map((h, k) => (
              <li key={`${h.to}-${k}`} className={k === i ? 'on' : ''}>
                <a
                  href={`#${h.to}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                    nav(h.to);
                  }}
                  onMouseEnter={() => setI(k)}
                >
                  <span className="kind">{h.kind}</span>
                  <span>
                    <span className="t">{h.title}</span>
                    <br />
                    <span className="s">{h.sub}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
