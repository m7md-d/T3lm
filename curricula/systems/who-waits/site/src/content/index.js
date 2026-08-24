/**
 * واصفات الأقاليم — الملفّ الوحيد المكتوب يدوياً، لأنه يحمل ما ليس في الماركداون:
 * الترتيب، والدور البنيوي (جذع/فرع/التحام)، والحمل الذي يخدمه كل إقليم.
 *
 * `group` و`serves` ليسا زينة: الأول من إعلان README («٠٠–٠٣ هي الجذع…»)،
 * والثاني من الجدول الجامع في الإقليم ٠٩. واللون مشتقٌّ منهما لا من لوحة.
 */
import r00 from './md/regions/00-ground.md?raw';
import r01 from './md/regions/01-bytes.md?raw';
import r02 from './md/regions/02-who-waits.md?raw';
import r03 from './md/regions/03-terminal.md?raw';
import r04 from './md/regions/04-time-state.md?raw';
import r05 from './md/regions/05-protocol.md?raw';
import r06 from './md/regions/06-shared-state.md?raw';
import r07 from './md/regions/07-media.md?raw';
import r08 from './md/regions/08-disk.md?raw';
import r09 from './md/regions/09-craft.md?raw';

import mdReadme from './md/README.md?raw';
import mdTree from './md/appendix/skill-tree.md?raw';
import mdModels from './md/appendix/mental-models.md?raw';
import mdSheet from './md/appendix/cheatsheet.md?raw';

export const LOADS = [
  { id: 'chat', name: 'المحادثة', deadline: 'إدراك بشري ~١٠٠ms', policy: 'اقطع', fatal: 'فقدان رسالة', color: '#5fbf7f' },
  { id: 'game', name: 'اللعبة', deadline: 'إطار ١٦ms', policy: 'أسقِط', fatal: 'ارتجاف الحركة', color: '#e0a83f' },
  { id: 'stream', name: 'البثّ', deadline: 'إطار + ساعتان', policy: 'أسقِط قبل الترميز', fatal: 'انقطاع الصوت', color: '#c06fd0' },
  { id: 'files', name: 'الملفّات', deadline: 'لا مهلة — إنتاجيّة', policy: 'احجز', fatal: 'فقدان بايت', color: '#d0784f' },
];

const ALL = ['chat', 'game', 'stream', 'files'];

