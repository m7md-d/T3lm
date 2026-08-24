#!/usr/bin/env node
/**
 * يفتح صفحةً من مجلّد بناءٍ في متصفّحٍ حقيقيّ، **وينتظرها حتى تُنهي عملها**،
 * ثم يطبع نصّ `#OUT` منها.
 *
 *   node tools/dump.mjs <dist-dir> <page> [timeoutMs]
 *
 * والانتظارُ بالبروتوكول لا بميزانية وقتٍ افتراضيّ: `--virtual-time-budget`
 * يقفز فوق المؤقّتات ولا ينتظر المعالج، وترجمةُ WebAssembly عملُ معالج. فتُقاد
 * الصفحة عبر CDP، ويُسأل `#OUT` عن `data-done` حتى يصير `1`.
 *
 * ويُخدَم بعزل الأصول (COOP/COEP) لأن `SharedArrayBuffer` شرطٌ لتشغيل WASI.
 */
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const [dist, page, timeout = '900000'] = process.argv.slice(2);
if (!dist || !page) {
  console.error('الاستعمال: node tools/dump.mjs <dist-dir> <page> [timeoutMs]');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.wasm': 'application/wasm', '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  try {
    const body = await readFile(join(dist, normalize(path === '/' ? '/index.html' : path)));
    res.writeHead(200, {
      'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-origin',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('404');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/${page}`;

const bin = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
].find((p) => existsSync(p));
if (!bin) { console.error('لا Chrome على هذا الجهاز'); process.exit(1); }

const profile = await mkdtemp(join(tmpdir(), 't3lm-dump-'));
const chrome = spawn(bin, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  /* `OFFLINE=1` يقطع الشبكة عن المتصفّح: كلُّ ما تحتاجه الصفحة يُخدَم من
     `dist`. وأيُّ اعتمادٍ على أصلٍ خارجيّ يسقط هنا بدل أن يسقط عند قارئٍ بلا
     اتصال. **وهو الفحص الذي كشف أن سلسلة clang تُجلَب من runno.dev.** */
  ...(process.env.OFFLINE ? ['--host-resolver-rules=MAP * 127.0.0.1:1, EXCLUDE 127.0.0.1'] : []),
  `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

const done = (code) => {
  chrome.kill('SIGTERM');
  server.close();
  void rm(profile, { recursive: true, force: true });
  process.exit(code);
};

/** عنوان المنفذ يظهر في stderr عند الإقلاع */
const wsUrl = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('لم يُعلن المتصفّح منفذه')), 30000);
  let buf = '';
  chrome.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/ws:\/\/[^\s]+/);
    if (m) { clearTimeout(t); resolve(m[0]); }
  });
});

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let seq = 0;
const waiting = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  const put = waiting.get(msg.id);
  if (put) { waiting.delete(msg.id); put(msg); }
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => {
    const id = ++seq;
    waiting.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { result: target } = await send('Target.createTarget', { url: 'about:blank' });
const { result: att } = await send('Target.attachToTarget', {
  targetId: target.targetId, flatten: true,
});
const sid = att.sessionId;

await send('Page.enable', {}, sid);
await send('Runtime.enable', {}, sid);
await send('Page.navigate', { url }, sid);

const read = async (expr) => {
  const r = await send('Runtime.evaluate', {
    expression: expr, returnByValue: true, awaitPromise: false,
  }, sid);
  return r.result?.result?.value;
};

const deadline = Date.now() + Number(timeout);
let text = null;
while (Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 1500));
  const state = await read("(document.querySelector('#OUT')||{}).dataset?.done ?? ''");
  if (state === '1') { text = await read("document.querySelector('#OUT').textContent"); break; }
}

if (text === null) {
  const partial = await read("(document.querySelector('#OUT')||{}).textContent ?? ''");
  console.error('✗ لم تُنهِ الصفحة عملها في المهلة. آخر ما بلغته:');
  console.error(partial || '(لا شيء)');
  done(1);
}

console.log(text);
done(/(\d+) مخالفة/.test(text) && !/ 0 مخالفة/.test(text) ? 1 : 0);
