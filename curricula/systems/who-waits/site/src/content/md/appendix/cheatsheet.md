# الورقة المرجعيّة

> تُفتح أثناء العمل، لا تُقرأ مرّةً واحدة. كل ما هنا **وصفٌ لعقود** لا حلول.

---

## ١) عقود الاستدعاءات الأساسيّة

| الاستدعاء | يُرجِع | الفخّ |
|---|---|---|
| `read(fd,buf,n)` | `>0` عدد ما قُرِئ · `0` نهاية · `-1` خطأ | **قد يُرجِع أقلّ من `n`.** لا يضع `\0` |
| `write(fd,buf,n)` | عدد ما كُتِب · `-1` | **قد يكتب أقلّ.** `SIGPIPE` يقتل العمليّة |
| `recv/send` | كسابقيهما | `MSG_NOSIGNAL` يمنع SIGPIPE؛ `MSG_PEEK` لا يستهلك |
| `readv/writev` | مجموع المنقول | عبورٌ واحدٌ لعدّة مخازن — مثالي للمخزن الحلقي |
| `accept4(fd,...,fl)` | واصفٌ جديد | مرّر `SOCK_NONBLOCK\|SOCK_CLOEXEC` ذرّيّاً؛ احذر `EMFILE` |
| `connect` (لا-حاصر) | `-1` + `EINPROGRESS` | انتظر `EPOLLOUT` ثم افحص `SO_ERROR` بـ`getsockopt` |
| `close(fd)` | `0`/`-1` | **ليست تسليماً.** بياناتٌ واردةٌ غير مقروءة ⇒ `RST` |
| `shutdown(fd,how)` | | `SHUT_WR` = نصف إغلاق: أرسل FIN وابقَ قارئاً |
| `fcntl(F_GETFL/F_SETFL)` | | نداءان ⇒ نافذة سباق؛ لا تدهس الأعلام |
| `epoll_wait` | عدد الأحداث | **لا يُستأنف** بـ`SA_RESTART` ⇒ عالج `EINTR` |
| `fsync(fd)` | `0`/`-1` | فشلها **لا يُعاد المحاولة عليه**؛ لا تشمل المجلّد |
| `rename(a,b)` | ذرّيّة داخل نفس FS | `EXDEV` عبر أنظمة ملفّات |
| `pwrite(fd,buf,n,off)` | | لا يحرّك الإزاحة ⇒ عديم الأثر ⇒ مثالي للاستئناف |
| `clock_gettime(MONOTONIC)` | | عبر vDSO (رخيص) — تحقّق من `clocksource` |

---

## ٢) `errno`: التصنيف الذي يقرّر التصرّف

| الصنف | القيم | التصرّف |
|---|---|---|
| **ليست خطأً** | `EINTR`, `EAGAIN`/`EWOULDBLOCK`, `EINPROGRESS` | أعِد / انتظر الجهوزيّة |
| **عابر** | `ENOBUFS`, `ENOMEM`, `EMFILE`\* | تراجعٌ وإعادة (\*`EMFILE` حالةٌ مستقرّة — عالجها بحيلة الواصف الاحتياطي) |
| **دائمٌ لهذا الاتصال** | `ECONNRESET`, `EPIPE`, `ETIMEDOUT`, `EHOSTUNREACH` | أغلق ونظّف |
| **مورد** | `ENOSPC`, `EDQUOT` | **كتابةٌ جزئيّةٌ محتملة**؛ أبلِغ، لا تفترض |
| **بقّةٌ عندك** | `EBADF`, `EFAULT`, `EINVAL` | أصلِح، لا تعالج |

قواعد: اقرأها **فوراً** بعد الفشل · لا تفحصها بعد نجاح · هي لكل خيط.

---

## ٣) حلقة الأحداث

```
   epoll_create1(EPOLL_CLOEXEC)
   epoll_ctl(ADD/MOD/DEL, fd, {events, data.ptr})
   epoll_wait(ep, evs, n, timeout_ms)
```

