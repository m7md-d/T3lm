# الإقليم ٢٩ — Podman

> انتهت حزمة «من يشغّل» عند محرّكٍ واحد: `dockerd` يملك مقبساً، ومن وصل إليه
> صار جذراً كاملاً (الإقليم ٢٧). فماذا لو لم يكن هناك daemon أصلاً؟
>
> **يتطلّب هذا الإقليم Podman مثبَّتاً** — أداةٌ منفصلة، لا جزءاً من مختبر هذا
> المنهج. وعلى لينكس عارٍ تُستعمل مباشرةً؛ وتحت macOS أو Windows تحتاج آلةً
> افتراضيةً خاصّةً بها (`podman machine`) — منفصلةً عن آلة Docker Desktop إن
> كانت عندك، ولو كانت الآلية نفسها. اللوحات الآتية موسومةٌ حيث يختلف الموضعان.

---

## لا داعمة، ولا مقبس

<!-- host-setup @vm -->

```sh
podman machine ssh "systemctl --user stop podman.socket podman.service 2>/dev/null; true"
```

توقيفٌ مقصود: `podman.socket` خدمةُ توافقٍ اختيارية تحاكي مقبس Docker API
لمن يحتاجه (`DOCKER_HOST`)، **وليست جزءاً ممّا يُقاس هنا** — وهي نفسها مفعَّلة
بالتنشيط عند الطلب لا التشغيل الدائم، فإيقافها يضمن أن ما تراه بعدها أثرُ
`podman` نفسها لا أثر تلك الخدمة.

<!-- host-setup -->

```sh
podman rm -f pd29 > /dev/null 2>&1 || true
```

<!-- host @vm -->

```sh
podman machine ssh "
	ps -eo pid,cmd | grep -E 'conmon|/usr/bin/podman system' | grep -v grep \
		|| echo 'zero podman-related processes'
	podman run -d --name pd29 alpine:3.20 sleep 300 > /dev/null
	sleep 1
	echo \"podman client still running : \$(pgrep -x -c podman)\"
	CPID=\$(podman inspect pd29 --format '{{.State.Pid}}')
	PARENT=\$(awk '/^PPid/{print \$2}' /proc/\$CPID/status)
	echo \"container process's parent  : \$(tr '\0' ' ' < /proc/\$PARENT/cmdline | cut -c1-13)\""
```

<!-- gate @vm -->

```
zero podman-related processes
podman client still running : 0
container process's parent  : /usr/bin/conm
```

**قبل التشغيل: لا عملية واحدة.** لا داعمةٌ تنتظر، ولا مقبس، ولا شيء. و`podman
run -d` نفّذ طلبك ثم **عاد عميلُه صفراً**: لا وجود له بعد أن انتهى أمرك، مثل
`runc` تماماً بعد `start` (الإقليم ٢٥).

والذي أصبح أباً لعمليتك ليس داعمةً بل `conmon` — ولها واحدةٌ **لكل حاوية**، لا
واحدةٌ للنظام كلِّه.

**والمكسب:** قارن هذا بحزمة العمليات التي رأيتَها على جهازك في الإقليم ٢٦: عند
Docker عمليتان دائمتان (`dockerd`، `containerd`) تعملان سواءٌ شغّلتَ حاويةً أم
لا. وهنا لا شيء يعمل حتى تطلب.

---

## `conmon`: يُترَك يتيماً عمداً

<!-- host @vm -->

```sh
podman machine ssh "
	CPID=\$(podman inspect pd29 --format '{{.State.Pid}}')
	PARENT=\$(awk '/^PPid/{print \$2}' /proc/\$CPID/status)
	GRANDP=\$(awk '/^PPid/{print \$2}' /proc/\$PARENT/status)
	echo \"conmon's parent pid : \$GRANDP\"
	echo \"that process         : \$(tr '\0' ' ' < /proc/\$GRANDP/cmdline | cut -c1-9)\""
```

<!-- gate @vm -->

```
conmon's parent pid : 1
that process         : /usr/lib/
```

أبو `conmon` هو **العملية رقم ١**. وهذا ليس عطلاً؛ العميل الذي أطلقها انتهى،
فتيتّمت وتبنّتها `init` — نفس آلية الإقليم ٠٤ بعينها، لا آليّةً جديدة اخترعها
Podman.

