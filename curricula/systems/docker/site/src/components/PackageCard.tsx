/**
 * بطاقة حزمة — ثمانٍ بدل أربعةٍ وثلاثين صفّاً، وهو قرار المؤلّف في المصدر:
 * «أربعةٌ وثلاثون إقليماً في قائمةٍ واحدة لوحةٌ لا تُقرأ».
 *
 * والحقل الذي **يفرّق** بينها موجودٌ في جدول `../../README.md`: السطر الذي
 * تفكّكه كلُّ حزمةٍ من `box`. وبدونه تصير ثمانياً متطابقةً بحقلٍ مكرّر.
 *
 * وتُفتَح في موضعها فتصير أقاليمها على بعد ضغطةٍ واحدة — الطريق يبقى حزمةً
 * حزمة كما في المصدر، ولا يصير الوصول إلى إقليمٍ رحلةَ صفحتين.
 */
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { Package } from '../lib/types';
import { inline } from '../lib/md';
import { RegionRail, type RailItem } from './RegionRail';

export function PackageCard({
  pkg, open = false, onToggle, onHover, regions = [], to,
}: {
  pkg: Package;
  open?: boolean;
  onToggle?: () => void;
  onHover?: (id: string | null) => void;
  regions?: RailItem[];
  to: string;
}) {
  return (
    <section
      className="pkgcard"
      data-open={open}
      onMouseEnter={() => onHover?.(pkg.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <button type="button" className="pkgcard__head" onClick={onToggle} aria-expanded={open}>
        <div className="pkgcard__top">
          <span className="pkgcard__range num en">{pkg.range[0]}–{pkg.range[1]}</span>
          <span className="pkgcard__name">{pkg.name}</span>
          <span className="topbar__spacer" />
          <ChevronDown aria-hidden className="pkgcard__chev" />
        </div>
        <p className="pkgcard__takes" dangerouslySetInnerHTML={{ __html: inline(pkg.takes) }} />
        <p className="pkgcard__line">
          <span className="pkgcard__line-label">تفكّك من </span>
          <code>box</code>
          <span className="pkgcard__line-label">: </span>
          <span dangerouslySetInnerHTML={{ __html: inline(pkg.line) }} />
        </p>
      </button>

      {open ? (
        <div className="pkgcard__body">
          <RegionRail items={regions} />
          <Link className="pkgcard__more" to={to}>الحزمة على الخريطة</Link>
        </div>
      ) : null}
    </section>
  );
}
