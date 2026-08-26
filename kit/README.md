# @t3lm/kit

العدّة المشتركة لمواقع المناهج. تعطيك السلوك والبنية فقط: لا تعرف لوناً ولا خطّاً
ولا تخطيطاً، لأن الشكل يُشتقّ لكل منهج من موضوعه.

تحتاج React 18 أو أحدث، وVite، ومساحة عمل npm واحدة من جذر المستودع.

متى يدخل مكوّن هنا، ومتى يبقى في المنهج: انظر
[`curriculum-kit/SKILL.md`](../.claude/skills/curriculum-kit/SKILL.md).

---

## المداخل

| المدخل | ماذا يعطي |
|---|---|
| `@t3lm/kit/editor` | `Runner` · `CodeEditor` · المحرّكات |
| `@t3lm/kit/terminal` | `Terminal` — لوحة مخرَج |
| `@t3lm/kit/md` | `parseChapter(md)` · `slugify(s)` |
| `@t3lm/kit/highlight` | `highlightWith(parser, code)` · `escapeOnly` |
| `@t3lm/kit/highlight/c` · `/dart` · `/go` · `/rust` · `/sh` | `highlightToHtml(code, lang?)` |
| `@t3lm/kit/progress` | `makeStore(key)` — اللقطات المعبورة وتوقّعات القارئ |
| `@t3lm/kit/styles/reset.css` · `contract.css` | التصفير، وعقد المتغيّرات |
| `@t3lm/kit/editor/*.css` · `terminal/*.css` | `editor` و`terminal` للبنية، و`derive` للاشتقاق، و`vscode-dark` |

ولكلّ لغةٍ **مدخلها** لأن كلّاً منها يستورد محلّله وحده، فلا تحمل صفحة Rust
محلّل Go معها. و`dart` يحمل `yaml` أيضاً — `pubspec.yaml` عدّةُ Dart لا لغةٌ
أخرى تُعرَض. و`sh` يحمل `dockerfile` للسبب نفسه.

---

## في موقع منهج

```bash
npm i @t3lm/kit -w curricula/<category>/<slug>/site
```

مصادر العدّة TypeScript تُصرَّف مع الموقع، فاستثنِها من التحزيم المسبق:

```ts
export default defineConfig({
  base: './',
  plugins: [react()],
  optimizeDeps: { exclude: ['@t3lm/kit'] },
});
```

---

## `Runner`

محرّر مع شريط أدوات وزرّ تشغيل ولوحة مخرَج.

```tsx
import { Runner, createGoRuntime } from '@t3lm/kit/editor';
import '@t3lm/kit/editor/vscode-dark.css';   // اختياري

<Runner initial={code} lang="go" filename="main.go"
        runtime={createGoRuntime(import.meta.env.VITE_GO_PROXY)}
        fallback={{ label: 'Playground ↗', href: 'https://go.dev/play/' }} />
```

حمّله كسولاً. إسقاطه من موقع Rust قصّ الحزمة من 893 إلى 639 كيلوبايت:

```tsx
const Runner = lazy(() => import('@t3lm/kit/editor').then(m => ({ default: m.Runner })));
```

| الخاصية | النوع | الافتراضي | |
|---|---|---|---|
| `initial` | `string` | — | الكود الأوّلي، وإليه يعود زرّ الاسترجاع |
| `lang` | `'go' \| 'javascript' \| 'python' \| 'text'` | `'go'` | نمط اللغة، يُحمَّل كسولاً |
| `runtime` | `Runtime` | — | بدونه يظهر `fallback` |
| `filename` | `string` | مشتقّ من `lang` | الاسم في الشريط |
| `useTabs` · `tabSize` | `boolean` · `number` | `true` · `4` | الإزاحة |
| `minHeight` | `string` | `'140px'` | |
| `fallback` | `{ label, href? }` | — | ينسخ الكود ويفتح الرابط |
| `labels` | `Partial<RunnerLabels>` | عربية | قيمها `ReactNode`، فتمرّر الأيقونة معها |
| `terminal` | `{ prompt, promptDelay, labels, className, command }` | — | الأمر يُشتقّ من اللغة واسم الملف |
| `notice` | `ReactNode` | — | يظهر قبل التشغيل، لموضع يخالف فيه المحرّك الأداة الحقيقية |
| `persistKey` | `string` | — | هويّة المسودّة. اشتقّها من محتوى البلوك لا من ترتيبه، وإلا انتقلت المسودّة إلى بلوك آخر عند إعادة الترتيب |
| `className` | `string` | — | |

حقول `RunnerLabels`: `copy` · `copied` · `reset` · `run` · `running` ·
`shortcut` (اجعله `''` لإخفائه) · `draft` · `noticePrefix`.

**`CodeEditor`** هو المحرّر وحده بلا شريط ولا تشغيل. له نفس الخصائص عدا
`runtime` و`fallback` و`filename`، وزيادةً `readOnly` و`onChange(value)` و`ref`
يكشف `getValue` و`setValue` و`focus`. وفيه أرقام أسطر وطيّ وبحث (`⌘F`) وتحديد
مستطيل وإبراز تطابقات التحديد وإظهار المسافات داخل التحديد.

