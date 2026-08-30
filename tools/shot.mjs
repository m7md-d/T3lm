#!/usr/bin/env node
/**
 * يصوّر ملفّ HTML أو SVG محلياً إلى PNG بمقاسٍ مضبوط — عبر Chrome بلا واجهة.
 *
 *   node tools/shot.mjs <in.html> <out.png> <w> <h>
 *
 * ويُستورَد أيضاً: `import { shot, session } from '../../tools/shot.mjs'`.
 *
 * **ولا يُستعمل `--window-size` ولا `--screenshot`.** النظام يفرض حدّاً أدنى
 * لحجم النافذة (٥٠٠×٢٨٨ على macOS)، فما دونه يُخطَّط عند الحدّ ثم يُقتطع من
 * الزاوية العليا: تخرج الأيقونة **مكبَّرةً على ركنٍ منها**. والمقاس المطلوب
 * يُفرَض على منفذ العرض نفسه بـ`Emulation.setDeviceMetricsOverride`، وهو مستقلّ
 * عن النافذة، فيصحّ ١٨٠ كما يصحّ ١٢٠٠.
 *
 * يُشغَّل عند توليد الأصول وعند فحص المظهر. **البناء نفسه لا يحتاجه**:
 * ناتجه ملفّاتٌ مُلتزَمة في `public/`.
 */
import { spawn } from 'node:child_process';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const chrome = () =>
  [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find((p) => existsSync(p));

/**
 * يفتح متصفّحاً واحداً لعدّة لقطات. `close()` عند الفراغ.
 * والفتح مرّةً واحدة: إطلاق Chrome أغلى من اللقطة نفسها.
 */
export async function session() {
  const bin = chrome();
  if (!bin) throw new Error('لا Chrome على هذا الجهاز');

  const profile = await mkdtemp(join(tmpdir(), 't3lm-shot-'));
  const proc = spawn(bin, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', '--force-device-scale-factor=1',
    `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const wsUrl = await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('لم يُعلن المتصفّح منفذه')), 30000);
    let buf = '';
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/ws:\/\/[^\s]+/);
      if (m) { clearTimeout(t); res(m[0]); }
    });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  let seq = 0;
  const waiting = new Map();
  const listeners = new Set();
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id === undefined) return void listeners.forEach((f) => f(msg));
    waiting.get(msg.id)?.(msg);
    waiting.delete(msg.id);
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((r) => {
      const id = ++seq;
      waiting.set(id, r);
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  const once = (method, sid, ms) =>
    new Promise((r) => {
      const t = setTimeout(finish, ms);
      function finish() { clearTimeout(t); listeners.delete(f); r(); }
      const f = (m) => { if (m.method === method && m.sessionId === sid) finish(); };
      listeners.add(f);
    });

  /** يلتقط `src` إلى `out` بمقاس `w×h`. يعيد حجم الملفّ بالبايت. */
  async function shot(src, out, w, h, { wait = 250, opaque = false } = {}) {
    const { result: target } = await send('Target.createTarget', { url: 'about:blank' });
    const { result: att } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const sid = att.sessionId;

    await send('Page.enable', {}, sid);
    await send('Emulation.setDeviceMetricsOverride',
      { width: w, height: h, deviceScaleFactor: 1, mobile: false }, sid);
    if (!opaque) {
      await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }, sid);
    }

    const loaded = once('Page.loadEventFired', sid, 20000);
    await send('Page.navigate', { url: /^https?:/.test(src) ? src : `file://${resolve(src)}` }, sid);
    await loaded;
    /* الخطّ المستضاف يصل بعد الحدث، والرمز المرسوم به يخرج بخطٍّ احتياطيّ بلا ذلك */
    await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true }, sid);
    await new Promise((r) => setTimeout(r, wait));

    const { result: cap } = await send('Page.captureScreenshot',
      { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } }, sid);
    if (!cap?.data) throw new Error('لم تُلتقَط ' + out);
    await writeFile(out, Buffer.from(cap.data, 'base64'));
    await send('Target.closeTarget', { targetId: target.targetId });
    return statSync(out).size;
  }

  async function close() {
    proc.kill('SIGTERM');
    /* المتصفّح يكتب في ملفّه الشخصيّ وهو يموت: يُمهَل لحظةً ثم يُحذَف بلا شكوى */
    await new Promise((r) => setTimeout(r, 300));
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }

  return { shot, close };
}

/** لقطةٌ واحدة بمتصفّحٍ يُفتَح ويُغلَق. للقطات المتعدّدة استعمل `session()`. */
export async function shot(src, out, w, h, opts) {
  const s = await session();
  try { return await s.shot(src, out, w, h, opts); } finally { await s.close(); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [src, out, w, h] = process.argv.slice(2);
  if (!src || !out || !w || !h) {
    console.error('الاستعمال: node tools/shot.mjs <in.html> <out.png> <w> <h>');
    process.exit(1);
  }
  const size = await shot(src, out, Number(w), Number(h));
  console.log(`  ${out}  ${w}×${h}  ${(size / 1024).toFixed(1)}ك`);
}