| العلم | المعنى |
|---|---|
| `EPOLLIN` / `EPOLLOUT` | قابلٌ للقراءة / الكتابة |
| `EPOLLERR` / `EPOLLHUP` | يصلانك **دائماً** ولو لم تطلبهما |
| `EPOLLRDHUP` | الطرف أغلق جهة الإرسال (نصف إغلاق) |
| `EPOLLET` | حافة ⇒ **اقرأ حتى `EAGAIN`** |
| `EPOLLONESHOT` | يُعطَّل بعد حدثٍ واحد ⇒ أعِد التسليح بـ`MOD` |
| `EPOLLEXCLUSIVE` | ضدّ الرعية المذعورة على المستمع |

**قواعد ذهبيّة:** كل الواصفات `O_NONBLOCK` · `EPOLLOUT` يُسجَّل عند الحاجة
ويُلغى فور التصريف · لا تُحرِّر داخل جولة الأحداث (إغلاقٌ مؤجّل + جيل).

**توحيد كل شيءٍ إلى واصف:**

| الغرض | الاستدعاء |
|---|---|
| مؤقّت | `timerfd_create(CLOCK_MONOTONIC, TFD_CLOEXEC\|TFD_NONBLOCK)` |
| إشارة | `sigprocmask(SIG_BLOCK)` **ثم** `signalfd` |
| إيقاظ | `eventfd(0, EFD_CLOEXEC\|EFD_NONBLOCK)` |
| تغيّر ملفّ | `inotify_init1` |
| صوت | `snd_pcm_poll_descriptors` |
| كاميرا | واصف `/dev/videoN` مباشرةً |

---

## ٤) خيارات المقبس

| الخيار | الأثر |
|---|---|
| `TCP_NODELAY` | يُطفئ Nagle ⇒ **إلزاميٌّ للتفاعل** (المحادثة/اللعبة/التحكّم) |
| `TCP_CORK` | يجمّع حتى تُفرِج ⇒ لنقل الملفّات |
| `SO_REUSEADDR` | `bind` رغم `TIME_WAIT` ⇒ للخوادم |
| `SO_REUSEPORT` | عدّة عمليّاتٍ على نفس المنفذ (توسّع) |
| `SO_SNDBUF`/`SO_RCVBUF` | النواة تضاعف ما تطلبه؛ اقرأ الفعلي بـ`getsockopt` |
| `SO_KEEPALIVE` + `TCP_KEEPIDLE/INTVL/CNT` | افتراضه ٧٢٠٠ث = عديم الفائدة |
| `SO_BROADCAST` | لازمٌ للبثّ المحلّي (الاكتشاف) |
| `IP_ADD_MEMBERSHIP` | الانضمام لمجموعة multicast |
| `SO_ERROR` (get) | الخطأ المؤجّل بعد `connect` غير الحاصر |

---

## ٥) الطرفيّة

**أعلام الوضع الخام** (أطفئها): `ICANON` `ECHO` `ISIG` `IEXTEN` `IXON`
`ICRNL` `OPOST` · واضبط `VMIN=1, VTIME=0` · و`TCSAFLUSH` عند التطبيق.
⚠️ مع `OPOST` مطفأ اكتب `\r\n` بنفسك.

**تسلسلات ANSI:**

| الغرض | التسلسل |
|---|---|
| موضع المؤشّر | `ESC[{row};{col}H` — **يبدأ من ١** |
| مسح الشاشة / السطر | `ESC[2J` / `ESC[2K` |
| إخفاء/إظهار المؤشّر | `ESC[?25l` / `ESC[?25h` |
| الشاشة البديلة | `ESC[?1049h` / `ESC[?1049l` |
| لونٌ حقيقي مقدّمة/خلفيّة | `ESC[38;2;R;G;Bm` / `ESC[48;2;R;G;Bm` |
| ٢٥٦ لوناً | `ESC[38;5;{n}m` |
| تصفير | `ESC[0m` |
| اللصق المحاط | `ESC[?2004h` ⇒ يحيط اللصق بـ`ESC[200~` … `ESC[201~` |
| الفأرة (SGR) | `ESC[?1000h` + `ESC[?1006h` |

