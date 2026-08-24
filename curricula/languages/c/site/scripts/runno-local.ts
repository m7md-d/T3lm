import type { Plugin } from 'vite';

/**
 * يجعل سلسلة clang تُجلَب **من أصلنا** لا من `runno.dev`.
 *
 * ولماذا رقعةٌ عند البناء لا اعتراضٌ وقت التشغيل: `@runno/runtime` يمرّر عنوان
 * الملفّ إلى **Web Worker** ويجلبه هناك — `v.start(fetch(e), …)` — فرقعةُ
 * `window.fetch` في الخيط الرئيسيّ لا تبلغه. جرّبناها فسقطت، وكشفه
 * `OFFLINE=1 npm run runno`.
 *
 * ورقعتان لا واحدة:
 *
 * ١. **قاعدة العناوين** على الخيط الرئيسيّ تصير أصلَنا، محسوبةً من
 *    `document.baseURI` — فتعمل في الجذر وفي مجلّدٍ فرعيّ سواء، كما `base: './'`.
 * ٢. **الجلب داخل العامل** يطلب النسخة المضغوطة ويفكّها بـ`DecompressionStream`.
 *    وهو ما يبقي الملفّ الواحد تحت حدّ الاستضافة: `clang.wasm` ثلاثون ميغابايت
 *    خاماً وعشرةٌ مضغوطاً، والحدّ خمسةٌ وعشرون.
 *
 * والمرساة الثلاث فريدةٌ في الحزمة (`grep -c` = ١ لكلٍّ). وإن أخفقت واحدة
 * **يسقط البناء**: أسوأُ ما يمكن أن يحدث أن يعود الموقع إلى الشبكة صامتاً.
 */
export function runnoLocal(): Plugin {
  const RUNTIME = /@runno[\\/]runtime/;

  /* يُحقَن في **صدر نصّ العامل**، فيسكن نطاقه. بلا علامة اقتباسٍ مفردة ولا
     شرطة مائلة عكسية: النصُّ نفسه محاطٌ بمفردتين في الحزمة. */
  const SHIM =
    'async function __t3lmWasm(u){' +
    /* الخطوةُ الأخيرة تمرّر برنامج القارئ المترجَم بـ`blob:` — يمرّ كما هو.
       والمضغوطُ سلسلةُ الأدوات وحدها. */
    'if(String(u).slice(0,5)==="blob:")return fetch(u);' +
    'var r=await fetch(u+".gz");' +
    'if(!r.ok||!r.body)throw new Error("wasm: "+u+".gz "+r.status);' +
    'return new Response(r.body.pipeThrough(new DecompressionStream("gzip")),' +
    '{headers:{"Content-Type":"application/wasm"}})};';

  return {
    name: 't3lm:runno-local',
    enforce: 'pre',
    transform(code, id) {
      if (!RUNTIME.test(id)) return null;
      let hits = 0;
      const cut = (from: string, to: string) => {
        if (!code.includes(from)) return;
        code = code.replace(from, to);
        hits++;
      };

      cut(
        '"https://runno.dev/langs"',
        '(typeof document!=="undefined"?new URL("./wasm",document.baseURI).href:"https://runno.dev/langs")',
      );
      cut("const dd = 'var Tt=", `const dd = '${SHIM}var Tt=`);
      cut('v.start(fetch(e),', 'v.start(__t3lmWasm(e),');

      if (hits !== 3)
        this.error(
          `الاستضافة الذاتية لسلسلة clang: ${hits}/3 مرساة. ` +
            'تغيّرت بنية @runno/runtime — راجع site/README.md §٥ قبل النشر.',
        );
      return { code, map: null };
    },
  };
}
