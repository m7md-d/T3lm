/**
 * العلامة — **شكلُ مخرَج الـepitome نفسِه**: مستطيلان وخطٌّ بينهما، وهي الوسوم
 * الثلاثة التي يكتبها `programs/epitome.py` (`rect` · `line` · `rect`).
 * ولا شعارَ لهذا الموضوع يُستورَد، ولا شيءَ يُرسَم من خارج المنهج.
 *
 * والحبر متناظرٌ حول مركز الصندوق، فتقيسه `tools/icons.mjs` مركزيّاً.
 */
export function Mark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={(size * 48) / 20}
      height={size}
      viewBox="0 0 48 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      focusable="false"
    >
      <rect x="0.75" y="3.75" width="16.5" height="12.5" />
      <line x1="18" y1="10" x2="30" y2="10" />
      <rect x="30.75" y="3.75" width="16.5" height="12.5" />
    </svg>
  );
}
