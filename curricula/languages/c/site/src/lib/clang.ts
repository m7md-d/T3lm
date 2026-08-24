import type { Runtime, RunResult } from '@t3lm/kit/editor';

/**
 * ترجمةُ C وتشغيلُها **في متصفّح القارئ** — clang مبنيّاً إلى WebAssembly،
 * عبر `@runno/runtime`. بلا خادم، ولا يغادر الكود الجهاز.
 *
 * **وحدُّه معلَنٌ قبل أن يُضغَط الزرّ**، لأن الزرّ ادّعاء:
 *
 *   • الهدف **wasm32**: `long` أربعةُ بايتات لا ثمانية، والـpointer أربعة.
 *     ولهذا لا يظهر الزرّ إلا على اللوحات التي **تعدها المواصفة** — وهي وحدها
 *     التي يجب أن تعطي الجواب نفسه على أي مترجمٍ مطابق (انظر `markRunnable`).
 *   • لا كاشفات: `-fsanitize` غير موجودةٍ في هذه السلسلة.
 *   • أوّل تشغيلٍ ينزّل سلسلة الأدوات — ٤٨ ميغابايت من أصل الموقع نفسه —
 *     ثم تُخزَّن، فيعمل ما بعده بلا شبكة.
 */
const FIDELITY =
  'يُترجَم ويُشغَّل في متصفّحك، والهدف wasm32 لا جهازك. وأوّل تشغيلٍ ينزّل ' +
  'سلسلة الأدوات — نحو ٥٠ ميغابايت — ثم تبقى مخزَّنة.';

/**
 * السلسلة تسكن أصلَنا (`public/wasm/`) ولا تُجلَب من `runno.dev`.
 *
 * **والتحويل يقع عند البناء** لا هنا: `@runno/runtime` يمرّر العنوان إلى Web
 * Worker ويجلبه هناك، فرقعةُ `fetch` في هذا الخيط لا تبلغه. الرقعة في
 * `scripts/runno-local.ts`، وتفصيلُها في `site/README.md` §٥.
 *
 * والعزلُ (COOP/COEP) شرطٌ لازم للتشغيل — `SharedArrayBuffer`.
 * ويفحص `OFFLINE=1 npm run runno` الاستضافةَ الذاتية بقطع الشبكة عن المتصفّح.
 */
let ready: Promise<typeof import('@runno/runtime')> | null = null;
const load = () => (ready ??= import('@runno/runtime'));

/** يُستدعى مبكّراً ليبدأ التنزيل قبل أن يضغط القارئ */
export function warmClang(): void { void load(); }

export const clangRuntime: Runtime = {
  id: 'runno-clang',
  label: 'clang · wasm32',
  lang: 'c',
  fidelity: FIDELITY,
  async run(code, { stdin = '', timeoutMs = 60000 } = {}): Promise<RunResult> {
    const t0 = performance.now();
    try {
      const { headlessRunCode } = await load();
      const res = await Promise.race([
        headlessRunCode('clang', code, stdin),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
      ]);
      const ms = performance.now() - t0;
      if (res.resultType === 'complete') {
        return {
          status: res.exitCode === 0 ? 'ok' : 'error',
          stdout: res.stdout ?? '', stderr: res.stderr ?? '', ms,
        };
      }
      /* `crash` يحمل رسالةً، و`terminated` يعني أن القارئ أوقفه */
      return {
        status: 'error', stdout: '', ms,
        stderr: res.resultType === 'crash' ? String(res.error?.message ?? res.error) : 'أُوقِف',
      };
    } catch (e) {
      const ms = performance.now() - t0;
      const to = (e as Error)?.message === 'timeout';
      return {
        status: to ? 'timeout' : 'error', stdout: '', ms,
        stderr: to ? `تجاوز ${timeoutMs}ms` : String((e as Error)?.message ?? e),
      };
    }
  },
};
