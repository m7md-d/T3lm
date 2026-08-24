import type { Runtime, RunResult } from './types';

/**
 * تنفيذ Go **على جهاز المستخدم**: مفسّر Go مُصرَّف إلى WASM يعمل داخل عامل.
 * بلا خادم، وبلا وسيط، وبلا مغادرة الصفحة.
 *
 * ما يعمل: الدلالة العامّة، الشرائح والسلاسل والخرائط، `unsafe.Sizeof`
 * و`Alignof` و`Offsetof`، الـgoroutines والقنوات، وأخطاء الترجمة برسائلها.
 * ما لا يعمل: `cgo`، وملفات التجميع، وتوجيهات المترجم — فتلك تبقى موسومة
 * «يُشغَّل محلياً».
 */
export function createWasmGoRuntime(workerUrl: string, opts?: { fidelity?: string }): Runtime {
  let worker: Worker | null = null;
  let seq = 0;

  const spawn = () => {
    worker?.terminate();
    worker = new Worker(workerUrl);
    return worker;
  };

  return {
    id: 'go-wasm',
    label: 'Go',
    lang: 'go',
    fidelity: opts?.fidelity,
    async run(code, { timeoutMs = 20000 } = {}): Promise<RunResult> {
      const w = worker ?? spawn();
      const id = ++seq;
      const t0 = performance.now();

      return new Promise<RunResult>((resolve) => {
        const done = (r: RunResult) => {
          w.removeEventListener('message', onMsg);
          clearTimeout(timer);
          resolve(r);
        };
        const timer = setTimeout(() => {
          /* الحلقة اللانهائية تُنهى بقتل العامل — الخيط الرئيسي لا يتجمّد */
          spawn();
          done({ status: 'timeout', stdout: '', stderr: `تجاوز ${timeoutMs}ms — حلقة لا تنتهي؟`, ms: performance.now() - t0 });
        }, timeoutMs);

        const onMsg = (e: MessageEvent) => {
          if (e.data?.id !== id) return;
          const { stdout = '', stderr = '', ms } = e.data;
          done({ status: stderr ? 'error' : 'ok', stdout, stderr, ms: ms ?? performance.now() - t0 });
        };

        w.addEventListener('message', onMsg);
        w.addEventListener('error', (ev) => done({
          status: 'error', stdout: '', stderr: ev.message, ms: performance.now() - t0,
        }), { once: true });
        w.postMessage({ id, code });
      });
    },
  };
}
