# الإقليم ٢٤ — مواصفة OCI

> كتبتَ في الإقليم الأوّل عازلاً في ثمانيةٍ وتسعين سطراً، وقيل لك إنه ناقص. وقد
> رأيتَ منذ ذلك الحين ما ينقصه: القدرات، والمرشّح، والأقنعة، والحدود، والجبول.
>
> فمن جمع القائمة الكاملة؟ **مواصفةٌ مكتوبة**، وشكلُها ملفُّ JSON واحد. هذا
> الإقليم يقرأه حقلاً حقلاً، ثم يقيس ما بينه وبين `box` بالضبط.

---

## الحزمة: مجلّدٌ وملفّ

الوحدة التي تعرفها المواصفة اسمها **bundle**، وليست صورةً ولا أرشيفاً:

<!-- host-setup -->

```sh
rm -rf .lab/rootfs && mkdir -p .lab/rootfs
cid=$(docker create alpine:3.20)
docker export "$cid" | tar -x -C .lab/rootfs
docker rm "$cid" > /dev/null
```

<!-- lab -->

```sh
mkdir -p /tmp/b24 && cd /tmp/b24
runc spec
cp -r /lab/work/rootfs .
echo "bundle    : $(ls | tr '\n' ' ')"
echo "spec      : $(jq -r .ociVersion config.json), $(wc -l < config.json) lines"
echo "top keys  : $(jq -r 'keys | join(" ")' config.json)"
```

<!-- gate -->

```
bundle    : config.json rootfs 
spec      : 1.2.0, … lines
top keys  : hostname linux mounts ociVersion process root
```

**مجلّدٌ اسمه `rootfs`، وملفٌّ اسمه `config.json`.** لا وسم، ولا طبقات، ولا
بصمة، ولا سجلّ. كلُّ ما بنيتَه في حزمة الجذر (الأقاليم ٠٨–١١) كان **طريقاً إلى
هذه الحزمة** — والصورة تُفكَّك وتُركَّب لتصير مجلّداً كهذا، ثم تنتهي مهمّتها.

وستّة مفاتيح لا أكثر: `root` أين الشجرة، و`process` ماذا يُنفَّذ ومن يكون،
و`mounts` ماذا يُجبَل، و`hostname`، و`linux` كلُّ ما يخصّ هذه النواة، و`ociVersion`.

**والمكسب:** «الصورة» و«الحاوية» مفهوما أدوات. أمّا الذي يُشغَّل فعلاً فحزمةٌ
كهذه — ومن يشغّلها لا يعرف عن السجلّات والأوسام شيئاً.

---

## النطاقات مكتوبةً بدل أعلامٍ في `clone`

في `box` كانت قائمةً من الأعلام:

<!-- part: 01-box.c -->

```c
	int p = clone(child, sp + STACK,
	              CLONE_NEWNS | CLONE_NEWPID | CLONE_NEWUTS |
	              CLONE_NEWIPC | CLONE_NEWNET | SIGCHLD, &j);
```

**وفي المواصفة قائمةٌ من الأسماء. فأيُّها فيها؟**

<!-- lab -->

```sh
cd /tmp/b24
jq -r '.linux.namespaces[].type' config.json | sort | tr '\n' ' '; echo
echo "count : $(jq '.linux.namespaces | length' config.json)"
```

<!-- gate -->

```
cgroup ipc mount network pid uts 
count : 6
```

ستّة. خمسةٌ منها هي أعلامُ `box` نفسها، وسادسٌ لم تضعه: `cgroup` — وهو الذي
حسمتَ لغزه في الإقليم ١٢.

**وسابعُها غائب: `user`.** فالحزمة الافتراضية تعمل بجذرٍ حقيقيّ، وإضافةُ ذلك
النطاق هي بالضبط ما بنيتَه في `06-userbox.c` وما يجعل التركيب بلا جذر ممكناً
(الإقليم ١٩).

**والمكسب:** الفرق بين `box` والمواصفة هنا ليس في القدرة، بل في **الشكل**:
البرنامج يصف العزل بكودٍ يُترجَم، والمواصفة تصفه ببيانات تُقرأ. ولذلك يمكن أن
تُوقَّع الحزمة وتُنقَل وتُقارَن — ولا يمكن ذلك بكود.

---

## وتُشغَّل

<!-- lab -->

```sh
cd /tmp/b24
jq '.process.terminal = false
    | .process.args = ["/bin/sh", "-c", "hostname; id -u; echo pid=$$"]' \
	config.json > c2 && mv c2 config.json
runc --root /tmp/rc24 run b1
```

<!-- out -->

```
runc
0
pid=1
```

اسمُ مضيفٍ من `hostname` في الملفّ، ومستخدمٌ من `process.user`، ورقمُ عمليةٍ
واحد — ولا سطرَ C كتبتَه.

---

## وما كان ينقص `box` بالضبط

شغّل **نفس الفحص** تحت الاثنين:

<!-- setup -->

```sh
gcc -O0 -o /tmp/box programs/01-box.c
cat > /tmp/probe.sh <<'EOS'
bits() {
	awk -v h="$1" 'BEGIN{n=0;for(i=1;i<=length(h);i++){d=index("0123456789abcdef",substr(h,i,1))-1;while(d){n+=d%2;d=int(d/2)}}print n}'
}
echo "capabilities : $(bits $(awk '/CapEff/{print $2}' /proc/self/status))"
echo "no_new_privs : $(awk '/NoNewPrivs/{print $2}' /proc/self/status)"
echo "mounts       : $(wc -l < /proc/self/mountinfo)"
echo "/proc/kcore  : $([ "$(stat -c %s /proc/kcore)" = 0 ] && echo masked || echo visible)"
EOS
cp /tmp/probe.sh /lab/work/rootfs/probe.sh
cp /tmp/probe.sh /tmp/b24/rootfs/probe.sh
```

