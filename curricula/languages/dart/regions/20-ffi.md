# الإقليم ٢٠ — FFI

> هنا يلتقي هذا المنهج بمنهج C التقاءً كاملاً.
>
> ففي الإقليم ١٢ قلتُ: **من يحرّر؟ الجامع.** وفي ١٩ رأيتَ أن `dart compile exe`
> يُنتج برنامجاً أصلياً كأي ناتج `cc`. وهذا الإقليم في الحدّ بينهما: **كيف تعبر
> القيمة، ومن يملكها بعد أن تعبر.**

## دالّةٌ واحدة، وثلاثة تصريحات

```c
#include <stdlib.h>
#include <string.h>

int add(int a, int b) { return a + b; }

unsigned char *make(int n) {
    unsigned char *p = malloc(n);
    for (int i = 0; i < n; i++) p[i] = (unsigned char)(i * 3);
    return p;
}

void release(unsigned char *p) { free(p); }

int sum(const unsigned char *p, int n) {
    int s = 0;
    for (int i = 0; i < n; i++) s += p[i];
    return s;
}
```

```dart
import 'dart:ffi';

typedef AddC = Int32 Function(Int32, Int32);
typedef AddDart = int Function(int, int);

void main() {
  final lib = DynamicLibrary.open('./libnative.dylib');
  final add = lib.lookupFunction<AddC, AddDart>('add');
  print('add(3, 4) = ${add(3, 4)}');
}
```

<!-- shell -->

```
$ cc -shared -fPIC -o libnative.dylib native.c
$ dart run main.dart
add(3, 4) = 7
```

**ثلاثة أشياء صرّحتَ بها لدالّةٍ واحدة:**

`AddC` توقيعُ الدالّة **كما تراها C**: `Int32` نوعٌ في `dart:ffi` يصف بايتات
المعامل، وليس نوعاً تحمله قيمة.

`AddDart` توقيعُها **كما تراها أنت**: `int` عاديّ.

و`lookupFunction` تربط الاثنين وتبني الجسر.

**ولا شيء يفحص أن التصريح صادق.** كتبتُ `Int32` وقد يكون في C `long`، فيقرأ
الجسر أربع بايتاتٍ من ثمانٍ ويمرّ الأمر — **وهذه هي المنطقة التي تسقط فيها
البديهية الثانية كاملةً**. النوع لا يكذب داخل Dart؛ وعلى الحدّ، أنت الضامن.

## نافذةٌ على ذاكرةٍ لا يملكها الجامع

```dart
import 'dart:ffi';

typedef MakeC = Pointer<Uint8> Function(Int32);
typedef MakeDart = Pointer<Uint8> Function(int);
typedef ReleaseC = Void Function(Pointer<Uint8>);
typedef ReleaseDart = void Function(Pointer<Uint8>);
typedef SumC = Int32 Function(Pointer<Uint8>, Int32);
typedef SumDart = int Function(Pointer<Uint8>, int);

void main() {
  final lib = DynamicLibrary.open('./libnative.dylib');
  final make = lib.lookupFunction<MakeC, MakeDart>('make');
  final release = lib.lookupFunction<ReleaseC, ReleaseDart>('release');
  final sum = lib.lookupFunction<SumC, SumDart>('sum');

  final p = make(5);
  final view = p.asTypedList(5);
  print('نافذةٌ على ذاكرة C: $view');
  print('نوع النافذة: ${view.runtimeType}');

  view[0] = 100;
  print('sum بعد التعديل من Dart: ${sum(p, 5)}');

  release(p);
  print('حرّرتُ بيدي');
}
```

<!-- shell -->

```
$ cc -shared -fPIC -o libnative.dylib native.c
$ dart run main.dart
نافذةٌ على ذاكرة C: [0, 3, 6, 9, 12]
نوع النافذة: Uint8List
sum بعد التعديل من Dart: 130
حرّرتُ بيدي
```

**`asTypedList` لا تنسخ.** أعطتك `Uint8List` — وهو نوعٌ عرفتَه في الإقليم ٠٢ —
**نافذةً على البايتات التي حجزها `malloc`**. وكتابتك في العنصر الأول رآها `sum`:
المجموع صار مئةً وثلاثين.

