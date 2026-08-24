# مخصِّصٌ يعدّ

أداةُ قياسٍ تعود إليها في أكثر من إقليم: **مخصِّصٌ يحلّ محلّ مخصِّص البرنامج
كلّه ويعدّ كل طلبٍ يمرّ به.**

سببها أن «هذا أسرع» و«هذا يخصّص أقلّ» ادّعاءان. وهذه تحوّلهما إلى رقمين.

## الملفّ

```rust
use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicUsize, Ordering::Relaxed};

static COUNT: AtomicUsize = AtomicUsize::new(0);
static BYTES: AtomicUsize = AtomicUsize::new(0);

struct Counting;

unsafe impl GlobalAlloc for Counting {
    unsafe fn alloc(&self, l: Layout) -> *mut u8 {
        COUNT.fetch_add(1, Relaxed);
        BYTES.fetch_add(l.size(), Relaxed);
        unsafe { System.alloc(l) }
    }
    unsafe fn dealloc(&self, p: *mut u8, l: Layout) {
        unsafe { System.dealloc(p, l) }
    }
}

#[global_allocator]
static A: Counting = Counting;

/// لقطةٌ من العدّادين: (عدد التخصيصات، مجموع البايتات).
fn snap() -> (usize, usize) {
    (COUNT.load(Relaxed), BYTES.load(Relaxed))
}

fn main() {
    let src = String::from("سعر البيت 12 زائد 30 ضرب 2 ناقص 7");
    let n = src.split_whitespace().count();

    let (c0, b0) = snap();
    let mut borrowed: Vec<&str> = Vec::with_capacity(n);
    borrowed.extend(src.split_whitespace());
    let (c1, b1) = snap();

    let mut owned: Vec<String> = Vec::with_capacity(n);
    owned.extend(src.split_whitespace().map(String::from));
    let (c2, b2) = snap();

    println!("رموز: {n}");
    println!("مستعير: {} تخصيصاً · {} بايت", c1 - c0, b1 - b0);
    println!("مالك  : {} تخصيصاً · {} بايت", c2 - c1, b2 - b1);
    println!("{} {}", borrowed.len(), owned.len());
}
```

<!-- out -->

```
رموز: 9
مستعير: 1 تخصيصاً · 144 بايت
مالك  : 10 تخصيصاً · 260 بايت
9 9
```

## كيف تقرؤه

`#[global_allocator]` يعلن أن هذا هو مخصِّص البرنامج. **يُسمَح بواحدٍ فقط**،
ويلتقط كل تخصيصٍ في `std` أيضاً — `Vec` و`String` و`format!` وغيرها.

`unsafe impl` لأن العقد الذي يوقّعه ثقيل: أن تُرجع ذاكرةً بالحجم والمحاذاة
المطلوبين، وألّا تذعر، وألّا تخصّص من داخل `alloc` نفسها.

`AtomicUsize` لأن التخصيص قد يقع من خيوطٍ كثيرة، و`Relaxed` تكفي: نحن نعدّ ولا
نرتّب حوادث.

## قواعد استعماله

**١) ثبّت السَّعة.** `Vec::with_capacity(n)` تحذف تخصيصات النموّ من القياس، فيبقى
ما تقيسه أنت.

**٢) خذ اللقطة قبل الطباعة.** `println!` نفسها قد تخصّص.

**٣) قارن فرقين، لا رقمين مطلقين.** بدء البرنامج نفسه يخصّص، فالمعنى في
`c2 - c1`.

## أين استُعمل

| الإقليم | ماذا قاس |
|---|---|
| ٠٢ · المِلكية | تخصيصٌ واحد للمستعير مقابل عشرةٍ للمالك |
| ٠٦ · الشجرة | تخصيصٌ واحد للساحة مقابل أربعةٍ للصناديق |
| ٠٨ · المكرِّر | صفرُ تخصيصٍ للسلسلة مقابل تسعةٍ للخطوات |
| ٠٩ · المشترَك | تخصيصٌ واحد لثمانِ مشاركات مقابل ٨٠٩ لثمانِ نسخ |
