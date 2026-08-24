import type { Runtime, RunResult } from './types';

/**
 * لغات WASI (بايثون، C، روبي، SQLite…) عبر `@runno/wasi` — **اعتمادية اختيارية**
 * يثبّتها المنهج الذي يحتاجها، فلا تثقل العدّة على من لا يحتاجها.
 *
 * تنبيه نشر: تشغيلها يتطلّب عزل الأصول (COOP/COEP). قرّر ذلك قبل اختيار
 * الاستضافة لا بعدها.
 */
export function createWasiRuntime(binary: string, label: string, lang: any): Runtime {
  return {
    id: `wasi-${binary}`,
    label,
    lang,
    fidelity: 'بيئة WASI معزولة: نظام ملفات وهمي، بلا شبكة، والمدخلات عبر stdin فقط.',
    async run(code, { stdin = '', timeoutMs = 15000 } = {}): Promise<RunResult> {
      const t0 = performance.now();
      let mod: any;
      try {
        /* المُحدِّد في متغيّر عمداً: الحزمة اختيارية، فلا يجوز أن يفشل بناء
           منهج لا يستعملها لمجرّد أنها غير مثبّتة. */
        const spec = '@runno/wasi';
        mod = await import(/* @vite-ignore */ spec);
      } catch {
        return {
          status: 'unavailable', stdout: '', stderr: '', ms: 0,
          note: 'الحزمة @runno/wasi غير مثبّتة في هذا المنهج. أضِفها إن احتجت تنفيذاً في المتصفّح.',
        };
      }
      try {
        const res = await Promise.race([
          mod.WASI.start(fetch(`/wasm/${binary}.wasm`), { args: [binary, 'main'], stdin }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
        ]) as any;
        const ms = performance.now() - t0;
        return { status: res.exitCode === 0 ? 'ok' : 'error', stdout: res.stdout ?? '', stderr: res.stderr ?? '', ms };
      } catch (e: any) {
        const ms = performance.now() - t0;
        const to = e?.message === 'timeout';
        return { status: to ? 'timeout' : 'error', stdout: '', stderr: to ? `تجاوز ${timeoutMs}ms` : String(e?.message ?? e), ms };
      }
    },
  };
}