**مفاتيح شائعة:** `ESC[A/B/C/D` = أعلى/أسفل/يمين/يسار · `ESC[H`/`ESC[F` =
Home/End · `ESC[{n}~` = وظائف · **`ESC` وحده ⇒ يُحلّ بمهلة ٢٥–٥٠ms عبر
`timerfd`**.

**الحجم:** `ioctl(fd, TIOCGWINSZ, &ws)` — لا متغيّرات البيئة · التغيّر عبر
`SIGWINCH` → `signalfd` · **أبطِل الشبكة المرجعيّة بعد التغيير**.

**التكلفة:** ~٣٩ بايتاً/خليّة بلونٍ حقيقيٍّ كامل · ٨٠×٢٤ ≈ ٧٥ك/إطار ⇒
الرسم التفاضلي + دمج السمات + `write` واحدة.

---

## ٦) الوقت واللعبة

```
   accumulator += now - last;  last = now;
   steps = 0;
   while (accumulator >= STEP && steps++ < MAX) { update(STEP); accumulator -= STEP; }
   alpha = accumulator / STEP;  render(lerp(prev, curr, alpha));
```

- `CLOCK_MONOTONIC` للفروق · `CLOCK_BOOTTIME` للمهلات عبر التعليق ·
  `CLOCK_REALTIME` للطوابع المطلقة فقط.
- عدّاد خطواتٍ `uint64_t` لا `float` تراكمي.
- `MAX` يمنع دوّامة الموت (الوقت الزائد يُرمى عمداً).
- ثابت الفاصلة للحتميّة · معرّف كيان = (فهرس، جيل).
- الطرفيّة **لا تعطي رفع مفتاح** ⇒ نيّةٌ ذات صلاحيّة ~١٥٠ms.

---

## ٧) مزامنة الحالة (netcode)

**ترويسة الحزمة:** `seq(16) | ack(16) | ack_bits(32) | tick | payload`

| التقنيّة | لمن | الثمن |
|---|---|---|
| استيفاء | الكيانات الأخرى | +١٠٠ms رؤية |
| تنبّؤ | لاعبك أنت | أخطاءٌ تحتاج تصحيحاً |
| مصالحة | تصحيح التنبّؤ | **يتطلّب حتميّة** |
| حساب ميّت | فجوةٌ قصيرة | قفزةٌ إن أخطأ ⇒ ضع سقفاً |
| تعويض تأخير | عدالة الإصابة | "متُّ خلف الجدار" |

نبضة خادمٍ ٢٠–٣٠Hz · تكميمٌ صريح لكل حقل · فرقٌ عن أساسٍ مؤكَّد + لقطةٌ
كاملةٌ عند التقادم · إدارة اهتمامٍ = نطاقٌ أقلّ + مقاومة غشّ.

**محاكاة شبكةٍ سيّئة:**
```
tc qdisc add dev lo root netem delay 100ms 30ms loss 5% reorder 2%
tc qdisc del dev lo root
```

---

## ٨) الوسائط

**V4L2:** `QUERYCAP` → `ENUM_FMT` → `S_FMT` (**اقرأ الراجع**) → `REQBUFS`
→ `QUERYBUF`+`mmap` → `QBUF`×N → `STREAMON` → [`DQBUF` … `QBUF`] →
`STREAMOFF`.
`bytesperline` ≠ `width×bpp` · الطابع من السائق لا من وقت الوصول ·
مخزنٌ مُدرَجٌ = ملك السائق · عدّة مخازن جاهزة ⇒ خذ **الأحدث**.

**الصيغ:** `YUYV` (4:2:2، ٢ب/بكسل) · `NV12`/`I420` (4:2:0، ١٫٥) · `MJPEG`
(مضغوطٌ من الكاميرا) · `RGB24` (٣).

