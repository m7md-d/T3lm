/**
 * سجلّ المختبرات — لكلّ واحدٍ **الادّعاء الذي يقلبه** وموضعُه بالضبط.
 *
 * وفحصٌ في `../../scripts/ssr-check.tsx` يفرض أن يطابق كلٌّ منها **قسماً واحداً**
 * لا صفراً ولا اثنين، وإلّا انجرفت المختبرات عن مواضعها بصمتٍ عند أوّل تعديلٍ
 * في النصّ.
 *
 * والمنفّذ واحد: نقلُ `dsl.py` و`model.py` و`emit.py` إلى المتصفّح، وقد فُحص
 * تطابقُه مع Python في `../../scripts/conform.ts` على حزمتَي `examples/`.
 * والمعروضُ يختلف بالمرحلة، لأنّ الادّعاء يختلف.
 */
export type Stage = 'tokens' | 'tree' | 'model' | 'canonical' | 'picture';

export type Lab = {
  id: string;
  region: string;
  /** مقطعٌ من عنوان القسم الذي يُحقَن بعده. */
  after: string;
  stage: Stage;
  /** الادّعاء بجملةٍ من نصّ الفصل. */
  claim: string;
  /** ملفّات `examples/` التي تُفتَح بضغطة — بأسمائها لا بنصّها. */
  seeds: string[];
};

export const labs: Lab[] = [
  {
    id: 'tokens',
    region: '06',
    after: 'الرمزُ ومعه موضعُه',
    stage: 'tokens',
    claim: 'كلُّ رمزٍ يخرج ومعه سطرُه وعمودُه — احذف الاقتباس أو أضف سطراً وانظر ما يتغيّر.',
    seeds: ['valid/02-props.dsl', 'invalid/07-open-string.dsl'],
  },
  {
    id: 'tree',
    region: '07',
    after: 'القاعدة دالّة',
    stage: 'tree',
    claim: 'لكلّ قاعدةٍ دالّةٌ باسمها، والنظرةُ الواحدة تقرّر أيَّها تُنادى.',
    seeds: ['valid/03-chain.dsl', 'invalid/06-no-arrow.dsl', 'invalid/09-dotted-name.dsl'],
  },
  {
    id: 'report',
    region: '09',
    after: 'الثلاثة مجتمعة',
    stage: 'model',
    claim: 'الرسالة تحمل ثلاثة: ما وقع، وأين وقع، وما كان متوقَّعاً.',
    seeds: ['invalid/08-no-value.dsl', 'invalid/06-no-arrow.dsl', 'valid/01-minimal.dsl'],
  },
  {
    id: 'ports',
    region: '12',
    after: 'هنا يموت الانهيار الأوّل',
    stage: 'model',
    claim: 'الوصلة تُرفَض قبل أن تُرسَم، بثلاثة أصنافٍ من الرفض.',
    seeds: ['invalid/01-unknown-box.dsl', 'invalid/02-unknown-port.dsl', 'invalid/03-port-mismatch.dsl'],
  },
  {
    id: 'symbols',
    region: '15',
    after: 'هنا يموت الانهيار الثاني',
    stage: 'model',
    claim: 'الاسم المكرَّر يُرفَض بموضعَيه: موضعِ التكرار وموضعِ التعريف الأوّل.',
    seeds: ['invalid/04-duplicate-name.dsl', 'valid/01-minimal.dsl'],
  },
  {
    id: 'canonical',
    region: '22',
    after: 'الدورة تستقرّ بعد المرّة الأولى',
    stage: 'canonical',
    claim: 'رتّب الجمل كيف شئت: الشكل القانونيّ واحد، والدورة الثانية تطابق الأولى.',
    seeds: ['valid/03-chain.dsl', 'valid/02-props.dsl', 'valid/04-bare.dsl'],
  },
];
