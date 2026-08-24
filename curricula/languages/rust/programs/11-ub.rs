//! rustc: -O
use std::hint::unreachable_unchecked;

/// العقد: لا تُستدعى إلا بـ`x <= 5`. وكسرُه سلوكٌ غير معرَّف.
unsafe fn small(x: u32) -> u32 {
    if x > 5 {
        unsafe { unreachable_unchecked() }
    }
    x * 10
}

fn main() {
    let arg: u32 = std::env::args().count() as u32 + 8;
    println!("المدخَل: {arg}");
    println!("الجواب: {}", unsafe { small(arg) });
}
