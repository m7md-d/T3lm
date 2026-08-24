import type { Lang } from '../CodeEditor';

export type RunStatus = 'ok' | 'error' | 'timeout' | 'unavailable';

export interface RunResult {
  status: RunStatus;
  stdout: string;
  stderr: string;
  ms: number;
  /** سبب عدم التوفّر، أو تحذير صدق (مثل: الإصدار هناك ليس إصدارك) */
  note?: string;
}

export interface Runtime {
  id: string;
  label: string;
  lang: Lang;
  /** تحذير يُعرض دائماً في الواجهة — للصدق عن حدود المحرّك */
  fidelity?: string;
  run(code: string, opts?: { stdin?: string; timeoutMs?: number }): Promise<RunResult>;
}
