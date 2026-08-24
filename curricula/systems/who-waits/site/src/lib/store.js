/**
 * تقدّمٌ محليٌّ بالكامل — لا حساب، لا خادم، لا تتبّع.
 *
 * ما يُحفظ ثلاثة أشياء فقط، وكلٌّ منها ينفّذ تعليمةً كتبها المنهج لقارئه:
 *   ١) `tried`  — «لا تكمل قبل أن تكتب الجواب» ⇒ اللغز يفتح الدرس.
 *   ٢) `seen`   — محطّاتٌ زُرِعت، لتعرف أين وقفت (لا نقاطٌ ولا شارات).
 *   ٣) `spoil`  — «لا تفتح شجرة المهارات قبل الإقليم ٠٩».
 */
const KEY = 'who-waits/v1';
const EMPTY = { tried: {}, seen: {}, spoil: false };

const can = () => typeof window !== 'undefined' && !!window.localStorage;

export function load() {
  if (!can()) return EMPTY;
  try {
    return { ...EMPTY, ...(JSON.parse(window.localStorage.getItem(KEY)) || {}) };
  } catch {
    return EMPTY;
  }
}

export function save(state) {
  if (!can()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* حصّة ممتلئة — التقدّم رفاهيّة، لا نُسقط الصفحة لأجلها */
  }
}

export function markTried(slug) {
  const s = load();
  s.tried[slug] = true;
  save(s);
  return s;
}

export function markSeen(slug, station) {
  const s = load();
  s.seen[slug] = { ...(s.seen[slug] || {}), [station]: true };
  save(s);
  return s;
}

export function allowSpoiler() {
  const s = load();
  s.spoil = true;
  save(s);
  return s;
}

export function reset() {
  if (can()) window.localStorage.removeItem(KEY);
  return EMPTY;
}

/** نسبة المحطّات المزارة في إقليم — للمؤشّر لا للتحفيز */
export function regionProgress(state, slug, total) {
  const seen = Object.keys(state.seen?.[slug] || {}).length;
  return total ? Math.min(1, seen / total) : 0;
}