export const regions = [
  {
    id: '٠٠', n: 0, slug: 'ground', raw: r00, title: 'الأرضية',
    full: 'بايتٌ يعبر الحدّ', axis: 'صدق الاستدعاء', group: 'trunk', serves: ALL,
    color: '#6b8299',
    blurb: 'أشهر سطرٍ كتبتَه ألف مرّة يكذب عليك كذبةً صامتة.',
    builds: 'الواصف',
  },
  {
    id: '٠١', n: 1, slug: 'bytes', raw: r01, title: 'البايت بلا معنى',
    full: 'التأطير والتمثيل', axis: 'البنية', group: 'trunk', serves: ALL,
    color: '#5f93ab',
    blurb: 'التيّار لا يحفظ حدود رسائلك. أنت من يخترعها.',
    builds: 'المخزن الحلقي · المحلّل',
  },
  {
    id: '٠٢', n: 2, slug: 'who-waits', raw: r02, title: 'مَن ينتظر؟',
    full: 'الجهوزيّة والحلقة والضغط العكسي', axis: 'الوقت', group: 'core', serves: ALL,
    color: '#3fb6cc',
    blurb: 'قلب المنهج. هنا تُبنى الآلة التي تشغّل الأربعة كلّها.',
    builds: 'الحلقة · طابور الخرج',
  },
  {
    id: '٠٣', n: 3, slug: 'terminal', raw: r03, title: 'الطرفيّة جهازاً',
    full: 'نظام السطر و ANSI والرسم التفاضلي', axis: 'الوهم البصري', group: 'trunk', serves: ALL,
    color: '#7fa8bd',
    blurb: 'شاشتك ليست شاشة. إنها بروتوكولٌ أقدم مما تظنّ.',
    builds: 'الشبكة · الرسم التفاضلي',
  },
  {
    id: '٠٤', n: 4, slug: 'time-state', raw: r04, title: 'اللعبة',
    full: 'الزمن والحالة', axis: 'الإيقاع', group: 'branch', serves: ['game'],
    color: '#e0a83f',
    blurb: 'لماذا تنهار فيزياء لعبتك على جهازٍ أسرع؟ الجواب رياضيّ.',
    builds: 'الخطوة الثابتة · الحتميّة',
  },
  {
    id: '٠٥', n: 5, slug: 'protocol', raw: r05, title: 'البروتوكول',
    full: 'العقد بين طرفين', axis: 'العقد', group: 'branch', serves: ['chat', 'files', 'stream'],
    color: '#5fbf7f',
    blurb: 'لغةٌ بين طرفين لا يثق أحدهما في الآخر ولا يعرف متى مات.',
    builds: 'الجلسة · النبض',
  },
  {
    id: '٠٦', n: 6, slug: 'shared-state', raw: r06, title: 'الحالة المشتركة',
    full: 'مزامنة اللاعبين تحت التأخير', axis: 'الاتّفاق تحت التأخير', group: 'merge',
    serves: ['game'], color: '#b3bd4f',
    blurb: 'خمسة لاعبين لا يرون نفس العالم أبداً. والحرفة في إخفاء ذلك.',
    builds: 'التنبّؤ · المصالحة',
    from: ['time-state', 'protocol'],
  },
  {
    id: '٠٧', n: 7, slug: 'media', raw: r07, title: 'الوسائط',
    full: 'من العدسة إلى خليّةٍ في طرفيّتك', axis: 'الإنتاجيّة والتزامن', group: 'branch',
    serves: ['stream'], color: '#c06fd0',
    blurb: 'أطول إقليم، وأقساه. والوحيد الذي فيه ساعتان.',
    builds: 'الالتقاط · المرمّز · التزامن',
  },
  {
    id: '٠٨', n: 8, slug: 'disk', raw: r08, title: 'القرص والمتانة',
    full: 'ماذا يعني «حُفِظ الملفّ»؟', axis: 'الصدق', group: 'branch', serves: ['files'],
    color: '#d0784f',
    blurb: 'الجواب ليس نعم أو لا. وهنا ينكسر نموذج الحلقة.',
    builds: 'الوصفة الذرّيّة · الاستئناف',
  },
  {
    id: '٠٩', n: 9, slug: 'craft', raw: r09, title: 'الحرفة والالتحام',
    full: 'أربعة برامج، كم آلةً بنيت؟', axis: 'كلّ ما سبق', group: 'join', serves: ALL,
    color: '#cfd8e0',
    blurb: 'الأربعة يلتقون. وتكتشف كم كانت آلةً واحدة.',
    builds: 'المسطرة · الكابستون',
  },
].map((r) => ({ ...r, path: `/r/${r.slug}` }));

export const bySlug = Object.fromEntries(regions.map((r) => [r.slug, r]));

export const docs = [
  { slug: 'readme', raw: mdReadme, title: 'المدخل', blurb: 'الفلسفة والخريطة وقاعدة «لا كود».', spoiler: false },
  { slug: 'models', raw: mdModels, title: 'النماذج الذهنيّة', blurb: 'عشرون نموذجاً مجرّدةً عن سياقها.', spoiler: false },
  { slug: 'cheatsheet', raw: mdSheet, title: 'الورقة المرجعيّة', blurb: 'عقودٌ وجداول تُفتح أثناء العمل.', spoiler: false },
  {
    slug: 'skill-tree', raw: mdTree, title: 'شجرة المهارات',
    blurb: 'الخريطة كاملةً — بعد أن تكتشفها بنفسك.',
    spoiler: true,
    gate: 'المنهج يقول حرفياً: «لا تفتح هذا قبل الإقليم ٠٩ — فيه حرقٌ متعمَّدٌ لبنية المنهج».',
  },
].map((d) => ({ ...d, path: `/doc/${d.slug}` }));

export const docBySlug = Object.fromEntries(docs.map((d) => [d.slug, d]));
