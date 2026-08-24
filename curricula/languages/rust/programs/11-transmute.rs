use std::mem::{size_of, transmute};

#[repr(C)]
#[derive(Debug)]
struct Pair { a: u32, b: u32 }

union Bits {
    f: f32,
    i: u32,
}

fn main() {
    let p = Pair { a: 1, b: 2 };
    let n: u64 = unsafe { transmute(p) };
    println!("transmute → {n} (0x{n:x})");

    let b = Bits { f: 1.0 };
    println!("1.0f32 بتاته = 0x{:08x}", unsafe { b.i });

    println!("size_of Pair = {} · u64 = {}", size_of::<Pair>(), size_of::<u64>());
}
