# الإقليم ٠٨ — overlayfs بيدك

> الفصل صفر قال: **الذي يعمل شجرةُ جبلٍ رُكّبت من الصورة، لا الصورة نفسها.**
> هذا الإقليم يبني تلك الشجرة بيدك — قبل أن تعرف من أين تأتي طبقاتها (الإقليم
> ٠٩) وكيف تُرتَّب تلقائياً (الإقليم ١٠) — لأن الآلية نفسها أبسط من أن تحتاج
> صورةً حقيقية لتُفهَم: ثلاثة مجلّداتٍ، وأمر `mount` واحد.

---

## ثلاثة مجلّدات، ووهمٌ رابع

<!-- lab -->

```sh
mount -t tmpfs t /tmp
mkdir -p /tmp/ov/lower /tmp/ov/upper /tmp/ov/work /tmp/ov/merged
echo "من الطبقة السفلى" > /tmp/ov/lower/a.txt
mount -t overlay overlay \
	-o lowerdir=/tmp/ov/lower,upperdir=/tmp/ov/upper,workdir=/tmp/ov/work \
	/tmp/ov/merged
ls /tmp/ov/merged
cat /tmp/ov/merged/a.txt
```

<!-- out -->

```
a.txt
من الطبقة السفلى
```

أربع أوسمة، وأربعة أدوار: **`lower`** للقراءة فقط ولا تُلمَس أبداً،
**`upper`** حيث تقع كل كتابةٍ فعلياً، **`work`** مساحة عمل النواة الداخلية
(لا تُقرأ، لا تُكتَب، لا تُفتَح — النواة وحدها تلمسها)، و**`merged`** —
الوهم: مجلّدٌ لا يحوي شيئاً بنفسه، يعرض تركيب الثلاثة الأخرى حيّاً.

---

## الكتابة أوّلاً: copy-up

<!-- lab -->

```sh
dd if=/dev/zero of=/tmp/ov/lower/big.bin bs=1M count=10 2>/dev/null
umount /tmp/ov/merged
mount -t overlay overlay \
	-o lowerdir=/tmp/ov/lower,upperdir=/tmp/ov/upper,workdir=/tmp/ov/work \
	/tmp/ov/merged
echo "upper قبل أي كتابة: $(du -sh /tmp/ov/upper | cut -f1)"
printf x | dd of=/tmp/ov/merged/big.bin bs=1 seek=0 count=1 conv=notrunc 2>/dev/null
echo "upper بعد تغيير بايتٍ واحد: $(du -sh /tmp/ov/upper | cut -f1)"
```

<!-- gate -->

```
upper قبل أي كتابة: 0
upper بعد تغيير بايتٍ واحد: 10M
```

> **توقّع قبل أن تشغّل:** ملفٌّ ١٠ ميغابايت، وتغيّر منه **بايتٌ واحد**. كم
> يكبر `upper`؟

**عشرة ميغابايت، لا بايتاً واحداً.** overlayfs لا يعرف «تعديلاً جزئياً» —
أوّل كتابةٍ إلى ملفٍّ يسكن `lower` فقط تنسخه **كاملاً** إلى `upper` أوّلاً
(copy-up)، ثم تقع الكتابة على النسخة الجديدة. من تلك اللحظة، `merged` يقرأ
هذا الملفّ من `upper` فقط — و`lower` صار غير ذي صلةٍ به تماماً.

**والثمن يتناسب مع حجم الملفّ لا حجم التعديل.** ملفّ سجلٍّ ضخم يُفتَح للكتابة
مرّةً واحدة (حتى لو لتذييل سطرٍ) يعني نسخ الملفّ كلَّه أوّلاً — وهذا يفسّر
نصيحةً شائعة: لا تُبقِ ملفّاتٍ كبيرة قابلةً للتعديل داخل صورةٍ إن كنت تكتب
إليها كثيراً.

---

## الحذف وهمٌ أيضاً: الـwhiteout

<!-- lab -->

```sh
echo محتوى > /tmp/ov/lower/b.txt
umount /tmp/ov/merged
mount -t overlay overlay \
	-o lowerdir=/tmp/ov/lower,upperdir=/tmp/ov/upper,workdir=/tmp/ov/work \
	/tmp/ov/merged
rm /tmp/ov/merged/b.txt
ls /tmp/ov/merged/b.txt 2>&1
ls -la /tmp/ov/upper/b.txt
```

<!-- out -->

```
ls: cannot access '/tmp/ov/merged/b.txt': No such file or directory
c--------- 2 root root 0, 0 … /tmp/ov/upper/b.txt
```

