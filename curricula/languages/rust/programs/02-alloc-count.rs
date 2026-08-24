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
