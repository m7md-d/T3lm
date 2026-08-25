# الإقليم ٢١ — الجسر وNAT

> وصلتَ نطاقين بكابل، وثلاثةً بموجّه. فماذا لو كانت عشرين؟ عشرون كابلاً إلى
> الموجّه، وعشرون عنواناً عليه، وعشرون مساراً.
>
> Docker لا يفعل ذلك. يصنع **جهازاً واحداً** تنتهي عنده كل الأطراف. وهذا الإقليم
> يبنيه بيدك، ثم يقرأ ما كتبه Docker في جدارك — ويجده السطر نفسه.

---

## جهازٌ واحد تنتهي عنده الأطراف

<!-- lab -->

```sh
ip link add br0 type bridge; ip link set br0 up
i=1
for n in a b c; do
	ip netns add $n
	ip link add v$n type veth peer name p$n
	ip link set v$n netns $n
	ip link set p$n master br0; ip link set p$n up
	ip netns exec $n sh -c "ip addr add 10.0.0.$i/24 dev v$n; ip link set v$n up"
	i=$((i + 1))
done
echo "ports         : $(ip -o link show master br0 | awk '{print $2}' | cut -d@ -f1 | tr '\n' ' ')"
echo "br0 addresses : $(ip -o -4 addr show br0 | wc -l)"
echo "a -> b        : $(ip netns exec a ping -c1 -W1 10.0.0.2 >/dev/null 2>&1 && echo ok || echo fail)"
echo "a -> c        : $(ip netns exec a ping -c1 -W1 10.0.0.3 >/dev/null 2>&1 && echo ok || echo fail)"
```

<!-- gate -->

```
ports         : pa pb pc 
br0 addresses : 0
a -> b        : ok
a -> c        : ok
```

ثلاثة نطاقاتٍ تتكلّم، **والجسر بلا عنوان واحد.**

وهذا هو الفرق عن الإقليم ٢٠: الموجّه كان يحتاج عنواناً في كل شبكةٍ لأنه يعمل على
طبقة IP. والجسر **مفتاح**: ينقل الإطار من فوّهةٍ إلى أخرى بعنوان الجهاز
(MAC)، ولا يفتح الرزمة ولا يقرأ عنوان IP فيها ولا يعنيه أمرها.

**والمكسب:** لهذا لم يلزم `ip_forward` هنا. الأطراف الثلاثة في شبكةٍ واحدة، فلا
توجيه أصلاً — والذي يجري تبديلٌ لا تمرير.

---

## والمفتاح يتعلّم

الجسر لا يُعَدّ ولا يُبرمَج؛ يبني جدولَه من الحركة التي تمرّ به:

<!-- lab -->

```sh
ip netns exec b ping -c1 -W1 10.0.0.1 > /dev/null 2>&1
ip netns exec c ping -c1 -W1 10.0.0.1 > /dev/null 2>&1
MA=$(ip netns exec a ip -o link show va | grep -o 'ether [0-9a-f:]*' | cut -d' ' -f2)
echo "a's mac on port : $(bridge fdb show br br0 | awk -v m="$MA" '$1 == m {print $3}')"
echo "learned entries : $(bridge fdb show br br0 | grep -vc permanent)"
```

<!-- out -->

```
a's mac on port : pa
learned entries : 3
```

عنوان `a` الفيزيائيّ مقيّدٌ على الفوّهة `pa`، وكذلك أختاه. فحين يصل إطارٌ موجَّهٌ
إلى `a` يخرج من `pa` وحدها — لا من الثلاث.

**والمكسب:** حاويتان على شبكةٍ واحدة تتكلّمان **بلا أن تمرّ رزمةٌ على مكدّس IP
لجهازك**، وبلا أي قاعدة جدار. ولذلك لا يظهر هذا الاتّصال في `iptables` مهما
بحثتَ فيه.

---

## البوّابة: العنوان الذي يجعله موجّهاً

الأطراف تتكلّم بينها ولا تعرف الخارج. أعطِ الجسر عنواناً، فيصير له وجهٌ في تلك
الشبكة — وهنا فقط يصير جهازك موجّهها:

<!-- setup -->

```sh
ip addr add 10.0.0.254/24 dev br0
ip netns exec a ip route add default via 10.0.0.254
sysctl -qw net.ipv4.ip_forward=1
iptables -t nat -F POSTROUTING
```

<!-- lab -->

```sh
GW=$(ip route | awk '/^default/{print $3}')
t() { ip netns exec a ping -c1 -W1 "$GW" > /dev/null 2>&1 && echo reachable || echo unreachable; }
echo "a -> br0      : $(ip netns exec a ping -c1 -W1 10.0.0.254 >/dev/null 2>&1 && echo reachable || echo unreachable)"
echo "a -> outside  : $(t)"
iptables -t nat -A POSTROUTING -s 10.0.0.0/24 ! -o br0 -j MASQUERADE
echo "after MASQUERADE : $(t)"
```

