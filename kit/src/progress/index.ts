/**
 * التقدّم **مقلوب**: لا يُعرَض ما أمام القارئ بل ما خلفه.
 *
 * الشريط المعتاد يعدّ تنازلياً نحو نهايةٍ لم تُبلَغ، فيعرض الكلفة كاملةً قبل
 * البدء — ويُستثقَل كما يُستثقَل فيلمٌ بساعتين. فلا أعداد إجمالية هنا ولا نسب:
 * يُحفَظ **الأثر** — أي لقطةٍ عُبِرت وأي توقّعٍ ثُبِّت — ويُعرَض متراكماً.
 *
 * ولا نقاط ولا شارات ولا سلاسل ولا عدّاد أيام (`profiles/default.md` §١١).
 *
 * **ميكانيزم بلا مظهر**: يخزّن ويقرأ، ولا يقرّر كيف يُعرَض الأثر.
 */
interface State {
  /** توقّعات البوّابات — مادّة «فرق الإتقان» */
  predictions: Record<string, string>;
  /** اللقطات المعبورة: `إقليم:لقطة` */
  seen: string[];
  lastRegion: string | null;
  lastShot: Record<string, number>;
}

const empty: State = { predictions: {}, seen: [], lastRegion: null, lastShot: {} };

/**
 * يبني مخزناً بمفتاحٍ خاصّ بالمنهج.
 *
 * والمفتاح وسيطٌ لأن التخزين محلّيّ في المتصفّح، ومناهجُ نطاقٍ واحد تتشاركه.
 */
export function makeStore(key: string) {
  const read = (): State => {
    try {
      return { ...empty, ...(JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<State>) };
    } catch {
      return { ...empty };
    }
  };
  const write = (s: State) => {
    try { localStorage.setItem(key, JSON.stringify(s)); } catch { /* وضع خاص */ }
  };

  return {
    prediction: (id: string): string | undefined => read().predictions[id],
    setPrediction(id: string, text: string) {
      const s = read();
      s.predictions[id] = text;
      write(s);
    },

    /** يُسجَّل عبور اللقطة — لا يُعرَض عدداً بل أثراً */
    see(region: string, shot: number) {
      const s = read();
      const id = `${region}:${shot}`;
      if (!s.seen.includes(id)) s.seen.push(id);
      s.lastRegion = region;
      s.lastShot[region] = shot;
      write(s);
    },
    seen: (region: string, shot: number) => read().seen.includes(`${region}:${shot}`),
    seenIn: (region: string) => read().seen.filter((x) => x.startsWith(`${region}:`)).length,

    /**
     * أبعد لقطةٍ بلغها القارئ في هذا الإقليم.
     *
     * `lastShot` موضعُ الوقوف ويتراجع حين يعود القارئ للخلف، **وهذا** لا يتراجع:
     * ما عُبر مرّةً يبقى مفتوحاً في الأثر، فلا يُضطرّ إلى إعادة المرور تسلسلياً
     * ليصل إلى نقطةٍ يعرفها.
     */
    furthest(region: string): number {
      const pre = `${region}:`;
      return read().seen
        .filter((x) => x.startsWith(pre))
        .reduce((m, x) => Math.max(m, Number(x.slice(pre.length)) || 0), 0);
    },

    lastRegion: () => read().lastRegion,
    lastShot: (region: string) => read().lastShot[region] ?? 0,
    countPredictions: () => Object.keys(read().predictions).length,
  };
}

export type Store = ReturnType<typeof makeStore>;
