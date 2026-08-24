import { useNavigate } from 'react-router-dom';

/**
 * الآلة — رسمٌ مباشرٌ لمخطّط الإقليم ٠٩ («أربعة أحمالٍ على آلةٍ واحدة»).
 * كل صندوقٍ يحمل رقم الإقليم الذي يبنيه، ويقود إليه.
 *
 * فخّ SVG العربي: `unicode-bidi` لا يعمل داخل <svg>، فكل <text> عربي هنا
 * له `textAnchor="middle"` صريح و`x` عند مركز صندوقه.
 */

const SRC = [
  { id: 'sock-in', x: 700, y: 30, w: 170, h: 34, t: 'مقبس', r: 'bytes', loads: ['chat', 'game', 'stream', 'files'] },
  { id: 'kbd', x: 700, y: 76, w: 170, h: 34, t: 'لوحة المفاتيح', r: 'terminal', loads: ['chat', 'game', 'files'] },
  { id: 'timer', x: 700, y: 122, w: 170, h: 34, t: 'مؤقّت · إشارة', r: 'who-waits', loads: ['game', 'stream'] },
  { id: 'cam', x: 700, y: 168, w: 170, h: 34, t: 'كاميرا · مايك', r: 'media', loads: ['stream'] },
  { id: 'disk-in', x: 700, y: 214, w: 170, h: 34, t: 'قرص (خيط)', r: 'disk', loads: ['files'] },
];

const OUT = [
  { id: 'screen', x: 40, y: 54, w: 170, h: 34, t: 'الشاشة', r: 'terminal', loads: ['chat', 'game', 'stream', 'files'] },
  { id: 'sock-out', x: 40, y: 122, w: 170, h: 34, t: 'مقبس', r: 'protocol', loads: ['chat', 'game', 'stream', 'files'] },
  { id: 'disk-out', x: 40, y: 190, w: 170, h: 34, t: 'قرص', r: 'disk', loads: ['files'] },
];

const PARTS = [
  { id: 'ring', x: 300, y: 210, w: 148, h: 46, t: 'مخازن حلقيّة', n: '٠١', r: 'bytes' },
  { id: 'parse', x: 462, y: 210, w: 148, h: 46, t: 'محلّل تزايدي', n: '٠١', r: 'bytes' },
  { id: 'queue', x: 300, y: 272, w: 148, h: 46, t: 'طابور خرجٍ محدود', n: '٠٢', r: 'who-waits' },
  { id: 'thr', x: 462, y: 272, w: 148, h: 46, t: 'خيوطٌ للحاصر', n: '٠٨', r: 'disk' },
];

const LOOP = { x: 288, y: 60, w: 334, h: 120 };

export default function MachineMap({ load, onHover }) {
  const nav = useNavigate();
  const dim = (loads) => (load && loads && !loads.includes(load) ? 'dim' : '');

  const Box = ({ b, cls = '', fill = 'var(--bg-2)', stroke = 'var(--line-2)' }) => (
    <g
      className={`blk ${cls}`}
      onClick={() => b.r && nav(`/r/${b.r}`)}
      onMouseEnter={() => onHover?.(b.r)}
      onMouseLeave={() => onHover?.(null)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && b.r && nav(`/r/${b.r}`)}
    >
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill={fill} stroke={stroke} />
      <text
        x={b.x + b.w / 2}
        y={b.y + (b.n ? b.h / 2 - 3 : b.h / 2 + 5)}
        textAnchor="middle"
        fill="var(--fg)"
        fontSize="13"
      >
        {b.t}
      </text>
      {b.n && (
        <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 15} textAnchor="middle" fill="var(--fg-3)" fontSize="11">
          {b.n}
        </text>
      )}
    </g>
  );

  return (
    <div className="machine">
      <svg viewBox="0 0 910 340" role="img" aria-label="مخطّط الآلة المشتركة بين المشاريع الأربعة">
        <defs>
          <marker id="ah" markerWidth="7" markerHeight="7" refX="6" refY="3.2" orient="auto">
            <path d="M0,0 L7,3.2 L0,6.4 z" fill="var(--fg-3)" />
          </marker>
        </defs>

        {/* المصادر ← الحلقة */}
        {SRC.map((b) => (
          <g key={b.id} className={dim(b.loads)}>
            <Box b={b} />
            <path
              d={`M${b.x} ${b.y + b.h / 2} L${LOOP.x + LOOP.w + 14} ${b.y + b.h / 2} L${LOOP.x + LOOP.w + 14} ${
                LOOP.y + LOOP.h / 2
              } L${LOOP.x + LOOP.w} ${LOOP.y + LOOP.h / 2}`}
              fill="none"
              stroke="var(--line-2)"
              strokeWidth="1"
              markerEnd="url(#ah)"
            />
          </g>
        ))}

        {/* الحلقة */}
        <rect
          x={LOOP.x}
          y={LOOP.y}
          width={LOOP.w}
          height={LOOP.h}
          rx="4"
          fill="color-mix(in srgb, var(--core) 9%, var(--bg-1))"
          stroke="var(--core)"
        />
        <g
          className="blk"
          onClick={() => nav('/r/who-waits')}
          onMouseEnter={() => onHover?.('who-waits')}
          onMouseLeave={() => onHover?.(null)}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && nav('/r/who-waits')}
        >
          <rect x={LOOP.x + 1} y={LOOP.y + 1} width={LOOP.w - 2} height={LOOP.h - 2} rx="3" fill="transparent" stroke="none" />
          <text x={LOOP.x + LOOP.w / 2} y={LOOP.y + 40} textAnchor="middle" fill="var(--fg)" fontSize="17" fontWeight="700">
            حلقة الأحداث
          </text>
          <text x={LOOP.x + LOOP.w / 2} y={LOOP.y + 62} textAnchor="middle" fill="var(--core)" fontSize="12">
            الإقليم ٠٢ — قلب المنهج
          </text>
          <text
            x={LOOP.x + LOOP.w / 2}
            y={LOOP.y + 90}
            textAnchor="middle"
            fill="var(--fg-3)"
            fontSize="11.5"
            fontFamily="var(--mono)"
            direction="ltr"
          >
            epoll · timerfd · signalfd · eventfd
          </text>
        </g>

        {/* الحلقة ← المصارف */}
        {OUT.map((b) => (
          <g key={b.id} className={dim(b.loads)}>
            <Box b={b} />
            <path
              d={`M${LOOP.x} ${LOOP.y + LOOP.h / 2} L${LOOP.x - 14} ${LOOP.y + LOOP.h / 2} L${LOOP.x - 14} ${
                b.y + b.h / 2
              } L${b.x + b.w} ${b.y + b.h / 2}`}
              fill="none"
              stroke="var(--line-2)"
              strokeWidth="1"
              markerEnd="url(#ah)"
            />
          </g>
        ))}

        {/* اللبنات المشتركة */}
        <path
          d={`M${LOOP.x + LOOP.w / 2} ${LOOP.y + LOOP.h} L${LOOP.x + LOOP.w / 2} 198`}
          stroke="var(--line-2)"
          strokeWidth="1"
          fill="none"
        />
        {PARTS.map((b) => (
          <Box key={b.id} b={b} />
        ))}

        <text x="455" y="334" textAnchor="middle" fill="var(--fg-3)" fontSize="11.5">
          اللبنات الخمس تظهر في المشاريع الأربعة كلّها — ما يتغيّر هو الأحجام والسياسات
        </text>
      </svg>
    </div>
  );
}
