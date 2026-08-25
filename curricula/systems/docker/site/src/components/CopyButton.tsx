/**
 * النسخ هو الفعل الوحيد الذي يعده هذا الموقع ويقدر عليه: لا زرّ تشغيل هنا،
 * لأن نداءات نواة لينكس لا تُنفَّذ في متصفّح. والقارئ يشغّله عنده في مختبرٍ
 * مثبَّتٍ ببصمته، فتطابق لوحتُه اللوحةَ المعروضة.
 */
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ text, label = 'انسخ' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch { return; }
    setDone(true);
    window.setTimeout(() => setDone(false), 1400);
  };

  return (
    <button type="button" className="copybtn" onClick={copy} aria-label={label}>
      {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span>{done ? 'نُسخ' : label}</span>
    </button>
  );
}
