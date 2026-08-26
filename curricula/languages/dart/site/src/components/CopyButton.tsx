import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copybtn"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1400);
        }).catch(() => {});
      }}
    >
      {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span>{done ? 'نُسِخ' : label ?? 'انسخ'}</span>
    </button>
  );
}
