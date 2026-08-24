/* عامل يشغّل مفسّر Go داخل WASM — على جهاز المستخدم، بلا خادم وبلا شبكة.
   في عامل لا في الخيط الرئيسي: حلقة لا تنتهي في كود المتعلّم تُنهى بـterminate
   بدل أن تجمّد الصفحة. */
let ready = null;

function boot() {
  if (ready) return ready;
  ready = (async () => {
    importScripts('./wasm_exec.js');
    const go = new Go();
    const src = await WebAssembly.instantiateStreaming(fetch('./go-runner.wasm'), go.importObject);
    go.run(src.instance);
    for (let i = 0; i < 200 && typeof __goRun !== 'function'; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    if (typeof __goRun !== 'function') throw new Error('لم يُسجَّل المفسّر');
  })();
  return ready;
}

self.onmessage = async (e) => {
  const { id, code } = e.data;
  try {
    await boot();
    const t0 = performance.now();
    const r = __goRun(code);
    self.postMessage({ id, ...r, ms: performance.now() - t0 });
  } catch (err) {
    self.postMessage({ id, stdout: '', stderr: String(err && err.message ? err.message : err), ms: 0 });
  }
};