**وهذا جواب بذرة الإقليم ١٦:** بايتات `Uint8List` مخزنٌ متّصلٌ له عنوان، وبايتات
الكائن رسمٌ يملكه الـruntime. ولذلك يعبر الأول الحدَّ بلا نسخ، ولا يعبره الثاني.

### الآلية

<!-- part -->

```
   ┌──────────── Dart heap ────────────┐   ┌──── C heap (malloc) ────┐
   │                                   │   │                         │
   │  Uint8List  ──── view ────────────┼───┼──▶ [00][03][06][09][0C] │
   │  (a header, no bytes of its own)  │   │                         │
   │                                   │   │                         │
   │  the GC may move / free THIS      │   │  the GC does not see    │
   │  header at any time               │   │  this AT ALL            │
   └───────────────────────────────────┘   └─────────────────────────┘

   free(p)  →  the C side is gone.
              the Dart-side view is still a valid object
              pointing at memory that is no longer yours.
```

## من يحرّر؟ — والجواب يُقاس

```dart
import 'dart:ffi';
import 'dart:io';

typedef MakeC = Pointer<Uint8> Function(Int32);
typedef MakeDart = Pointer<Uint8> Function(int);
typedef ReleaseC = Void Function(Pointer<Uint8>);
typedef ReleaseDart = void Function(Pointer<Uint8>);

int mb() => ProcessInfo.currentRss ~/ 1048576;

void main() {
  final lib = DynamicLibrary.open('./libnative.dylib');
  final make = lib.lookupFunction<MakeC, MakeDart>('make');
  final release = lib.lookupFunction<ReleaseC, ReleaseDart>('release');

  var m = mb();
  for (var i = 0; i < 20000; i++) {
    release(make(10000));
  }
  print('مع تحرير  : نمت ${mb() - m} م.ب');

  m = mb();
  for (var i = 0; i < 20000; i++) {
    make(10000);
  }
  print('بلا تحرير : نمت ${mb() - m} م.ب');
}
```

<!-- shell -->

```
$ cc -shared -fPIC -o libnative.dylib native.c
$ dart run main.dart
```

<!-- shell -->

```
مع تحرير  : نمت 0 م.ب
بلا تحرير : نمت 142 م.ب
```

*(الرقم الثاني من جهازٍ واحد. **والثابت أنه يكبر بلا حدّ**، والأول لا يكبر.)*

**الحلقة الثانية لا تحتفظ بالمؤشّر.** ولا متغيّر، ولا قائمة، ولا شيء يشير إليه —
وفي كل ما سبق من هذا المنهج كان ذلك كافياً ليموت الكائن.

**وهنا لا يموت شيء.** لأن الجامع يحرّر ما حجزه هو، وهذه البايتات حجزها `malloc`.
والـruntime لا يعرف بوجودها أصلاً.

**فالجواب:** من يحجز بـ`malloc` يحرّر بـ`free`، ولو كان النداء من Dart. **عادةُ C
تعود كاملةً عند هذا الحدّ.**

## الأدوات التي تضبطه

| | ما يفعل | متى |
|---|---|---|
| `calloc` / `malloc` من `package:ffi` | حجزٌ وتحريرٌ من جانب Dart | حين تملك أنت الحجز |
| `Arena` من `package:ffi` | يحرّر كل ما حُجز فيه عند نهاية نطاقه | نداءٌ فيه حجزٌ مؤقّت |
| `NativeFinalizer` | يستدعي دالّة تحريرٍ حين يموت كائنُ Dart المرافق | حين يملك C ويعيش طويلاً |
| `@Native` والتوليد | يربط بلا `lookupFunction` يدويّ | واجهةٌ كبيرة |

**و`Arena` هي الأقرب إلى `RAII`**: كتلةٌ تحجز فيها ما شئت، وتُحرَّر كلُّها عند
الخروج — نجاحاً أو استثناءً.

