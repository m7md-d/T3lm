# كتالوج المكوّنات

المكوّنات تثبت عبر الثيمات؛ يُعاد جلدها فقط عبر متغيّرات الـ CSS. كلٌّ هنا بدوره
الدلالي وبنيته الهيكلية. الـ CSS الكامل لها في `assets/example-cyberpunk.css`
(ثيم واحد محقّق) — انسخ البنية، أعد اشتقاق القيم من الثيم الجديد.

## التخطيط الأساسي

```html
<div class="shell">
  <nav-slot id="nav-slot"></nav-slot>   <!-- يُحقن عبر nav-include.js -->
  <main class="main"> ... </main>
</div>
```
- `topbar`: شريط علوي لاصق، mono، فيه brand + meta + status حيّ (نقطة نابضة).
- `sidebar`: ملاحة لاصقة، عناوين أقسام `sb-title`، روابط `data-mod` للتفعيل،
  وكتلة **cheat** (مرجع سريع للأرقام/الثوابت المهمة).

## hero (الصفحة الرئيسية)

```html
<header class="hero">
  <div class="hero-meta"><span class="tag live">...</span></div>
  <h1>عنوان <span class="accent">مميّز</span></h1>
  <p class="lede"> ... </p>
</header>
```
موتيف الـ hero (مثل `.glitch` بطبقتي `::before/::after`) **اختياري ومشتقّ من
الثيم** — يُحذف في الثيمات الهادئة.

## العناوين

- `<h2 data-num="01">` → شارة رقم باللون المهيمن.
- `<h3>` → سابقة `// ` تلقائية بنمط تعليق.
- `<h4>` → mono، دلالي.

## الحاويات الدلالية

```html
<div class="callout info|warn|danger">
  <div class="label">ليش</div> <p>...</p>
</div>

<div class="panel bracket"> ... </div>   <!-- زوايا معقوفة باللون المهيمن -->

<div class="box" data-label="لغز">       <!-- عنوان طافٍ على الحدّ -->
  ...                                     <!-- amber للتحذير/التمرين -->
</div>
```
- `callout`: للدوافع والملاحظات والتحذيرات وتحليل جذر الخطأ (`danger`).
- `box[data-label]`: مثالي **للألغاز** (اللبنة المركزية في منهجك).

## الشبكات

```html
<div class="stats"><div class="stat"><div class="v">16µs</div><div class="k">SIFS</div></div></div>

<div class="modgrid">
  <a class="modcard"><div class="mc-num">MODULE 01</div>
    <div class="mc-title">...</div><div class="mc-desc">...</div>
    <div class="mc-foot"><span class="open">افتح</span></div>
  </a>
</div>
```
- `stats`: أرقام/KPI بارزة (mono كبير).
- `modgrid/modcard`: شبكة الوحدات في الصفحة الرئيسية. للكشف التدريجي: أضف حالة
  **مقفلة** (locked) للبطاقات القادمة.

## الملاحة والمراجع

```html
<nav class="pager">
  <a class="prev"><div class="label">السابق</div><div class="title">...</div></a>
  <a class="next"><div class="label">التالي</div><div class="title">...</div></a>
</nav>

<div class="toc"><div class="toc-h">المحتوى</div><ol>...</ol></div>
<span class="badge ok|bad|warn|info">RFC §11.2</span>
```
- `pager`: السابق/التالي — استخدم `next` لزرع **بذرة غموض** عن القادم.
- `badge`: للإحالات المحدّدة للمصادر (يخدم "أشِر للموضع لا تلخّص").

## الكود والمخططات

```html
<pre><div class="term-head"><span class="tt">bash</span></div>
<code><span class="pmt">$</span> ... <span class="cmt"># ...</span></code></pre>

<div class="ascii"> ... رسم ASCII ... </div>

<figure>
  <div class="fig-head"><span class="id">FIG 1</span> العنوان</div>
  <div class="fig-body"><svg>...</svg></div>
  <figcaption>...</figcaption>
</figure>
```
- `pre.term-head`: كتلة طرفية برأس فيه أضواء مرور (مشتقّ من الثيم).
- تلوين الكود: `.pmt .cmt .kw .str .num`.
- `ascii` / `figure`: للمخططات — كلها LTR معزولة.

## قاعدة عامة

أي مكوّن لا يخدم فهماً أو مزاجاً في صفحة معيّنة → لا تستعمله. الكتالوج مفردات
متاحة، لا قائمة إلزامية.
