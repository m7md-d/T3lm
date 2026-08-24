use std::mem::{align_of, offset_of, size_of};

struct Rust { a: bool, b: u64, c: bool }

#[repr(C)]
struct C { a: bool, b: u64, c: bool }

fn main() {
    println!("repr(Rust) {}", size_of::<Rust>());
    println!("repr(C)    {}", size_of::<C>());
    println!("a عند {}", offset_of!(Rust, a));
    println!("b عند {}", offset_of!(Rust, b));
    println!("c عند {}", offset_of!(Rust, c));
    let _ = align_of::<Rust>();
}
