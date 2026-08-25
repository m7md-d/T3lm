# الإقليم ٢٦ — الـshim وcontainerd

> `runc` ينشئ الحاوية ثم **يخرج**. فمن يمسك مخرَجها؟ ومن يعرف أنها ماتت؟ ومن
> يبقيها حيّةً حين تُحدَّث خدمةُ Docker وتُعاد تشغيلاً؟
>
> اقرأ شجرة العمليات، فالجواب فيها.

---

## `runc` ليس هناك

<!-- host-setup -->

```sh
docker rm -f sh26 > /dev/null 2>&1
docker run -d --name sh26 alpine:3.20 sleep 300 > /dev/null
```

<!-- host -->

```sh
P=$(docker inspect -f '{{.State.Pid}}' sh26)
docker run --rm --privileged --pid=host -e P="$P" t3lm-docker-lab sh -c '
	echo "container    : $(tr "\0" " " < /proc/$P/cmdline)"
	PP=$(awk "/^PPid/{print \$2}" /proc/$P/status)
	echo "its parent   : $(tr "\0" " " < /proc/$PP/cmdline | cut -c1-32)"
	GP=$(awk "/^PPid/{print \$2}" /proc/$PP/status)
	echo "grandparent  : pid $GP"
	echo "runc running : $(pgrep -c "^runc$" || true)"'
```

<!-- gate -->

```
container    : sleep 300 
its parent   : /usr/bin/containerd-shim-runc-v2
grandparent  : pid 1
runc running : 0
```

**صفرُ عمليات `runc`.** فعله انتهى بانتهاء `start` في الإقليم السابق، وخرج.

وأبو الحاوية عمليةٌ اسمها **shim** — «الحشوة». وأبوها هي: **العملية رقم واحد**،
لا `dockerd` ولا `containerd`.

**والمكسب:** هذا ليس تفصيلاً في الشجرة؛ هو **الجواب**. الحشوة يتيمةٌ متعمَّدة
(الإقليم ٠٤): أُنشئت ثم تُرك أبوها يموت فتبنّاها `init`. فموتُ الخدمة لا يمسّها،
وحاوياتك تبقى تعمل بينما تُحدَّث Docker وتُعاد تشغيلاً — وهذا هو `live-restore`،
وهو نتيجةُ الشجرة لا ميزةٌ مكتوبة.

---

## ما الذي تمسكه الحشوة

<!-- host -->

```sh
P=$(docker inspect -f '{{.State.Pid}}' sh26)
docker run --rm --privileged --pid=host -e P="$P" t3lm-docker-lab sh -c '
	PP=$(awk "/^PPid/{print \$2}" /proc/$P/status)
	tr "\0" "\n" < /proc/$PP/cmdline | sed "s/^/  /" | head -8'
```

<!-- out @impl -->

```
  /usr/bin/containerd-shim-runc-v2
  -namespace
  moby
  -id
  …
  -address
  /run/containerd/containerd.sock
```

ثلاثة وسائط تلخّص وظيفتها: **فضاءُ أسماء** تعمل فيه (`moby` هو فضاء Docker داخل
containerd)، و**معرِّف** الحاوية التي تخدمها، و**عنوان مقبس** تتكلّم عليه.

فهي واحدةٌ لكل حاوية، وتبقى ما بقيت: تمسك طرفَي مخرَجها فتصل السجلّات إلى مكانها،
وتنتظر موتها بـ`wait` فتعرف رمز خروجها، وتقدّمه لمن يسأل حين يسأل — ولو بعد أن
تكون الخدمة قد ماتت وعادت.

والحديث بينها وبين `containerd` يجري على **ttrpc**: نسخةٌ مصغَّرة من gRPC بلا
HTTP/2 ولا تفاوض، صُمِّمت لتكون صغيرةً في الذاكرة — لأنها تعمل **مرّةً لكل
حاوية**، فمئة حاويةٍ مئةُ نسخة.

**والمكسب:** حين ترى في `docker ps` حاويةً «تعمل» وقد ماتت خدمتُك، فليس ذلك
عطلاً. وحين يعود `dockerd` فيعرف رمز خروج حاويةٍ ماتت أثناء غيابه، فليس ذلك
سحراً — الحشوة كانت هناك.

---

## ومخزن المحتوى: البصمة التي حسبتَها بيدك

`containerd` يخزّن الصور لا في مجلّداتٍ بأسماء، بل بالطريقة التي فككتَها في
الإقليم ٠٩:

<!-- host -->

```sh
ID=$(docker image inspect alpine:3.20 -f '{{.Id}}' | cut -d: -f2)
docker run --rm --privileged --pid=host -e ID="$ID" t3lm-docker-lab \
	nsenter -t 1 -m -- sh -c '
	R=$(ls -d /var/lib/*containerd*/daemon | head -1)
	C=$R/io.containerd.content.v1.content/blobs/sha256
	echo "blobs in store : $(ls $C | wc -l)"
	echo "image id there : $([ -f $C/$ID ] && echo yes || echo no)"
	echo "sha256 == name : $([ "$(sha256sum < $C/$ID | cut -d" " -f1)" = "$ID" ] && echo yes || echo no)"
	head -c 39 $C/$ID; echo'
```

