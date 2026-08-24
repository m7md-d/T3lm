import { FramingLab, BackpressureLab, PaintLab } from './LabsTrunk.jsx';
import { LoopLab, LatencyLab, SyncLab, DurabilityLab } from './LabsBranch.jsx';

/**
 * سجلّ المختبرات.
 *
 * `after` مقطعٌ من عنوان **الخطوة** (`### `) التي يُحقن بعدها المختبر — لا من
 * عنوان القسم، لأن أقسام هذا المنهج خمسةٌ عامّة (نبذة/لغز/درس/تمرين/خلاصة)
 * والمحتوى الحقيقي يعيش في الخطوات المرقّمة داخل «الدرس».
 * `verify.mjs` يفرض أن يطابق كلٌّ منها **خطوةً واحدةً بالضبط**.
 */
export const LABS = [
  {
    id: 'framing',
    region: 'bytes',
    after: 'التأطير (framing)',
    name: 'مختبر الحدود',
    claim: 'لا يمكن أن يظهر المحدِّد داخل البيانات — والمحلّل الساذج ينكسر بمجرّد أن تتقطّع البايتات.',
    Component: FramingLab,
  },
  {
    id: 'backpressure',
    region: 'who-waits',
    after: 'الضغط العكسي',
    name: 'مختبر الضغط العكسي',
    claim: 'كل مخزنٍ غير محدودٍ قنبلة ذاكرة — والسياسات الثلاث إجاباتٌ مختلفة على نفس اللحظة.',
    Component: BackpressureLab,
  },
  {
    id: 'paint',
    region: 'terminal',
    after: 'حساب التكلفة',
    name: 'مختبر ميزانية الرسم',
    claim: 'الرسم التفاضلي ليس تحسيناً بل شرط الجدوى: ×١٠٠٠ في الحالة الشائعة.',
    Component: PaintLab,
  },
  {
    id: 'loop',
    region: 'time-state',
    after: 'الحلقة: اشتقاق',
    name: 'مختبر الحلقة',
    claim: 'الخطوة الثابتة تشتري الحتميّة والمناعة من النفق معاً — و`dt` المتغيّر يخسرهما معاً.',
    Component: LoopLab,
  },
  {
    id: 'latency',
    region: 'shared-state',
    after: 'إخفاء التأخير',
    name: 'مختبر إخفاء التأخير',
    claim: 'كل تقنيّةٍ تصلح شيئاً وتكلّف شيئاً — ولا واحدة تُلغي الفجوة.',
    Component: LatencyLab,
  },
  {
    id: 'sync',
    region: 'media',
    after: 'التزامن: ساعتان',
    name: 'مختبر السيّد',
    claim: 'ساعتان مستقلّتان تنحرفان حتماً — والصوت وحده يصلح سيّداً.',
    Component: SyncLab,
  },
  {
    id: 'durability',
    region: 'disk',
    after: 'الحقيقة المرّة',
    name: 'مختبر الوصفة الذرّيّة',
    claim: '`write` الناجحة ليست حفظاً — ونسيان `fsync` للمجلّد يُبطل الوصفة كلّها.',
    Component: DurabilityLab,
  },
];

export const labsFor = (slug) => LABS.filter((l) => l.region === slug);
export const labById = Object.fromEntries(LABS.map((l) => [l.id, l]));
