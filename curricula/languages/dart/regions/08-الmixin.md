# الإقليم ٠٨ — الـmixin

> `extends` مرّةً واحدة. وعشرة أصنافٍ غير متقاربة تحتاج القدرة نفسها. وC++
> تحلّها بالوراثة المتعدّدة، ومعها **مشكلة الماس**: صنفٌ يرث من اثنين ورثا من
> واحد، فأي نسخةٍ من الحقل عنده؟
>
> ورفضت Dart الوراثة المتعدّدة عمداً (جدول الإقليم ٠٠). والبديل ليس أضعف منها —
> هو **أدقّ**: ترتيبٌ خطّيٌّ واحد يُحسَب، فلا ماس أصلاً.

## القدرة تُخلَط لا تُورَث

```dart
mixin Counting {
  int _n = 0;
  void bump() => _n++;
  int get count => _n;
}

class Door with Counting {}

class Window with Counting {}

void main() {
  final d = Door()..bump()..bump();
  final w = Window()..bump();
  print('${d.count} ${w.count}');
  print(d is Counting);
}
```

<!-- out -->

```
2 1
true
```

**`Door` و`Window` لا تجمعهما قرابة**، وكلتاهما تعدّ. والحقل `_n` ليس مشتركاً
بينهما — لكلّ كائنٍ نسخته، كأنه كُتب في الصنف نفسه.

والسطر الأخير: `d is Counting` صحيح. **الـmixin نوعٌ** كالصنف والواجهة، فتستطيع
أن تطلب `Counting` وسيطاً.

**والفرق عن `implements`:** هذه أعطتك التطبيق. **والفرق عن `extends`:** تستطيع
أن تخلط عشرة، ولا ترث إلا من واحد.

## الترتيب يغيّر النتيجة

**الاعتقاد الشائع:** «`with A, B` تعني أن الصنف يحمل قدرتَي `A` و`B`. والترتيب
تنسيقٌ لا معنى له.»

**ولماذا يبدو مقنعاً:** لأنه صحيحٌ تماماً حين لا تتقاطع القدرتان — وهي الحالة
الشائعة. فتمرّ سنةٌ وأنت تعيد الترتيب أبجدياً بلا أثر.

اقرأ هذا وتوقّع السطرين:

```dart
class Base {
  String describe() => 'Base';
}

mixin Loud on Base {
  @override
  String describe() => '${super.describe()} + Loud';
}

mixin Timed on Base {
  @override
  String describe() => '${super.describe()} + Timed';
}

class A extends Base with Loud, Timed {}

class B extends Base with Timed, Loud {}

void main() {
  print(A().describe());
  print(B().describe());
}
```

**المخرَج**:

```
Base + Loud + Timed
Base + Timed + Loud
```

### الآلية: الخطّية

<!-- part -->

```
   class A extends Base with Loud, Timed

   The compiler builds a CHAIN of synthetic classes, left to right:

        Base                        ← the declared superclass
          ▲
        Base + Loud                 ← applying the first mixin
          ▲
        Base + Loud + Timed         ← applying the second
          ▲
          A                         ← the class body itself

   `super` inside a mixin means "the link BELOW me in this chain",
   not "the declared superclass".

   A().describe()  starts at the TOP  and walks down:
        A (none) → Timed → Loud → Base
   Base returns first, so the string is built bottom-up.
```

**القاعدة الصحيحة:** `with` تبني سلسلةً من اليسار إلى اليمين، والأخيرُ **أقربُ**
إلى الصنف. و`super` في الـmixin تعني الحلقة التي تحته في السلسلة — وهي مجهولةٌ
عند كتابة الـmixin ومعلومةٌ عند خلطه.

**وحدُّها:** الترتيب لا يعني شيئاً إن لم يُعِد أيُّ mixin تعريفَ ما يعرّفه آخر.
ولهذا يمرّ الخطأ سنواتٍ ثم يظهر يوم تضيف الـmixin الثاني.

**وأين يؤذي:** طبقات تسجيلٍ وتخزينٍ وتحقّقٍ تُخلَط على مستودع. اعكس اثنتين،
فيصير التسجيل يقع قبل التحقّق بدل أن يقع بعده — والاختبارات تمرّ.

## `on` تقيّد ما يُخلَط عليه

`super.describe()` في `Loud` تفترض أن تحتها من يعرف `describe`. ومن يضمن ذلك؟

```dart
class Base {}

mixin Loud on Base {}

class Other {}

class C extends Other with Loud {}

void main() => print('ok');
```

<!-- err -->

```
main.dart:7:7: Error: 'Other' doesn't implement 'Base' so it can't be used with 'Loud'.
```

