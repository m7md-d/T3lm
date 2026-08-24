use std::slice;

/// شريحةٌ تُقسَم إلى نصفين قابلين للتعديل.
///
/// # الأمان
/// داخلها `unsafe`، **وواجهتها آمنة**: `assert` تضمن الشرط الوحيد الذي
/// يعتمد عليه العقد، والشريحتان لا تتقاطعان بحكم الحساب.
fn split2(v: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = v.len();
    assert!(mid <= len, "mid={mid} خارج الطول {len}");
    let ptr = v.as_mut_ptr();
    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut v = vec![1, 2, 3, 4];
    {
        let (a, b) = split2(&mut v, 2);
        a[0] += 10;
        b[1] += 10;
    }
    println!("{v:?}");

    let r = std::panic::catch_unwind(move || {
        let mut w = vec![1, 2];
        split2(&mut w, 9);
    });
    println!("خارج الحدّ ⇒ ذعرٌ لا فساد: {}", r.is_err());
}