**ALSA:** `snd_pcm_open` → `hw_params` (صيغة، معدّل، قنوات، period، buffer)
→ `prepare` → `readi/writei`. `period` = التأخير · `buffer` = الأمان ·
`xrun` = فات الموعد.

**الأرقام:** ٦٤٠×٤٨٠ YUYV@٣٠ = ١٨٫٤ م.ب/ث · صوت ٤٨ك/١٦/٢ = ١٩٢ ك.ب/ث ·
طرفيّة ٨٠×٢٤ بنصف بلوك = ٣٨٤٠ بكسل = **١٫٢٥٪** من الإطار.

**RTP:** `payload type | seq | timestamp (بساعة الوسائط) | SSRC | marker` ·
حمولة ~١٢٠٠ب · **شظيّةٌ مفقودة ⇒ ارمِ الإطار كلّه**.

**التزامن:** الصوت سيّد · قدّم الإطار حين `|طابع − موضع التشغيل| ≤ ٤٠ms` ·
تسامح: صوتٌ متأخّرٌ حتى ~١٢٥ms، صوتٌ سابقٌ يُلاحَظ عند ~٤٥ms · صحّح
الانحراف بإعادة أخذ عيّناتٍ لا بالإسقاط.

---

## ٩) القرص

**الوصفة الذرّيّة:** اكتب مؤقّتاً (نفس المجلّد) → `fsync(ملفّ)` →
`rename` → **`fsync(مجلّد)`**.

| الغرض | الأداة |
|---|---|
| نسخٌ صفري | `sendfile` / `splice` (⚠️ يمنعان حساب المجموع) |
| تلميحٌ للقراءة | `posix_fadvise(SEQUENTIAL/WILLNEED)` / `readahead` |
| حجز مساحة | `fallocate` ⇒ فشلٌ مبكّر بـ`ENOSPC` |
| ثقوب | `SEEK_HOLE`/`SEEK_DATA` · `FALLOC_FL_PUNCH_HOLE` |
| كتابةٌ عديمة الأثر | `pwrite` بإزاحةٍ صريحة |
| مسارٌ آمن | `openat`+`O_NOFOLLOW` · `openat2` بـ`RESOLVE_BENEATH` |
| نوع المدخل بلا `stat` | `d_type` من `getdents64` (احذر `DT_UNKNOWN`) |
| حقولٌ مختارة | `statx` |

حجم قطعةٍ عملي: **٦٤ك–١م** · `stat` بكسل للمرئي فقط · عمليّات القرص في خيط
(٢–٤) أو `io_uring`.

---

## ١٠) البناء والتشخيص

```
CFLAGS = -std=c11 -D_GNU_SOURCE -Wall -Wextra -Wconversion -Wshadow \
         -O2 -g -MMD -MP
DEV    = -Og -fsanitize=address,undefined -fno-omit-frame-pointer
-include $(OBJS:.o=.d)
```

| السؤال | الأمر |
|---|---|
| أي استدعاءٍ يهيمن؟ | `strace -c -f ./prog` |
| كم استغرق كلٌّ منها؟ | `strace -T -e trace=read,write,epoll_wait` |
| أين يذهب المعالج؟ | `perf top` · `perf record -g` |
| **أين ينتظر بلا معالج؟** | تحليل off-CPU (`perf sched`, eBPF) |
| ماذا يخرج على السلك؟ | `tcpdump -i any -X port N` |
| حالة المقابس والطوابير | `ss -tinm` |
| الواصفات المفتوحة | `ls /proc/PID/fd \| wc -l` |
| ملفّاتٌ محذوفةٌ ما زالت مفتوحة | `lsof \| grep deleted` |
| قدرات الكاميرا/المايك | `v4l2-ctl --list-formats-ext` · `arecord --dump-hw-params` |
| شبكةٌ سيّئةٌ مصطنعة | `tc qdisc … netem` |

**تصحيح واجهةٍ خام:** طرفيّةٌ ثانية (`tty` لمعرفة رقمها) + سجلٌّ إلى ملفّ
لا إلى `stdout`.
