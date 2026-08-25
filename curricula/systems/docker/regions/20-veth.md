# الإقليم ٢٠ — `veth` بيدك

> نطاق الشبكة كان أحدَ سبعةٍ مررتَ عليها في الإقليم ٠٢، ولم تفتحه. وهو الوحيد
> الذي **لا يكفي إنشاؤه**: الستّة الأخرى تعطيك نسخةً عاملة، وهذا يعطيك فراغاً.
>
> ومع ذلك تفتح `docker run` صفحةً على الإنترنت بلا أن تكتب شيئاً. هذه الحزمة
> تبني الطريق من الفراغ، بيدك، بلا Docker.

---

## نطاقٌ جديد لا يملك شيئاً

<!-- setup -->

```sh
for n in a b r z; do ip netns del $n 2>/dev/null; done
ip netns add z
```

<!-- lab -->

```sh
echo "addresses : $(ip netns exec z ip -o -4 addr show | wc -l)"
echo "routes    : $(ip netns exec z ip route | wc -l)"
echo "lo        : $(ip netns exec z ip -o link show lo | grep -o 'state [A-Z]*')"
```

<!-- gate -->

```
addresses : 0
routes    : 0
lo        : state DOWN
```

لا عنوان، ولا مسار، **وحتى الحلقة المحلّية معطّلة**. فالبرنامج الذي يحاول أن
يتّصل بنفسه على `127.0.0.1` داخل نطاقٍ كهذا يفشل.

**والمكسب:** «الحاوية لا تصل إلى الشبكة» ليست عطلاً واحداً بل ثلاثة أسئلة
منفصلة: أثمّة جهاز؟ أله عنوان؟ أثمّة مسار؟ وكلٌّ منها يُقرأ بأمرٍ واحد.

> و`ip netns` يبني نطاقاتٍ **مسمّاة**، تبقى بلا عمليةٍ فيها — وهي بالضبط آلية
> `docker network` التي رأيتَها في الإقليم ٠٢: inode يبقى حيّاً بجبلٍ يمسكه.

---

## الزوج: كابلٌ بطرفين

الجهاز الذي يصل نطاقين اسمه `veth`، ولا يُنشَأ فرداً أبداً. **يُنشَأ زوجاً:**

<!-- lab -->

```sh
ip netns add a; ip netns add r
ip link add va type veth peer name ra
ip link set va netns a
ip link set ra netns r
ip netns exec a ip -o link show va | awk '{print "in a  : " $2}'
ip netns exec r ip -o link show ra | awk '{print "in r  : " $2}'
ip netns exec a ip link del va
printf 'after deleting va, in r: '
ip netns exec r ip -o link show ra 2>&1 | head -1
```

<!-- gate -->

```
in a  : va@if…
in r  : ra@if…
after deleting va, in r: Device "ra" does not exist.
```

الاسم نفسه يقول العلاقة: `va@if14` أي «`va`، والطرف الآخر رقمه ١٤». وكلٌّ منهما
يشير إلى الآخر برقمه في نطاقه.

**وحذفُ طرفٍ حذفَ الطرفين.** لأنهما ليسا جهازين متّصلين؛ هما **جهازٌ واحد له
فوّهتان**: ما يدخل من إحداهما يخرج من الأخرى، بلا أسلاك ولا وسيط.

**والمكسب:** كل حاويةٍ عندك طرفُ زوج. والطرف الآخر في نطاق جهازك باسمٍ يبدأ
غالباً بـ`veth`. فإن رأيتَ عشرين منها في `ip link` فعندك عشرون حاوية — والاقتران
بينها وبينهنّ هو الرقم بعد `@if`.

---

## العناوين، وأوّل رزمة

<!-- setup -->

```sh
ip netns add b 2>/dev/null
ip link add va type veth peer name vb
ip link set va netns a
ip link set vb netns b
```

<!-- lab -->

```sh
ip netns exec a sh -c 'ip addr add 10.10.0.1/24 dev va; ip link set va up'
ip netns exec b sh -c 'ip addr add 10.10.0.2/24 dev vb; ip link set vb up'
ip netns exec a ip route
ip netns exec a ping -c1 -W1 10.10.0.2 > /dev/null 2>&1 \
	&& echo 'a -> b : reachable' || echo 'a -> b : unreachable'
```

<!-- out -->

```
10.10.0.0/24 dev va proto kernel scope link src 10.10.0.1 
a -> b : reachable
```

سطرُ المسار **لم تكتبه**. النواة أضافته وحدها لحظة أن أعطيتَ الجهاز عنواناً
بقناع `/24`: «كلُّ ما في `10.10.0.0/24` يُرسَل من هذا الجهاز مباشرةً، بلا
وسيط» — وهذا معنى `scope link`.

