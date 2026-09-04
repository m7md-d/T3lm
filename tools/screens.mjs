#!/usr/bin/env node
/**
 * يفتح `dist/` في متصفّحٍ حقيقيّ، **وينتظر الصفحة حتى تُركِّب نفسها**، ثم
 * يلتقطها ويطبع ما اشتكى منه المتصفّح.
 *
 *   node tools/screens.mjs <site-dir> <out-dir> [route ...]
 *   W=420 node tools/screens.mjs …        # عرضٌ ضيّق
 *   FULL=0 node tools/screens.mjs …       # أعلى الصفحة فقط
 *
 * `ssr-check` يصيّر المكوّنات خارج المتصفّح فيمسك أخطاء التصيير — **ولا يرى
 * مظهراً**: لا خطّاً ولا لوناً ولا تخطيطاً ولا شيئاً يعتمد على CSS. وهذا يراه.
 *
 * والقيادةُ بالبروتوكول لا بـ`--virtual-time-budget`: تلك ميزانيةُ وقتٍ
 * افتراضيّ تقفز فوق المؤقّتات ولا تنتظر المعالج، فتلتقط صفحةً بيضاء قبل أن
 * يركّبها React. **ولا تحترم عرضاً دون ٧٠٠ بكسل** — تُخرِج ملفّاً بالعرض
 * المطلوب وتُخطِّط بغيره. و`Emulation.setDeviceMetricsOverride` يحترمه.
 */
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { chrome } from './shot.mjs';

const [site, outDir, ...routes] = process.argv.slice(2);
if (!site || !outDir) {
  console.error('الاستعمال: node tools/screens.mjs <site-dir> <out-dir> [route ...]');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2',
  '.wasm': 'application/wasm', '.gz': 'application/gzip',
};

const dist = join(site, 'dist');
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  let file = join(dist, normalize(path === '/' ? '/index.html' : path));
  let body = await readFile(file).catch(() => null);
  /* تطبيق صفحةٍ واحدة: ما ليس ملفّاً مسارٌ يعرفه الموجّه */
  if (!body && !extname(path)) { file = join(dist, 'index.html'); body = await readFile(file).catch(() => null); }
  if (!body) return void res.writeHead(404).end('404');
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    /* عزلُ الأصول — `SharedArrayBuffer` شرطُ تشغيل WASI */
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
  });
  res.end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
await mkdir(outDir, { recursive: true });

const bin = chrome();
if (!bin) { console.error('لا Chrome على هذا الجهاز'); process.exit(1); }

const profile = await mkdtemp(join(tmpdir(), 't3lm-shot-'));
const proc = spawn(bin, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--no-default-browser-check', '--force-device-scale-factor=1',
  `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

const wsUrl = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('لم يُعلن المتصفّح منفذه')), 30000);
  let buf = '';
  proc.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/ws:\/\/[^\s]+/);
    if (m) { clearTimeout(t); resolve(m[0]); }
  });
});

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let seq = 0;
const waiting = new Map();
const events = [];
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id === undefined) return void events.push(msg);
  waiting.get(msg.id)?.(msg);
  waiting.delete(msg.id);
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve) => { const id = ++seq; waiting.set(id, resolve); ws.send(JSON.stringify({ id, method, params, sessionId })); });

const W = Number(process.env.W ?? 1280);
const H = Number(process.env.H ?? 1000);
const FULL = process.env.FULL !== '0';
const READY = process.env.READY ?? '.home, .region';

const done = async (code) => {
  proc.kill('SIGTERM');
  server.close();
  /* المتصفّح يكتب في ملفّه الشخصيّ وهو يموت: تُمهَل له لحظة، ثم يُحذَف بلا شكوى */
  await new Promise((r) => setTimeout(r, 300));
  await rm(profile, { recursive: true, force: true }).catch(() => {});
  process.exit(code);
};

let bad = 0;
for (const route of routes.length ? routes : ['/']) {
  const name = route.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'home';
  events.length = 0;

  const { result: target } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: att } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const sid = att.sessionId;
  await send('Page.enable', {}, sid);
  await send('Runtime.enable', {}, sid);
  await send('Log.enable', {}, sid);
  await send('Emulation.setDeviceMetricsOverride', {
    width: W, height: H, deviceScaleFactor: 1, mobile: false,
  }, sid);
  await send('Page.navigate', { url: base + route }, sid);

  const read = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true }, sid)).result?.result?.value;

  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) {
    await new Promise((r) => setTimeout(r, 250));
    ready = await read(`!!document.querySelector(${JSON.stringify(READY)})`);
  }
  /* الخطوطُ محلّية، وانتظارُها يمنع لقطةً بوجهٍ بديل */
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true }, sid);
  await new Promise((r) => setTimeout(r, 400));

  /* EVAL — تعبيرٌ يُنفَّذ قبل اللقطة: يفتح لوحاً، أو يبذر تقدّماً في المخزن
     المحلّيّ. بلا هذا تُصوَّر أوّلُ زيارةٍ وحدها، وحالاتُ التقدّم لا تُرى. */
  if (process.env.EVAL) {
    await send('Runtime.evaluate', { expression: process.env.EVAL, awaitPromise: true }, sid);
    await new Promise((r) => setTimeout(r, 400));
  }

  const full = FULL ? (await send('Page.getLayoutMetrics', {}, sid)).result?.cssContentSize : null;
  const { result: shot } = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: FULL,
    ...(full ? { clip: { x: 0, y: 0, width: W, height: Math.min(full.height, 20000), scale: 1 } } : {}),
  }, sid);

  const out = join(outDir, `${name}.png`);
  await writeFile(out, Buffer.from(shot.data, 'base64'));

  const errs = events.filter((e) =>
    (e.method === 'Runtime.exceptionThrown') ||
    (e.method === 'Runtime.consoleAPICalled' && e.params?.type === 'error') ||
    (e.method === 'Log.entryAdded' && e.params?.entry?.level === 'error'));
  const px = Math.round((full?.height ?? H));
  console.log(`  ${route.padEnd(12)} → ${out}  ${W}×${px}${ready ? '' : '  ⚠ لم تُركَّب'}${errs.length ? `  ✗ ${errs.length} خطأ` : ''}`);
  for (const e of errs.slice(0, 6)) {
    const t = e.params?.exceptionDetails?.exception?.description
      ?? e.params?.entry?.text
      ?? e.params?.args?.map((a) => a.value ?? a.description).join(' ');
    const where = e.params?.entry?.url ?? e.params?.exceptionDetails?.url ?? '';
    console.log(`      ${String(t).split('\n')[0]}${where ? `  ← ${where}` : ''}`);
  }
  if (!ready || errs.length) bad++;
  await send('Target.closeTarget', { targetId: target.targetId });
}

await done(bad ? 1 : 0);
