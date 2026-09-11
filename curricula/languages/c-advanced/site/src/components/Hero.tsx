/**
 * البديهية السادسة مرسومة: عنوانان مختلفان يشيران إلى الذاكرة نفسها.
 *
 * **والعنوان العدديّ على السهم شرطٌ لا زينة** (أدلّة §٥): مخطّط صندوق-وسهم بلا
 * عنوانٍ يُخرج قارئه بأن المؤشّر وعاءٌ يحوي البيانات.
 *
 * والرقمان **مُنتزَعان من لوحة الفصل ٠٠**، لا مكتوبان هنا. واتجاه المخطّط LTR
 * كما تعرضه الأدوات، وكل `<text>` له `text-anchor` صريح لأن `unicode-bidi`
 * لا يعمل داخل `<svg>`.
 */
import { chapterAt } from '../content/regions';

function twoAddresses(): [string, string] | null {
  const ch = chapterAt('00');
  if (!ch) return null;
  for (const p of ch.panels) {
    const a = /^\s*a\s*=\s*(0x[0-9a-f]+)/m.exec(p.output);
    const b = /^\s*b\s*=\s*(0x[0-9a-f]+)/m.exec(p.output);
    if (a && b) return [a[1]!, b[1]!];
  }
  return null;
}

export function Hero() {
  const pair = twoAddresses();
  if (!pair) return null;
  const [a, b] = pair;

  return (
    <svg className="hero-fig" viewBox="0 0 520 190" role="img"
         aria-label="عنوانان مختلفان وسهمان إلى خريطةٍ واحدة في الذاكرة">
      <g className="hf-box">
        <rect x="18" y="18" width="190" height="34" />
        <rect x="312" y="18" width="190" height="34" />
      </g>
      <text className="hf-var" x="30" y="40" textAnchor="start">a</text>
      <text className="hf-var" x="324" y="40" textAnchor="start">b</text>
      <text className="hf-addr" x="196" y="40" textAnchor="end">{a}</text>
      <text className="hf-addr" x="490" y="40" textAnchor="end">{b}</text>

      <g className="hf-arrow">
        <path d="M113 52 L113 96 L260 96 L260 126" />
        <path d="M407 52 L407 96 L260 96 L260 126" />
        <path d="M254 118 L260 130 L266 118 Z" />
      </g>

      <g className="hf-cell">
        <rect x="170" y="130" width="180" height="42" />
        <line x1="215" y1="130" x2="215" y2="172" />
        <line x1="260" y1="130" x2="260" y2="172" />
        <line x1="305" y1="130" x2="305" y2="172" />
      </g>
      <text className="hf-cap" x="360" y="157" textAnchor="start">MAP_SHARED</text>
    </svg>
  );
}
