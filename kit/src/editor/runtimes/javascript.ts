import type { Runtime, RunResult } from './types';

/**
 * تنفيذ حقيقي في المتصفّح داخل Web Worker معزول.
 * الـWorker يُبنى من Blob — لا ملف خارجي، ويعمل بعد الرفع على أي استضافة.
 */
const BOOT = `
self.onmessage = async (e) => {
  const out = [], err = [];
  const ser = (a) => a.map(x => {
    try { return typeof x === 'string' ? x : JSON.stringify(x, null, 2) ?? String(x); }
    catch { return String(x); }
  }).join(' ');
  self.console = {
    log:   (...a) => out.push(ser(a)),
    info:  (...a) => out.push(ser(a)),
    warn:  (...a) => err.push(ser(a)),
    error: (...a) => err.push(ser(a)),
    debug: (...a) => out.push(ser(a)),
  };
  try {
    const fn = new Function('return (async () => {' + e.data.code + '})()');
    const v = await fn();
    if (v !== undefined) out.push(ser([v]));
    self.postMessage({ status: 'ok', stdout: out.join('\\n'), stderr: err.join('\\n') });
  } catch (ex) {
    err.push(ex && ex.stack ? ex.stack : String(ex));
    self.postMessage({ status: 'error', stdout: out.join('\\n'), stderr: err.join('\\n') });
  }
};`;

export const javascriptRuntime: Runtime = {
  id: 'js-worker',
  label: 'JavaScript',
  lang: 'javascript',
  async run(code, { timeoutMs = 5000 } = {}): Promise<RunResult> {
    const t0 = performance.now();
    const url = URL.createObjectURL(new Blob([BOOT], { type: 'text/javascript' }));
    const w = new Worker(url);
    try {
      return await new Promise<RunResult>((resolve) => {
        const timer = setTimeout(() => {
          w.terminate();
          resolve({ status: 'timeout', stdout: '', stderr: `تجاوز ${timeoutMs}ms — حلقة لا تنتهي؟`, ms: performance.now() - t0 });
        }, timeoutMs);
        w.onmessage = (e) => {
          clearTimeout(timer);
          resolve({ ...e.data, ms: performance.now() - t0 });
        };
        w.onerror = (e) => {
          clearTimeout(timer);
          resolve({ status: 'error', stdout: '', stderr: e.message, ms: performance.now() - t0 });
        };
        w.postMessage({ code });
      });
    } finally {
      w.terminate();
      URL.revokeObjectURL(url);
    }
  },
};