**الحذف لا يحذف من `lower` — يستحيل ذلك، فهي للقراءة فقط.** بدلاً من ذلك
يُنشئ overlayfs ملفّاً خاصّاً في `upper` بنفس الاسم: **جهاز حرفٍ (`c`) بالرقمين
`0, 0`** — قيمةٌ لا يحملها أي جهازٍ حقيقيّ أبداً، فهي إشارةٌ لا وظيفة. حين
يبني overlayfs عرض `merged`، رؤية هذا الجهاز عند اسمٍ يعني: **أخفِ ما بهذا
الاسم من أي طبقةٍ أدنى**، مهما وُجد.

**والحذف الحقيقيّ لملفّ `lower` مستحيل من خلال `merged` أصلاً** — `lower`
كاملةً للقراءة فقط، ولن يقبل النظام أي كتابةٍ مباشرةً إليها.

---

## استبدال مجلّدٍ كامل: الـopaque

الـwhiteout يخفي **ملفّاً واحداً**. ماذا لو حذفتَ مجلّداً كاملاً من `lower`
وأنشأتَ آخر بنفس الاسم؟

<!-- lab -->

```sh
mkdir -p /tmp/ov/lower/sub
echo قديم > /tmp/ov/lower/sub/old.txt
umount /tmp/ov/merged
mount -t overlay overlay \
	-o lowerdir=/tmp/ov/lower,upperdir=/tmp/ov/upper,workdir=/tmp/ov/work \
	/tmp/ov/merged
rm -rf /tmp/ov/merged/sub
mkdir /tmp/ov/merged/sub
echo جديد > /tmp/ov/merged/sub/new.txt
ls /tmp/ov/merged/sub
getfattr -d -m . /tmp/ov/upper/sub 2>&1 | grep opaque
```

<!-- out -->

```
new.txt
trusted.overlay.opaque="y"
```

**سطرٌ واحد فقط: `new.txt`.** لا أثر لـ`old.txt` القديم رغم أن `lower` لا يزال
يحمله بالكامل ولم يُمسّ. والسبب سمةٌ ممتدّة (`xattr`) على مجلّد `sub` الجديد
في `upper`: `trusted.overlay.opaque=y` تعني **«لا تنظر إلى ما تحت هذا الاسم في
أي طبقةٍ أدنى، مهما كان»** — لا سطراً سطراً كما يفعل الـwhiteout، بل مجلّداً
كاملاً دفعةً واحدة. وهذا بالضبط ما يقع حين تستبدل صورةُ Docker مجلّداً كاملاً
بين طبقتين.

---

## التمرين — اثنان، ولا حلول

**١.** اجبل `overlay` بطبقتين سفليّتين (`lowerdir=/a:/b`، بنقطتين) بدل واحدة،
واجعل ملفّاً بنفس الاسم في كلتيهما بمحتوًى مختلف. **معيار القبول:** جملةٌ
واحدة تقول أيّتهما تفوز، مسندةً إلى ترتيب القائمة لا تخميناً.

**٢ (الأصعب).** أنشئ ملفّاً في `merged`، ثم **افصل** overlay (`umount`) واحذف
`upper` بالكامل، ثم أعد جبل overlay بـ`upper` فارغة جديدة. **معيار القبول:**
إثباتٌ أن الملفّ اختفى تماماً — لأن كل ما كان «حقيقياً» في هذا النظام سكن
`upper` وحدها.

---

## الخلاصة — أين نحن في الشجرة

| ما عرفتَه | العقدة التي يتعلّق بها |
|---|---|
| `merged` وهمٌ، `upper` الحقيقة الوحيدة | فسّر «الطبقة القابلة للكتابة» في أي شرحٍ سمعتَه عن Docker |
| copy-up ينسخ الملفّ كلَّه لا التعديل | فسّر لماذا الملفّات الكبيرة القابلة للتعديل مكلفة داخل صورة |
| الحذف جهاز وهميّ `0,0` لا إزالة | جواب: أين تذهب البايتات حين تحذف ملفّاً من حاوية؟ |
| الـopaque يخفي مجلّداً كاملاً بسمة | يفسّر لاحقاً استبدال طبقةٍ لمجلّدٍ كامل في صورة |

> **البذرة:** بنيتَ هذا يدوياً بثلاثة مجلّدات عاديّة. الصورة الحقيقية التي
> يسحبها `docker pull` ليست مجلّدات — هي **أرشيفاتٌ مضغوطة، معنونةٌ ببصمتها**،
> يجب أن تُفكَّ إلى شكلٍ يشبه `lower`/`lower`/`lower` بالضبط قبل أن يصل
> overlayfs إليها.
>
> الإقليم القادم يفكّك تلك الأرشيفات بيدك، حتى القاع.
