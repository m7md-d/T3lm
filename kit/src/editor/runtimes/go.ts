import type { Runtime, RunResult } from './types';

/**
 * Go لا يوجد له مسار تنفيذ أمين داخل المتصفّح:
 * المفسّرات المتاحة متأخّرة عن الإصدار أو بلا `unsafe` و`cgo` — أي أنها تعجز
 * بالضبط عن محاور منهج اللغة، وستُظهر سلوكاً قديماً فيتعلّم القارئ عكس النصّ.
 *
 * لذلك: المترجم الحقيقي عبر وسيط أمام `go.dev/_/compile`. بلا وسيط مضبوط،
 * يُصرَّح بعدم التوفّر ولا يُحاكى شيء.
 */
export function createGoRuntime(endpoint?: string): Runtime {
  return {
    id: 'go-playground',
    label: 'Go',
    lang: 'go',
    fidelity: 'يُنفَّذ على مترجم Go Playground — إصداره قد يخالف إصدارك، والساعة وهمية وبلا شبكة.',
    async run(code, { timeoutMs = 15000 } = {}): Promise<RunResult> {
      const t0 = performance.now();
      if (!endpoint) {
        return {
          status: 'unavailable', stdout: '', stderr: '', ms: 0,
          note: 'لا يوجد وسيط تنفيذ مضبوط. انسخ الكود وافتح Go Playground، أو شغّله محلياً.',
        };
      }
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), timeoutMs);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ version: '2', body: code, withVet: 'true' }),
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`الوسيط رجّع ${res.status}`);
        const j = await res.json();
        const ms = performance.now() - t0;
        if (j.Errors) return { status: 'error', stdout: '', stderr: j.Errors, ms };
        const stdout = (j.Events ?? []).filter((e: any) => e.Kind === 'stdout').map((e: any) => e.Message).join('');
        const stderr = (j.Events ?? []).filter((e: any) => e.Kind === 'stderr').map((e: any) => e.Message).join('');
        return { status: stderr ? 'error' : 'ok', stdout, stderr, ms };
      } catch (e: any) {
        const ms = performance.now() - t0;
        if (e?.name === 'AbortError') return { status: 'timeout', stdout: '', stderr: `تجاوز ${timeoutMs}ms`, ms };
        return { status: 'error', stdout: '', stderr: String(e?.message ?? e), ms };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
