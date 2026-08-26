#!/usr/bin/env node
/**
 * يفحص عامل الخدمة **بعد أن يسيطر** — وهو الموضع الذي لا يراه أي فحصٍ آخر.
 *
 *   node tools/swcheck.mjs <site-dir>
 *
 * وخادمُه يقلّد Cloudflare Pages في نقطةٍ واحدة حاسمة: **`/index.html` يردّ ٣٠٧
 * إلى `/`**. وخادمُ `screens.mjs` لا يفعل، ولذلك مرّ العيب من تحته: التخزين
 * المسبق كان يحفظ استجابةً بعَلَم `redirected`، وردُّها على طلب تنقّلٍ وضعُه
 * `manual` خطأُ شبكةٍ في المواصفة — فيموت الموقع عند كل زيارةٍ لاحقة.
 *
 * فحصُه ثلاث زيارات: الأولى تُثبِّت العامل، والثانية والثالثة **تحت سيطرته**.
 */
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, access } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { chrome } from './shot.mjs';

const site = process.argv[2];
if (!site) { console.error('الاستعمال: node tools/swcheck.mjs <site-dir>|<url>'); process.exit(1); }
/* عنوانٌ حيّ: يُفحَص المرفوع كما هو، بلا خادمٍ محلّيّ */
const LIVE = /^https?:\/\//.test(site);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2',
  '.wasm': 'application/wasm', '.gz': 'application/gzip',
};

const dist = join(site, 'dist');
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  /* سلوك Pages بحرفه — وهو سبب العيب كلّه */
  if (path.endsWith('/index.html')) {
    return void res.writeHead(307, { Location: path.slice(0, -'index.html'.length) }).end();
  }
  let file = join(dist, normalize(path === '/' ? '/index.html' : path));
  let body = await readFile(file).catch(() => null);
  if (!body) return void res.writeHead(404).end('404');
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(body);
});
let base = site.replace(/\/$/, '');
if (!LIVE) {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
}

const bin = chrome();
if (!bin) { console.error('لا Chrome على هذا الجهاز'); process.exit(1); }
const profile = await mkdtemp(join(tmpdir(), 't3lm-sw-'));
const proc = spawn(bin, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

const wsUrl = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('لم يُعلن المتصفّح منفذه')), 30000);
  let buf = '';
  proc.stderr.on('data', (d) => { buf += d; const m = buf.match(/ws:\/\/[^\s]+/); if (m) { clearTimeout(t); resolve(m[0]); } });
});
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let seq = 0;
const waiting = new Map();
const events = [];
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id === undefined) return void events.push(msg);
  waiting.get(msg.id)?.(msg); waiting.delete(msg.id);
});
const send = (method, params = {}, sessionId) =>
  new Promise((r) => { const id = ++seq; waiting.set(id, r); ws.send(JSON.stringify({ id, method, params, sessionId })); });

const { result: target } = await send('Target.createTarget', { url: 'about:blank' });
const { result: att } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
const sid = att.sessionId;
for (const d of ['Page', 'Runtime', 'Log', 'Network']) await send(`${d}.enable`, {}, sid);

const READY = JSON.stringify(process.env.READY ?? '#root > *');

const read = async (expr, awaitPromise = false) =>
  (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise }, sid)).result?.result?.value;

/* الموقع الذي لا يسجّل عاملاً يمرّ من هذا الفحص بلا أن يُفحَص — وذلك أخضرُ
   كاذب، وهو نفس صنف الخطأ الذي وُضع هذا الملفّ لأجله. فيُعلَن. */
const hasSw = LIVE
  ? await fetch(base + '/sw.js').then((r) => r.ok, () => false)
  : await access(join(dist, 'sw.js')).then(() => true, () => false);

let bad = 0;
let controlledEver = false;
for (const visit of [1, 2, 3]) {
  events.length = 0;
  await send('Page.navigate', { url: base + '/' }, sid);

  let mounted = false;
  for (let i = 0; i < 40 && !mounted; i++) {
    await new Promise((r) => setTimeout(r, 250));
    mounted = await read(`!!document.querySelector(${READY})`);
  }
  if (visit === 1) {
    /* لا تُقاس الزيارة الثانية إلا بعد أن يسيطر العامل فعلاً */
    await read(`Promise.race([
      navigator.serviceWorker.ready.then(() => new Promise(r => {
        const t = setInterval(() => { if (navigator.serviceWorker.controller) { clearInterval(t); r('ok'); } }, 100);
      })),
      new Promise(r => setTimeout(() => r('انقضت المهلة قبل أن يسيطر العامل'), 30000)),
    ])`, true);
  }

  const controlled = await read(`!!navigator.serviceWorker.controller`);
  const errs = events.filter((e) =>
    e.method === 'Runtime.exceptionThrown' ||
    (e.method === 'Runtime.consoleAPICalled' && e.params?.type === 'error') ||
    (e.method === 'Log.entryAdded' && e.params?.entry?.level === 'error') ||
    e.method === 'Network.loadingFailed');

  if (controlled) controlledEver = true;
  const ok = mounted && !errs.length;
  if (!ok) bad++;
  console.log(`  زيارة ${visit} · ${controlled ? 'تحت سيطرة العامل' : 'بلا عامل'} · ${mounted ? 'رُكِّبت' : '✗ لم تُركَّب'}${errs.length ? ` · ✗ ${errs.length} خطأ` : ''}`);
  for (const e of errs.slice(0, 4)) {
    const t = e.params?.errorText ?? e.params?.entry?.text
      ?? e.params?.exceptionDetails?.exception?.description
      ?? e.params?.args?.map((a) => a.value ?? a.description).join(' ');
    console.log(`      ${String(t).split('\n')[0]}`);
  }
}

proc.kill('SIGTERM');
if (!LIVE) server.close();
await new Promise((r) => setTimeout(r, 300));
await rm(profile, { recursive: true, force: true }).catch(() => {});
if (bad) console.log(`✗ ${bad} زيارة فاشلة`);
else if (hasSw && !controlledEver) {
  bad = 1;
  console.log('✗ dist/sw.js مولَّد ولم يسيطر قطّ — لا شيء يسجّله في src/main.tsx،');
  console.log('  فالموقع لا يُثبَّت تطبيقاً، وهذا الفحص لم يفحص شيئاً.');
} else console.log('✓ العامل يخدم التنقّل تحت سلوك Pages');
process.exit(bad ? 1 : 0);