**و`NativeFinalizer` هي الجسر الوحيد بين الملكيّتين:** تُعلِّق كائن Dart على
ذاكرة C، فإذا مات الأول نُودي `free` على الثانية. **ولا تضمن التوقيت** — يقع حين
يرى الجامع، وقد لا يقع أبداً قبل انتهاء البرنامج.

## ما تفقده عند الحدّ

| البديهية | داخل Dart | عبر FFI |
|---|---|---|
| ١ · كل شيء كائن | كذلك | مؤشّراتٌ وبايتات |
| ٢ · النوع لا يكذب | مضمون | **أنت الضامن** — تصريحٌ خاطئ يمرّ |
| ٣ · لا ذاكرة مشتركة | مضمون | **مشتركةٌ فعلاً** بين الـisolates كلِّها |
| ٤ · `async` ليست خيطاً | كذلك | نداءٌ متزامنٌ **يحجب حلقة الأحداث** |
| ٥ · الضمانات لها وزن | كذلك | لا ضماناتٍ فلا وزن |

**والصفّان الثالث والرابع أخطر ما في الجدول.** بايتات `malloc` لا تعرف
الـisolates، فمؤشّرٌ مرّر إلى isolate آخر يشير إلى **الذاكرة نفسها** — وعاد
السباق الذي وعدت البديهية الثالثة بمنعه، بلا قفلٍ في اللغة يعينك.

**ونداء C طويل يوقف كل شيء**: لا حلقة أحداث، ولا مؤقّتات، ولا مجرًى. وعلاجه أن
تناديه من isolate عامل (الإقليم ١٦).

## التمرين

**١ — اكذب في التصريح.** غيّر `Int32` إلى `Int64` في تصريحٍ لدالّةٍ تأخذ `int` في
C، وشغّل.

هل اعترض أحد؟ ماذا طُبع؟ ثم اقلبها: `Int64` في C و`Int32` في التصريح. **أي
الاتّجاهين أخطر ولماذا؟**

**٢ — ابنِ المالك.** لُفَّ `make`/`release` في صنف Dart بحيث **لا يستطيع** مستعمله
أن يسرّب. اكتبه بثلاث صيغ: `Arena` · `NativeFinalizer` · وطريقة `dispose` صريحة.

أيّها يضمن التحرير؟ وأيّها يضمن **توقيته**؟ وأيّها يبقى صحيحاً لو رمى الكود
استثناءً في المنتصف؟

**٣ — أعِد السباق.** مرّر مؤشّراً واحداً إلى isolatين، واجعل كلاً منهما يكتب في
البايتات نفسها مليون مرّة.

هل اختلفت النتيجة بين تشغيلين؟ ثم اقرأ الإقليم ٠٠ من جديد — **أي بديهيةٍ خرقتَها،
وبأي سطر؟**

## الخلاصة

| ما رأيتَه | البديهية | أين يعود |
|---|---|---|
| ثلاثة تصريحاتٍ لدالّةٍ واحدة | حدّ الثانية | ٢١ |
| `asTypedList` نافذةٌ بلا نسخ | ٠٢ · ١٦ | ٢٢ |
| الجامع لا يرى ذاكرة C | ١٢ | ٢٢ |
| البديهيات الخمس تسقط عند الحدّ | — | ٢٢ |

## البذرة

كتبتَ في هذا الإقليم كوداً **لا يستطيع أي فحصٍ ساكن أن يحكم عليه**: تصريحٌ خاطئ
يمرّ، وتسريبٌ لا يراه الجامع، وسباقٌ لا يمنعه شيء.

فما الذي يبقى لك؟

الجواب هو الأداة التي لم يفتحها هذا المنهج بعد. اكتب ملفّاً في `test/` ينتهي
اسمه بـ`_test.dart`، وضع فيه ادّعاءً واحداً عن `release`، وشغّل `dart test`.

ثم اسأل: **كيف تختبر أن ذاكرةً حُرِّرت؟** لا يوجد `assert` لذلك.

والإقليم ٢١ يفكّك ما تقدّمه اللغة نفسها للاختبار، وأين تقف — وما الذي تقيسه بدل
أن تدّعيه.
