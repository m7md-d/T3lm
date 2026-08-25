# الإقليم ٢٧ — dockerd

> الحاوية أنشأتها الحشوة، والصور يخزّنها containerd، والتركيب نفّذه `runc`
> ثم خرج. **فما الذي بقي لـ`dockerd`؟**
>
> والجواب — وهو المفاجأة — أنه لا يلمس أياً ممّا رأيتَه. `dockerd` واجهةٌ فوق
> كل ذلك، ومقبسٌ واحد، وقرارُ من يُسمَح له أن يتكلّم عليه.

---

## الأداة `docker` عميلٌ لا أكثر

كل أمرٍ كتبتَه في هذا المنهج مرّ عبر واجهةٍ HTTP على مقبس يونكس. اكتب الطلب
بيدك، بلا الأداة أصلاً:

<!-- host -->

```sh
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock t3lm-docker-lab sh -c '
	S=/var/run/docker.sock
	echo "ping    : $(curl -s --unix-socket $S http://localhost/_ping)"
	curl -s --unix-socket $S http://localhost/version \
		| jq -r "\"engine  : \(.Version)\", \"api     : \(.ApiVersion)\""'
```

<!-- gate @impl -->

```
ping    : OK
engine  : …
api     : …
```

لا `docker` هنا — `curl` وحده، على مسارٍ عاديّ في نظام ملفّاتك: `/var/run/docker.sock`.
والأداة التي تطبع لك جداول جميلة تفعل هذا بعينه خلف الكواليس: تبني طلب HTTP،
وترسله على هذا المقبس، وتنسّق الجواب.

**والمكسب:** `docker` استبدالها ممكنٌ بأي عميل HTTP. وكلُّ ما تعلّمتَه عن الحاويات
في هذا المنهج — الأسماء، الحدود، الجبول — هو **حمولةُ JSON** ترسلها على هذا
المقبس، لا لغةً خاصّة بالأداة.

---

## وأنشئ حاويةً بيدك أيضاً

<!-- host -->

```sh
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock t3lm-docker-lab sh -c '
	S=/var/run/docker.sock
	curl -s --unix-socket $S -X POST -H "Content-Type: application/json" \
		-d "{\"Image\":\"alpine:3.20\",\"Cmd\":[\"echo\",\"made by curl\"]}" \
		"http://localhost/containers/create?name=api27" \
		| jq -r .Id | cut -c1-12 | sed "s/^/created : /"
	curl -s --unix-socket $S -X POST "http://localhost/containers/api27/start" \
		-o /dev/null -w "started : http %{http_code}\n"
	sleep 1
	curl -s --unix-socket $S "http://localhost/containers/api27/logs?stdout=1" \
		| tr -d "\0\1\2\3\4\5\6\7\10" | sed "s/^/output  : /"
	curl -s --unix-socket $S -X DELETE "http://localhost/containers/api27?force=1" \
		-o /dev/null -w "deleted : http %{http_code}\n"'
```

<!-- gate -->

```
created : …
started : http 204
output  : made by curl
deleted : http 204
```

أربعة طلبات HTTP: `POST /containers/create`، `POST …/start`، `GET …/logs`،
`DELETE`. وهي **نفس** الطلبات التي أرسلتها الأداة `docker` في كل أمرٍ كتبته منذ
الإقليم الأوّل.

---

## من يملك المقبس يملك كل شيء

**الاعتقاد، صريحاً:** المقبس يحتاج جذراً حقيقياً للوصول إليه، فمشاركتُه مع
مستخدمٍ عاديّ آمنة إن ضبطتَ الأذونات.

<!-- host -->

```sh
docker rm -f esc27 > /dev/null 2>&1
echo "socket owner : $(docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
	t3lm-docker-lab stat -c '%U:%G (gid=%g)' /var/run/docker.sock)"
echo "--- مستخدمٌ عاديّ حقاً، بلا جذر ---"
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -u 1000:1000 \
	t3lm-docker-lab sh -c '
		id
		curl -s --unix-socket /var/run/docker.sock http://localhost/_ping
		echo "rc=$?"'
echo "--- نفسه، وعضويةُ مجموعة المقبس فقط ---"
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -u 1000:0 \
	t3lm-docker-lab sh -c '
	id
	curl -s --unix-socket /var/run/docker.sock \
		http://localhost/containers/create?name=esc27 \
		-X POST -H "Content-Type: application/json" \
		-d "{\"Image\":\"alpine:3.20\",\"Cmd\":[\"cat\",\"/host/etc/hostname\"],\"HostConfig\":{\"Privileged\":true,\"Binds\":[\"/:/host\"]}}" \
		-o /dev/null -w "create: http %{http_code}\n"
	curl -s --unix-socket /var/run/docker.sock -X POST \
		http://localhost/containers/esc27/start -o /dev/null -w "start : http %{http_code}\n"
	sleep 1
	curl -s --unix-socket /var/run/docker.sock http://localhost/containers/esc27/logs?stdout=1 \
		| tr -d "\0\1\2\3\4\5\6\7\10" | sed "s/^/hostname on your machine: /"'
docker rm -f esc27 > /dev/null
```