---

## `Terminal`

لوحة مخرَج بهيئة طرفية. تعرض المحثّ والأمر، ثم المخرَج، ثم محثّاً ختامياً بعد
`promptDelay` — وهي اللحظة التي ترجع فيها الصدفة بعد انتهاء الأمر. وبلا مؤشّر
وامض، لأن الوميض يوهم القارئ أنه يستطيع الكتابة فيها.

```tsx
<Terminal command="go build -gcflags='-m' main.go"
          stdout={"./main.go:7:13: n escapes to heap"} status="ok" ms={412} />
```

| الخاصية | النوع | الافتراضي | |
|---|---|---|---|
| `command` | `string` | — | يظهر بعد المحثّ الأوّل |
| `stdout` · `stderr` · `note` | `string` | — | المخرَج والخطأ، وملاحظة قبلهما |
| `status` · `ms` | `RunStatus` · `number` | — | الشارة والزمن |
| `prompt` · `promptDelay` | `string` · `number` | `'$'` · `100` | |
| `runKey` | `string \| number` | — | يعيد تشغيل التأخير عند تغيّره |
| `labels` | `Partial<TerminalLabels>` | عربية | `status.*` و`empty` |

يرثها `Runner`، وتُخصَّص منه عبر `terminal={{ prompt: '›', promptDelay: 250 }}`.

---

## المحرّكات

| المحرّك | أين ينفَّذ | |
|---|---|---|
| `javascriptRuntime` | Web Worker معزول | مهلة 5 ثوانٍ، ويلتقط `console.*` |
| `createGoRuntime(endpoint?)` | خادم، بمترجم `gc` الحقيقي | يحتاج وسيطاً يحلّ CORS أمام `go.dev/_/compile`. وبلا وسيط يصرّح بأنه غير متوفّر بدل أن يحاكي شيئاً |
| `createWasiRuntime(binary, label, lang)` | المتصفّح عبر WASI | يتطلّب `@runno/wasi` وعزل أصول COOP/COEP |

المحرّك يعلن `fidelity` حين تخالف بيئته بيئة المتعلّم — إصدار Playground ليس
إصدارك مثلاً — فيُعرض التحذير قبل أي تشغيل.

```ts
interface Runtime {
  id: string; label: string; lang: Lang;
  fidelity?: string;
  run(code: string, opts?: { stdin?: string; timeoutMs?: number }): Promise<RunResult>;
}
// RunResult: { status: 'ok'|'error'|'timeout'|'unavailable', stdout, stderr, ms, note? }
```

---

## الثيم

المكوّنات ترث هوية المنهج ولا تعرّف لنفسها شيئاً. وقيمة لون حرفية خارج ملفّ
التوكنز تُفشل `node tools/doctor.mjs` بالملفّ والسطر.

```ts
import '@t3lm/kit/styles/reset.css';
import './styles/tokens.css';             // هويتك
import '@t3lm/kit/editor/editor.css';     // بنية المحرّر
import '@t3lm/kit/editor/derive.css';     // يشتقّ --ck-ed-* منها
```

عرّف في `tokens.css` عندك: `--ck-primary` و`--ck-secondary` و`--ck-ok`
و`--ck-warn` و`--ck-danger` و`--ck-bg` و`--ck-surface` و`--ck-surface-2`
و`--ck-line` و`--ck-text` و`--ck-text-dim` و`--ck-text-faint` و`--ck-font-body`
و`--ck-font-mono`. وللشكل `--ck-r` (يسقط إلى `0px`) و`--ck-border-w` (إلى `1px`).

غيّر `--ck-primary` وحده فيتبعه لون الكلمات المفتاحية والمؤشّر والتحديد وزرّ
التشغيل. والقائمة كاملة بأدوارها في
[`src/styles/contract.css`](src/styles/contract.css).

يبقى استثناء واحد: `editor/vscode-dark.css` يعيد إنتاج ثيم VS Code Dark+ بقيمه
الرسمية. استورده بدل `derive.css` حين يكون مظهر VS Code حرفياً هو المطلوب، وله
صفّ في جدول اشتقاق المنهج.

---

## البنية

```
src/
├── editor/     CodeEditor · Runner · theme.ts · whitespace.ts · presets/ · runtimes/
├── terminal/   Terminal.tsx + terminal.css + derive.css
├── highlight/  index.ts (المحرّك) · c.ts · dart.ts · go.ts · rust.ts · sh.ts
├── md/         parseChapter: العنوان، والأجزاء `## `، واللقطات `### `
├── progress/   makeStore: التوقّعات، واللقطات المعبورة، وآخر موضع
└── styles/     contract.css · reset.css
```

`md` لا يعرف أنواع البلوكات، لأن تقسيم اللقطة قرار المنهج: مفرداته (بوّابة،
مخرَج مسجَّل، رفض مترجم) تختلف باختلاف موضوعه.

---

## الديمو

```bash
npm run demo -w @t3lm/kit        # محرّرا Go وJavaScript على http://localhost:5173
npm run typecheck -w @t3lm/kit
```