<!-- lab -->

```sh
echo '--- box ---'
/tmp/box /lab/work/rootfs /bin/sh /probe.sh
echo '--- runc ---'
cd /tmp/b24
jq '.process.args = ["/bin/sh", "/probe.sh"]' config.json > c2 && mv c2 config.json
runc --root /tmp/rc24 run b2
```

<!-- gate -->

```
--- box ---
capabilities : 41
no_new_privs : 0
mounts       : 3
/proc/kcore  : visible
--- runc ---
capabilities : 3
no_new_privs : 1
mounts       : 18
/proc/kcore  : masked
```

أربعة أسطرٍ تقول الفرق كلَّه. `box` عزل ما **تراه** العملية عزلاً كاملاً، وترك
ما **تستطيع أن تفعله** مفتوحاً على آخره: واحدٌ وأربعون قدرة، وبلا راية، وثلاثة
جبول، و`/proc/kcore` مكشوف.

فالعزل الذي بنيتَه صحيحٌ وناقص. والنقص ليس في النطاقات — هي هي — بل في الطبقات
التي لا تعرفها النطاقات.

**والمكسب:** «حاويتي معزولة» جملةٌ عن النطاقات وحدها. وما بين `41` و`3` هو
المسافة بين العزل والحصر، وقد قطعتَها في حزمة الامتياز.

---

## الحقول التي لم تكن تعرف أنها موجودة

<!-- lab -->

```sh
cd /tmp/b24
echo "maskedPaths      : $(jq '.linux.maskedPaths | length' config.json)"
echo "readonlyPaths    : $(jq '.linux.readonlyPaths | length' config.json)"
echo "mounts           : $(jq '.mounts | length' config.json)"
echo "capability sets  : $(jq -r '.process.capabilities | keys | join(" ")' config.json)"
echo "bounding         : $(jq -r '.process.capabilities.bounding | join(" ")' config.json)"
echo "resources        : $(jq -r '.linux.resources | keys | join(" ")' config.json)"
```

<!-- out -->

```
maskedPaths      : 10
readonlyPaths    : 5
mounts           : 7
capability sets  : ambient bounding effective permitted
bounding         : CAP_AUDIT_WRITE CAP_KILL CAP_NET_BIND_SERVICE
resources        : devices
```

اقرأها بعينَي الأقاليم السابقة: **الأقنعة العشر** هي الإقليم ١٨، و**الأطقم
الأربعة** هي الإقليم ١٦، و`resources` هي حزمة الحدّ كلُّها (١٢–١٥)،
و`maskedPaths` مكتوبةٌ هنا **قائمةَ مساراتٍ** لا جبولاً — والذي يحوّلها إلى جبول
هو المنفّذ لا المواصفة.

**والمكسب:** المواصفة **بيانات، والسلوك في المنفّذ**. ولهذا كان سؤال الفصل صفر
«من قرّر؟» يحتاج جواباً من خمسة: النواة، أم المواصفة، أم الأداة، أم التوزيعة،
أم الآلة الافتراضية. وهذا الملفّ هو الطبقة الثانية منها بعينها.

---

## التمرين — اثنان، ولا حلول

**١.** أضف نطاق مستخدمين إلى `config.json` مع خريطةٍ صحيحة، وشغّل الحزمة بصفتك
مستخدماً عاديّاً. **معيار القبول:** الحزمة تعمل، ورسالةُ الخطأ الأولى التي
واجهتك قبل أن تصحّح — وسطرٌ يقول أيُّ الحقول الأخرى **يجب** أن يتغيّر معها.

**٢ (الأصعب).** احذف `linux.maskedPaths` كلَّها من الملفّ وأعد التشغيل، ثم اقرأ
`/proc/kcore` و`/proc/self/mountinfo`. **معيار القبول:** الفرق في عدد الجبول
رقماً، وسطرٌ يقول لماذا لم يتغيّر شيءٌ في النطاقات رغم أن ما تراه العملية تغيّر.

---

## الخلاصة — أين نحن في الشجرة

| ما عرفتَه | العقدة التي يتعلّق بها |
|---|---|
| الوحدة المشغَّلة حزمة: `rootfs` + `config.json` | الصورة طريقٌ إليها، لا هي |
| النطاقات أسماءٌ في بيانات لا أعلامٌ في كود | ولذلك تُوقَّع وتُنقَل وتُقارَن |
| `user` غائبٌ من الحزمة الافتراضية | وإضافتُه هي التركيب بلا جذر |
| `box` عزل ما تراه وترك ما تفعله | `41` مقابل `3` هي المسافة كلُّها |
| المواصفة بيانات، والسلوك في المنفّذ | `maskedPaths` قائمةٌ، والجبول قرارُ `runc` |

> **البذرة:** الملفّ بياناتٌ لا تفعل شيئاً. والذي يقرؤها ويصنع منها عمليةً هو
> `runc` — وقد شغّلتَه للتوّ بأمرٍ واحد.
>
> لكنّ ذلك الأمر الواحد ليس ما تستعمله الأدوات. هي تنادي `create` ثم `start`
> منفصلين، ولذلك سببٌ دقيق. وفي `runc` عمليةٌ ثانية اسمها `runc init` تعيد تنفيذ
> نفسها في المنتصف — ولذلك سببٌ **أُضيف بعد ثغرةٍ حقيقية** ما زال تصميمُ اليوم
> قائماً عليها.