<!-- gate -->

```
a -> br0      : reachable
a -> outside  : unreachable
after MASQUERADE : reachable
```

الرزمة كانت تخرج، ولا تعود. لأنها تحمل مصدراً `10.0.0.1` — عنواناً **لا يعرفه
أحدٌ خارج جهازك**، فردُّه لا يجد طريقاً إليه.

و`MASQUERADE` يستبدل المصدر بعنوان الجهاز الخارج منه، ويحفظ الأصل في جدول تتبّعٍ
في النواة، فإذا عاد الردّ أعاد الاستبدال عكسياً. **فالحاوية تتكلّم بعنوانٍ ليس
لها، ولا تعلم.**

**والمكسب:** هذا سببُ أن الحاوية تصل إلى الإنترنت ولا يصل إليها أحد. الخروج
مترجَم، والدخول بلا ترجمةٍ لا يجد شيئاً — والفتحُ للدخول يحتاج قاعدةً ثانية،
وهي الإقليم القادم.

---

## وهذا بعينه ما كتبه Docker

<!-- host -->

```sh
docker run --rm --privileged --net=host t3lm-docker-lab sh -c '
	echo "ports on docker0 : $(ip -o link show master docker0 | wc -l)"
	iptables -t nat -S POSTROUTING | grep docker0'
```

<!-- gate @impl -->

```
ports on docker0 : …
-A POSTROUTING -o docker0 -m addrtype --src-type LOCAL -j MASQUERADE
-A POSTROUTING -s 172.17.0.0/16 ! -o docker0 -j MASQUERADE
```

قارِن السطر الأخير بما كتبتَه أنت قبل قليل:

```
-A POSTROUTING -s 10.0.0.0/24 ! -o br0     -j MASQUERADE    ← يدك
-A POSTROUTING -s 172.17.0.0/16 ! -o docker0 -j MASQUERADE  ← Docker
```

**قاعدةٌ واحدة، بشبكةٍ أخرى وجسرٍ آخر.** و`docker0` جسرٌ عاديّ كـ`br0` الذي
بنيتَه، وعدد فوّهاته عدد حاوياتك العاملة على الشبكة الافتراضية، وكلُّ فوّهةٍ منها
طرفُ زوجٍ طرفُه الآخر داخل حاوية.

**والمكسب:** لم يبقَ في شبكة Docker الافتراضية شيءٌ لم تبنِه بيدك. وما تراه في
`docker network create` ليس آليّةً جديدة — هو جسرٌ آخر بعنوانٍ آخر، وقاعدةُ
`MASQUERADE` ثالثة.

---

## التمرين — اثنان، ولا حلول

**١.** احذف قاعدة `MASQUERADE` وأضف بدلها `SNAT --to-source <عنوان جهازك>`.
**معيار القبول:** إثباتٌ أن الاتّصال ما زال يعمل، وسطرٌ يقول لماذا اختار Docker
الأولى رغم أن الثانية أسرع — مسنداً إلى ما يحدث حين يتغيّر عنوان جهازك.

**٢ (الأصعب).** أنشئ شبكةً ثانية بجسرٍ ثانٍ (`br1`، `10.1.0.0/24`) وضع فيها
نطاقاً، ثم جرّب الوصول بينه وبين `a`. **معيار القبول:** جوابٌ عمّا حدث بلا أي
قاعدةٍ إضافية، وسطرٌ يقول أي طبقةٍ منعته — مسنداً إلى ما رأيتَه في الإقليم ٢٠ عن
`ip_forward` وما رأيتَه هنا عن الجسر.

---

## الخلاصة — أين نحن في الشجرة

| ما عرفتَه | العقدة التي يتعلّق بها |
|---|---|
| الجسر مفتاحٌ بلا عنوان | حاويتان على شبكةٍ واحدة لا تظهران في `iptables` أبداً |
| الجدول يُبنى بالتعلّم لا بالإعداد | `bridge fdb` يقول أي فوّهةٍ لأي حاوية |
| العنوان على الجسر يجعل جهازك بوّابتها | وحينها فقط يلزم `ip_forward` |
| `MASQUERADE` يترجم المصدر ويحفظ الأصل | الخروج يعمل والدخول لا · بلا قاعدةٍ ثانية |

> **البذرة:** بنيتَ الخروج. وبقي الدخول: `-p 8080:80` سطرٌ تكتبه كل يوم،
> وبعده يصل الطلب من شبكتك إلى حاويةٍ عنوانها لا يعرفه أحد.
>
> ومعه سؤالان لا يجيبهما الشرح المعتاد: **لماذا يتجاوز هذا النشرُ جدارك الناريّ
> أحياناً؟** و**ما هذه العملية `docker-proxy` التي تراها أحياناً ولا تراها
> أحياناً؟**
