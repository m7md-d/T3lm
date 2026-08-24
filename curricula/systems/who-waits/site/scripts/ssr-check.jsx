/**
 * فحص دخان بلا متصفح — يصيّر كل مسار وكل مختبر عبر renderToString.
 * يلتقط: ترتيب الهوكس، القراءة من كائناتٍ غير معرّفة، الاستيراد المكسور.
 * لا يلتقط: المظهر ولا التفاعلات بالنقر.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from '../src/App.jsx';
import { regions, docs } from '../src/content/index.js';
import { LABS } from '../src/widgets/index.js';

const routes = [
  '/',
  '/threads',
  '/matrix',
  '/labs',
  ...regions.map((r) => r.path),
  ...regions.slice(0, 3).map((r) => `${r.path}?s=${encodeURIComponent('الدرس')}`),
  ...docs.map((d) => d.path),
  '/nope',
];

let bad = 0;

for (const path of routes) {
  try {
    const [pathname, search] = path.split('?');
    const html = renderToString(
      <StaticRouter location={{ pathname, search: search ? `?${search}` : '' }}>
        <App />
      </StaticRouter>
    );
    if (html.length < 500) throw new Error(`ناتج قصير جداً (${html.length})`);
    console.log(`✓ ${decodeURIComponent(path).padEnd(34)} ${html.length.toLocaleString('en-US')} حرف`);
  } catch (e) {
    bad++;
    console.log(`✗ ${decodeURIComponent(path).padEnd(34)} ${e.message}`);
  }
}

console.log('\n— المختبرات منفردة —');
for (const l of LABS) {
  try {
    const html = renderToString(
      <StaticRouter location="/">
        <l.Component />
      </StaticRouter>
    );
    if (html.length < 300) throw new Error('ناتج قصير');
    console.log(`✓ ${String(l.id).padEnd(14)} ${l.name}`);
  } catch (e) {
    bad++;
    console.log(`✗ ${String(l.id).padEnd(14)} ${e.message}`);
  }
}

console.log(bad === 0 ? '\n✅ كل المسارات والمختبرات تُصيَّر بلا أخطاء' : `\n❌ ${bad} فشل`);
process.exit(bad ? 1 : 0);