ووظيفتها مثل وظيفة الحشوة (الإقليم ٢٦) بالضبط: تمسك طرفَي المخرَج، وتنتظر
موت الحاوية بـ`wait`، وتسجّل رمز خروجها لمن يسأل — لكنّ من يسألها هذه المرّة
عميلٌ يُطلَق من جديد في كل مرّة، لا داعمةٌ منتظِرة.

**والمكسب:** الطبقة التي حلّت محلّ `dockerd` + `containerd` + الحشوة ليست
شيئاً واحداً أثقل؛ هي **الحشوة وحدها**، وأبوها `init` مباشرةً بدل داعمةٍ
وسيطة.

---

## بلا جذرٍ افتراضاً — والمدى الذي بنيتَه بيدك

<!-- host @vm -->

```sh
podman machine ssh "
	echo 'inside the container:'
	podman exec pd29 id
	echo
	echo 'its uid_map:'
	podman exec pd29 cat /proc/self/uid_map"
```

<!-- gate @vm -->

```
inside the container:
uid=0(root) gid=0(root) groups=…

its uid_map:
         0        …          1
         1     100000    1000000
```

اقرأ السطرين الأخيرين، وقارنهما بما كتبتَه بيدك في الإقليم ١٩: سطرٌ واحد يُسنِد
رقمك الحقيقيّ إلى الصفر الداخليّ، وسطرٌ ثانٍ يفتح مدًى من `/etc/subuid`.
**هذا نفس التركيب بحرفه**، مطبَّقاً افتراضياً بلا أن تطلبه — لا خدمةٌ مميّزة
منحته، ولا أحد كتب `newuidmap` نيابةً عنك خارج جلستك أنت.

**والمكسب:** Podman لا يملك آليّةً بديلة لصلاحيّتك؛ يستعمل التركيب الذي بنيتَه
بنفسك، ويجعله الافتراض بدل أن يكون خياراً إضافياً.

---

## الشبكة: `pasta` — ثمنُ الإقليم ١٩ يظهر باسمه

<!-- host @vm -->

```sh
podman machine ssh "ps -eo pid,cmd | grep '[p]asta' | awk '{print \$1, \$2}'"
```

<!-- gate @vm -->

```
… /usr/bin/pasta
```

هذا هو **البديل** الذي وعدتَ به خاتمة الإقليم ١٩: لمّا فشل نقلُ طرف `veth`
إلى نطاق جهازك بلا جذر، قلتَ إن البديل «مكدّسُ شبكةٍ في مساحة المستخدم».
`pasta` هو ذلك المكدّس بعينه — عمليةٌ تقرأ رزم نطاق الحاوية وتعيد كتابتها
مقبساً عاديّاً على نطاقك، فتصل الحاوية إلى الشبكة بلا أن تلمس نطاق شبكة
جهازك إطلاقاً.

**والمكسب:** لا تناقض بين «بلا جذر» و«له شبكة». الثمن الذي تنبّأتَ به موجودٌ
باسمٍ ومكانٍ تراهما الآن.

---

## Quadlet: ملفٌّ واحد، وسطرا `systemctl`

<!-- host-setup @vm -->

```sh
podman machine ssh "
	podman rm -f pd29 > /dev/null 2>&1
	mkdir -p ~/.config/containers/systemd
	cat > ~/.config/containers/systemd/pd29.container <<'EOF'
[Container]
Image=docker.io/library/alpine:3.20
Exec=sleep 300

[Service]
Restart=always
EOF
	systemctl --user daemon-reload"
```

<!-- host @vm -->

```sh
podman machine ssh "
	systemctl --user start pd29.service
	sleep 1
	echo \"unit active : \$(systemctl --user is-active pd29.service)\"
	echo \"container   : \$(podman ps --filter name=pd29 --format '{{.Names}} {{.Status}}' | cut -c1-25)\"
	systemctl --user stop pd29.service
	sleep 1
	echo \"after stop  : \$(podman ps -a --filter name=pd29 -q | wc -l) containers named pd29\"
	rm -f ~/.config/containers/systemd/pd29.container
	systemctl --user daemon-reload"
```

<!-- gate @vm -->

```
unit active : active
container   : systemd-pd29 Up 1 second
after stop  : 0 containers named pd29
```

ملفّ `.container` بصيغة `ini`، لا YAML ولا مخطّط JSON خاصّ. **`daemon-reload`
حوّله إلى وحدة systemd حقيقية**، و`start` أنشأ الحاوية وشغّلها، و`stop` أزالها
معه — بلا `--rm` تكتبه أنت، لأن الوحدة المولَّدة تحمل أمر الحذف ضمنها.

