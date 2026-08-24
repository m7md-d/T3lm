import { useCallback, useEffect, useRef, useState } from 'react';

const NS = 'ck:draft:';

/** بصمة قصيرة ومستقرّة للنصّ الأصل (FNV-1a) — تربط المسودّة بما اشتُقّت منه */
function fingerprint(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

interface Stored { h: string; t: string }

function read(storageKey: string, initial: string): string | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const s = JSON.parse(raw) as Stored;
    /* المسودّة مربوطة بنصّها الأصل. تغيّر الأصل ⇒ هذه مسودّة كودٍ آخر:
       تُهمَل وتُمحى، ولا تُعرَض على أنها كود هذا البلوك. */
    if (typeof s?.t !== 'string' || s.h !== fingerprint(initial)) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return s.t;
  } catch {
    return null;
  }
}

/**
 * مسودّة مستقلّة لكل محرّر، محفوظة في ذاكرة المتصفّح تحت مفتاحه وحده.
 *
 * سبب وجودها: مكوّنات React تُعاد استعمالها حين تتطابق مواضعها في الشجرة، فلو
 * لم يكن لكل محرّر **هويّة مستقرّة** لانتقل كودُ محرّرٍ إلى آخر عند تغيّر
 * الصفحة. الهويّة هنا هي المفتاح، والحفظ يتبعها.
 *
 * والمفتاح وحده لا يكفي: لو تغيّر نصّ البلوك أو أُعيد ترقيمه، لأحيَت مسودّةٌ
 * قديمة كوداً لم يعد لهذا الموضع — يراه القارئ ولا يعرف من أين جاء. لذلك تُختَم
 * كل مسودّة ببصمة نصّها الأصل، وتُهمَل عند اختلافها. و`dirty` يُعلن للقارئ أن
 * ما أمامه مسودّته لا كود المؤلّف.
 */
export function useDraft(key: string | undefined, initial: string) {
  const storageKey = key ? NS + key : null;
  const [value, setValue] = useState(() => (storageKey ? read(storageKey, initial) ?? initial : initial));
  const [dirty, setDirty] = useState(() => (storageKey ? read(storageKey, initial) !== null : false));

  /* تغيّر المفتاح أو الأصل يعني محرّراً آخر تماماً — تُقرأ مسودّته هو */
  const last = useRef(`${storageKey} ${initial}`);
  useEffect(() => {
    const id = `${storageKey} ${initial}`;
    if (last.current === id) return;
    last.current = id;
    const found = storageKey ? read(storageKey, initial) : null;
    setValue(found ?? initial);
    setDirty(found !== null);
  }, [storageKey, initial]);

  const save = useCallback((next: string) => {
    setDirty(next !== initial);
    if (!storageKey) return;
    try {
      if (next === initial) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify({ h: fingerprint(initial), t: next } satisfies Stored));
    } catch { /* وضع خاص أو مساحة ممتلئة */ }
  }, [storageKey, initial]);

  const reset = useCallback(() => {
    if (storageKey) { try { localStorage.removeItem(storageKey); } catch { /* */ } }
    setValue(initial);
    setDirty(false);
  }, [storageKey, initial]);

  /* `rev` تدخل في مفتاح React: تغيّر الأصل يُعيد بناء المحرّر بدل إبقاء نصٍّ ميّت */
  return { value, save, reset, dirty, storageKey, rev: fingerprint(initial) };
}