<!-- gate @impl -->

```
blobs in store : …
image id there : yes
sha256 == name : yes
{"manifests":[{"annotations":{"com.dock
```

**المعرِّف الذي يعرضه `docker images` هو اسمُ ملفٍّ على قرصك**، ومحتوى ذلك الملفّ
بصمتُه اسمُه. وهو هنا فهرسٌ متعدّد المعماريات — نفسُ البنية التي مشيتَ عليها في
الإقليم ٠٩ بعد `docker save`.

فلا فرق بين ما في الأرشيف وما في المخزن: **الشكل واحد**، لأنه شكل المواصفة لا
شكل الأداة.

**والمكسب:** `docker save` لا «يصدّر» شيئاً ولا يحوّل. يلفّ ما هو موجودٌ أصلاً
بهذا الشكل في `tar`. ولهذا كان سريعاً بلا سببٍ ظاهر.

---

## والـsnapshotters: أكثر من واحد

<!-- host -->

```sh
docker run --rm --privileged --pid=host t3lm-docker-lab nsenter -t 1 -m -- sh -c '
	ls $(ls -d /var/lib/*containerd*/daemon | head -1) | grep snapshotter'
docker rm -f sh26 > /dev/null
```

<!-- out @impl -->

```
io.containerd.snapshotter.v1.blockfile
io.containerd.snapshotter.v1.erofs
io.containerd.snapshotter.v1.native
io.containerd.snapshotter.v1.overlayfs
```

المترجم الذي أمسكتَه متلبّساً في الإقليم ١٠ — الذي حوّل `.wh.` إلى `c 0,0` —
**ليس واحداً**. هو واجهةٌ لها عدّة تنفيذات، ولكلٍّ منها مقايضته: `overlayfs` هو
الذي فككتَه، و`native` ينسخ الطبقات نسخاً بلا تركيب (بطيء، ويعمل في كل مكان)،
والبقيّة لصيغٍ ونوى أخرى.

**والمكسب:** حين يُقال «Docker يستعمل overlay» فذاك اختيارٌ من بين هذه، يظهر في
`docker info` بسطرٍ واحد (الإقليم ١٠). وتبديلُه لا يغيّر الصور ولا الحزم — لأن
الصورة بياناتٌ محايدة، والتركيب قرارُ المنفّذ.

---

## التمرين — اثنان، ولا حلول

**١.** شغّل حاويةً في الخلفية، ثم اقتل عملية الحشوة الخاصّة بها بـ`SIGKILL`
(لا الحاوية). **معيار القبول:** ما حدث للحاوية، وما يقوله `docker ps` بعدها،
وسطرٌ يقول من صار أبا عمليتها — مسنداً إلى `/proc/<pid>/status` مقروءاً.

**٢ (الأصعب).** ابحث في مخزن المحتوى عن **طبقةٍ** من صورةٍ عندك (لا الفهرس ولا
الـmanifest)، وتحقّق أنها مضغوطة، ثم احسب `diff_id` منها. **معيار القبول:**
مطابقةٌ لما في `config` تلك الصورة، وسطرٌ يقول لماذا لم يلزمك `docker save` هذه
المرّة.

---

## الخلاصة — أين نحن في الشجرة

| ما عرفتَه | العقدة التي يتعلّق بها |
|---|---|
| `runc` ينتهي، والحشوة تبقى | صفرُ عمليات `runc` مع حاوياتٍ تعمل |
| الحشوة يتيمةٌ متعمَّدة، أبوها `init` | `live-restore` نتيجةُ شجرةٍ لا ميزةٌ مكتوبة |
| واحدةٌ لكل حاوية، تمسك المخرَج ورمز الخروج | ولذلك ttrpc لا gRPC: مئةُ حاويةٍ مئةُ نسخة |
| مخزن المحتوى ملفّاتٌ أسماؤها بصماتها | نفسُ شكل الإقليم ٠٩ · و`docker save` لفٌّ لا تحويل |
| الـsnapshotter واجهةٌ لا تنفيذاً واحداً | تبديله لا يمسّ الصور |

> **البذرة:** بقي `dockerd`. الحاوية تنشئها الحشوة، والصور يخزّنها `containerd`،
> والتركيب ينفّذه `runc`. **فما الذي بقي للخدمة التي يسمّيها الناس Docker؟**
>
> والإقليم القادم يتكلّم معها مباشرةً — بـ`curl` على مقبسٍ في نظام ملفّاتك، بلا
> أداة `docker` أصلاً.