<!-- gate @impl -->

```
socket owner : root:root (gid=0)
--- مستخدمٌ عاديّ حقاً، بلا جذر ---
uid=1000 gid=1000 groups=1000
rc=7
--- نفسه، وعضويةُ مجموعة المقبس فقط ---
uid=1000 gid=0(root) groups=0(root)
create: http 201
start : http 204
hostname on your machine: …
```

الفرقُ بين السطرين الأخيرين **عضويةُ مجموعةٍ واحدة**، ولا شيء غيرها. المستخدم
`1000` مُنِع تماماً بلا تلك العضوية، ونجح بها في أن يُنشئ حاويةً `Privileged`
تجبل `/` **جهازك بأكمله** ويقرأ منها.

فهذا ليس ثغرة؛ هو التصميم كما هو. `dockerd` نفسها تعمل جذراً، وأي طلبٍ يصل
مقبسها **موثوقٌ كأنه من الجذر** — لأن المقبس لا يفرّق بين طلبٍ يطلب `docker ps`
وطلبٍ يطلب `Privileged: true`.

**والمكسب — وهو خلاصة الإقليم:** عضويةُ «مجموعة docker» **مكافئةٌ لجذرٍ كامل
على الجهاز**، بخطوةٍ واحدة كما رأيتَ. وهذا ما قاله الفصل صفر منذ البداية، وما
قالته حزمة الامتياز حين رأيتَ مقبس `dockerd` بعينك مملوكاً للجذر (الإقليم ١٩).
والفرق أنك الآن **جرّبته**.

---

## التمرين — اثنان، ولا حلول

**١.** اقرأ توثيق نقطة `/containers/{id}/json` وابنِ منها فحصاً يعادل
`docker inspect --format '{{.State.Pid}}'` بـ`curl` و`jq` وحدهما.
**معيار القبول:** رقمُ عمليةٍ صحيح يطابق ما تعرضه الأداة، وسطرٌ يقول أي حقلٍ في
الجواب حمل الرقم.

**٢ (الأصعب).** جرّب الوصول إلى نقطة `/containers/create` **بلا** `Content-Type:
application/json`. **معيار القبول:** رمز الخطأ الذي عاد، ونصّ رسالته، وسطرٌ
يقول لماذا يشترط API صريحاً هذا الترويسة رغم أن الحمولة JSON دائماً.

---

## الخلاصة — أين نحن في الشجرة

| ما عرفتَه | العقدة التي يتعلّق بها |
|---|---|
| `docker` عميلُ HTTP، لا أكثر | كل أمرٍ كتبتَه طلبٌ يمكن كتابته بـ`curl` |
| المقبس لا يفرّق بين طلبٍ وطلب | لا مستوى صلاحيّةٍ داخل API — إمّا تصل أو لا تصل |
| عضويةُ مجموعة المقبس = جذرٌ كامل | خطوةٌ واحدة من مستخدمٍ عاديّ إلى `/` جهازك |
| `dockerd` واجهةٌ فوق ما بنيتَه، لا منفّذ | الحشوة تشغّل، وcontainerd يخزّن، وهي تنسّق |

> **البذرة:** رأيتَ الآن الطبقات الأربع من فوق: `docker` → `dockerd` →
> `containerd` → الحشوة → `runc`. وكلُّ طلبٍ يمرّ عبرها ينتهي عند سطرٍ واحد:
> إشارةٌ تُرسَل، أو ملفٌّ يُقرأ.
>
> فماذا يحدث بالضبط حين تكتب `docker stop`؟ أيّ إشارةٍ تُرسَل أوّلاً، ومتى تصير
> `SIGKILL`، وأين تذهب مخرجاتُك إن لم يكن هناك طرفيّة؟ الإقليم القادم يقيس دورة
> الحياة كلَّها من الإشارة الأولى إلى الحذف.