**والمكسب:** الشبكة المحلّية ليست إعداداً؛ هي **نتيجة القناع**. ولهذا يكفي عنوانان
في نفس النطاق ليتكلّم طرفان، ولهذا لا يكفيان إن اختلف النطاق — وهو موضوع الفقرة
التالية.

---

## التوجيه: موجّهٌ في المنتصف

ضع `b` في نطاقٍ آخر (`10.20.0.0/24`)، واجعل `r` بينهما بطرفٍ في كلٍّ منهما.
**العنوانان صحيحان، والكابلان موصولان. فهل تصل الرزمة؟**

<!-- setup -->

```sh
ip netns exec a ip link del va 2>/dev/null
ip link add va type veth peer name ra; ip link set va netns a; ip link set ra netns r
ip link add vb type veth peer name rb; ip link set vb netns b; ip link set rb netns r
ip netns exec a sh -c 'ip addr add 10.10.0.1/24 dev va; ip link set va up
                       ip route add default via 10.10.0.254'
ip netns exec b sh -c 'ip addr add 10.20.0.1/24 dev vb; ip link set vb up
                       ip route add default via 10.20.0.254'
ip netns exec r sh -c 'ip addr add 10.10.0.254/24 dev ra; ip link set ra up
                       ip addr add 10.20.0.254/24 dev rb; ip link set rb up'
```

<!-- lab -->

```sh
t() {
	ip netns exec a ping -c1 -W1 10.20.0.1 > /dev/null 2>&1 \
		&& echo 'a -> b reachable' || echo 'a -> b unreachable'
}
ip netns exec r sysctl -qw net.ipv4.ip_forward=0
echo "ip_forward=0 : $(t)"
ip netns exec r sysctl -qw net.ipv4.ip_forward=1
echo "ip_forward=1 : $(t)"
```

<!-- gate -->

```
ip_forward=0 : a -> b unreachable
ip_forward=1 : a -> b reachable
```

لم يتغيّر كابلٌ ولا عنوانٌ ولا مسار. **الرزمة كانت تصل إلى `r` في الحالتين**،
وفي الأولى تُلقى.

لأن استقبال رزمةٍ ليست لك ثم إخراجها من جهازٍ آخر **قرارٌ لا يُتّخَذ ضمناً**:
هو تحويل الجهاز من مضيفٍ إلى موجّه. والنواة تشترط أن يُطلَب صراحةً، لكل نطاق
شبكةٍ على حدة.

**والمكسب:** هذا السطر بعينه هو ما يكتبه Docker على جهازك عند أوّل تشغيل. وحين
تتعطّل شبكةُ حاوياتك بعد تحديثٍ أو بعد أن «نظّف» أحدُهم إعدادات النواة، فهذا
أوّل ما يُقرأ — قبل الجسر، وقبل `iptables`، وقبل كل شيء.

---

## التمرين — اثنان، ولا حلول

**١.** أضف نطاقاً ثالثاً `c` في `10.30.0.0/24` موصولاً بـ`r`، **بلا** أن تضيف
مساراً افتراضياً فيه، ثم جرّب `a -> c` و`c -> a`. **معيار القبول:** أيُّ
الاتّجاهين نجح، وسطرٌ يقول لماذا — مسنداً إلى مسار **الردّ** لا مسار الطلب.

**٢ (الأصعب).** صِل `a` و`b` مباشرةً بزوجٍ ثانٍ، فيصير بينهما طريقان.
**معيار القبول:** أمرٌ يُظهر أيَّ الطريقين اختارته النواة، وسطرٌ يقول على أي
أساسٍ اختارته — بلا أن تُشغّل أي بروتوكول توجيه.

---

## الخلاصة — أين نحن في الشجرة

| ما عرفتَه | العقدة التي يتعلّق بها |
|---|---|
| النطاق الجديد فراغٌ حتى الحلقة المحلّية | ثلاثة أسئلة لا عطلٌ واحد: جهاز · عنوان · مسار |
| `veth` جهازٌ واحد بفوّهتين | حذفُ طرفٍ يحذف الاثنين · و`@if` هو الاقتران |
| مسار الشبكة المحلّية نتيجةُ القناع | لا يُكتَب، ويظهر لحظةَ العنوان |
| `ip_forward` قرارٌ صريح لكل نطاق | أوّل ما يُقرأ حين تتعطّل شبكة الحاويات |

> **البذرة:** وصلتَ نطاقين بكابل، وثلاثةً بموجّه. فماذا لو كانت عشرين؟ عشرون
> كابلاً إلى الموجّه، وعشرون عنواناً، وعشرون مساراً؟
>
> Docker لا يفعل ذلك. يصنع **جهازاً واحداً** تنتهي عنده كل الأطراف، ويكتب فوقه
> قواعد تجعل الحاوية تصل إلى الإنترنت بعنوانٍ ليس لها.
>
> والإقليم القادم يقرأ تلك القواعد سطراً سطراً، في جدارك أنت.