**`on Base` شرطٌ لا وراثة.** يقول: لا تخلطني إلّا على من هو `Base` أو تحته. وبه
يصير `super` داخل الـmixin مضموناً وقت الترجمة.

**وهو ما يجعل الـmixin عقداً في الاتّجاهين:** يَعِد بما يقدّمه، ويشترط ما يحتاجه.

## ما لا يملكه الـmixin

```dart
mixin M {
  M();
}

void main() => print('ok');
```

<!-- err -->

```
main.dart:2:3: Error: Mixins can't declare constructors.
```

**ولهذا سببٌ في الإقليم ٠٦:** الترتيب هناك كان «كل ما يُسنِد أوّلاً، ثم كل ما
يُنفِّذ». والـmixin طبقةٌ صناعية في السلسلة، فلو ملكت بانياً لوجب أن يُنادى —
ولوجب أن تعرف بأي وسائط.

والنتيجة أن حقول الـmixin **تُهيَّأ بمُهيِّئاتها وحدها** — كما هُيِّئ `_n`
بصفرٍ أعلاه — ولا تأخذ شيئاً من موضع الخلط.

وفي الإصدار الثالث لم يعد الصنف يصلح mixin بلا إعلان:

```dart
class Helper {
  void help() => print('ساعد');
}

class Thing with Helper {}

void main() => Thing().help();
```

<!-- err -->

```
main.dart:5:18: Error: The class 'Helper' can't be used as a mixin because it isn't a mixin class nor a mixin.
```

**والسبب هو السبب نفسه:** الصنف يملك بانياً، والـmixin لا يستطيع أن ينادِيه. ومن
أراد الاثنين يكتب `mixin class` — ويقبل حينها أن يفقد البانيَ عند الخلط.

## التمرين

**١ — احسب قبل أن تشغّل.** ثلاثة mixins على أساسٍ واحد، وكلٌّ منها يطبع اسمه
**قبل** `super` وبعده:

<!-- part -->

```dart
mixin X on Base {
  @override
  void go() { print('X قبل'); super.go(); print('X بعد'); }
}
```

ثم اخلط الثلاثة على صنفٍ واحد بهذا الترتيب، وتوقّع الأسطر السبعة **بترتيبها**
قبل التشغيل. ثم شغّل.

كم سطراً أصبتَ؟ والذي أخطأتَ فيه — أين انحرف تفكيرك؟

**٢ — ابنِ الماس.** اكتب mixinَين يعرّفان **الحقل نفسه** بالاسم نفسه، واخلطهما
معاً على صنف.

كم نسخةً من الحقل في الكائن؟ اكتشف ذلك ببرنامج لا بحدس. ثم اسأل: **لماذا لا توجد
مشكلة ماسٍ هنا أصلاً؟**

**٣ — قيّد بـ`on` واجهةً لا صنفاً.** اكتب mixinاً شرطُه `Comparable` لا صنفٌ،
وخُلطه على صنفٍ **يطبّق** `Comparable` بلا أن يمتدّ منه.

هل قُبل؟ وماذا يقول ذلك عن معنى `on` بالضبط — هل هو «يمتدّ من» أم شيءٌ أوسع؟

## الخلاصة

| ما رأيتَه | البديهية | أين يعود |
|---|---|---|
| الـmixin نوعٌ يحمل تطبيقاً وحالة | الأولى — كل شيء كائن | ٠٩ |
| `with` تبني سلسلةً خطّية | لا وراثة متعدّدة (٠٠) | ١١ |
| `super` تعني الحلقة التي تحت | حسابٌ لا اصطلاح | — |
| `on` عقدٌ في الاتّجاهين | الثانية — يُفحَص ترجمةً | ٠٩ |
| لا بانِيَ في mixin | ترتيب البناء (٠٦) | — |

## البذرة

`Counting` أعلاه تعدّ `int`. واكتب الآن `mixin Counting<T>` تخزّن آخر قيمةٍ
مضافة، وخُلطها على `Door` بـ`String` وعلى `Window` بـ`int`.

ثم اطبع `Door().runtimeType` و`d is Counting<String>` و`d is Counting<int>`.

**السطر الأخير سيقول `false`** — والأنواع باقيةٌ حيّة كما في الإقليم ٠٠. لكن
جرّب بعدها إسناد `Counting<String>` إلى متغيّرٍ من نوع `Counting<Object>`، ثم
استدعِ عليه ما يكتب.

في تلك اللحظة بالذات ينفجر شيء. والإقليم ٠٩ يقول أين زُرع الفحص، ولماذا اختارت
Dart أن تدفع ثمنه.