**والمكسب:** systemd هنا لا يراقب الحاوية من الخارج؛ هو **مالكها**. دورةُ
حياتها جزءٌ من دورة حياة الوحدة، بنفس أدوات كل خدمةٍ أخرى على الجهاز:
`systemctl status`، و`journalctl -u`، و`Restart=always` سطرٌ عاديّ لا ميزةً
خاصّة بالحاويات.

---

## وما الذي يتغيّر حقّاً

راجع ما بقي كما هو، وما تغيّر:

**ثابت:** الصورة والحزمة (الإقليم ٢٤) بشكلهما نفسه — `podman pull` يسحب نفس
المانيفست الذي فككتَه في الإقليم ٠٩. والنطاقات والـcgroups نفسها بلا استثناء.
والمنفّذ من عائلة OCI نفسها — هنا `crun` لا `runc`، وكلاهما ينفّذ المواصفة
نفسها التي قرأتَها حقلاً حقلاً.

**تغيّر:** لا داعمة تعمل باستمرار. لا مقبسٌ واحد يملك كل الحاويات — فلا يوجد
سؤال «من يصل إلى المقبس» لأن كل مستخدمٍ يشغّل عملياته هو، بصلاحيّته هو،
وتُحاسَب على جلسته. وما كان في Docker خطوةً واحدةً من مستخدمٍ عاديّ إلى جذرٍ
كامل (الإقليم ٢٧) لا مكافئ له هنا: لا يوجد مقبسٌ تمنح عضويّته امتيازاً.

**والمكسب الأخير:** الفرق بين المحرّكين ليس في ما يشغّلانه — رأيتَ الحزمة
نفسها، والنطاقات نفسها، والمواصفة نفسها. الفرق **من يملك دورة الحياة**: خدمةٌ
مركزية واحدة، أم نظامُ init الذي يدير كل شيءٍ آخر على جهازك أصلاً.

---

## التمرين — اثنان، ولا حلول

**١.** شغّل حاويتين بـ`podman` في وقتٍ واحد، واقرأ شجرة العمليات كاملةً.
**معيار القبول:** رسمٌ نصّيّ يبيّن أباً مشتركاً بينهما إن وُجد، وسطرٌ يقول
لماذا لا يوجد أبٌ مشتركٌ **مخصَّص للحاويات** كما هو الحال مع `dockerd`.

**٢ (الأصعب).** فعّل `podman machine set --rootful` أو شغّل حاويةً بـ
`podman run --privileged`، وأعد فحص `uid_map` وقائمة القدرات من الإقليم ١٦.
**معيار القبول:** جوابٌ عمّا تغيّر بالضبط، وسطرٌ يقول أيَّ الحمايات في هذا
الإقليم سقطت أوّلاً — مسنداً إلى ما قِستَه لا إلى الاسم.

---

## الخلاصة — أين نحن في الشجرة

| ما عرفتَه | العقدة التي يتعلّق بها |
|---|---|
| لا عملية تعمل حتى تُطلَب، والعميل يخرج بعدها | قارِن بعمليتَي `dockerd`/`containerd` الدائمتين |
| `conmon` يتيمةٌ عمداً يتبنّاها `init` | نفس آلية الإقليم ٠٤، لا آليّةً جديدة |
| بلا جذرٍ افتراضاً = تركيب الإقليم ١٩ بعينه | نفس `uid_map`، مطبَّقاً بلا طلب |
| `pasta` هو ثمن الشبكة الذي وعد به الإقليم ١٩ | مكدّسٌ في مساحة المستخدم، لا نطاق جهازك |
| Quadlet يجعل systemd **مالك** دورة الحياة | لا مراقبةً من الخارج، بل وحدةٌ عادية |
| الحزمة والنطاقات والمواصفة كلُّها كما هي | الفرق في من يملك دورة الحياة، لا فيما يُشغَّل |

> **البذرة:** انتهت حزمة «من يشغّل» بكاملها. تعرف الآن الطريق من ملفّ JSON
> إلى عمليةٍ تعمل، بمحرّكين مختلفين تماماً في البنية ومتطابقين في كل ما تحتها.
>
> وبقي سؤالٌ لم تفتحه بعد: من أين تأتي تلك الصورة أصلاً؟ ليس من جهازك — من
> **سجلّ**، وواجهته أبسط ممّا تتخيّل: `curl` وحده، بلا `docker push` ولا أداةٍ
> خاصّة.
