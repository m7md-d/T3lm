use std::alloc::{GlobalAlloc, Layout, System};
use std::sync::atomic::{AtomicUsize, Ordering::Relaxed};

static COUNT: AtomicUsize = AtomicUsize::new(0);

struct Counting;
unsafe impl GlobalAlloc for Counting {
    unsafe fn alloc(&self, l: Layout) -> *mut u8 {
        COUNT.fetch_add(1, Relaxed);
        unsafe { System.alloc(l) }
    }
    unsafe fn dealloc(&self, p: *mut u8, l: Layout) {
        unsafe { System.dealloc(p, l) }
    }
}
#[global_allocator]
static A: Counting = Counting;

fn main() {
    let v: Vec<u64> = (0..1000).collect();

    let c0 = COUNT.load(Relaxed);
    let chained: u64 = v.iter().filter(|x| *x % 3 == 0).map(|x| x * 2).sum();
    let c1 = COUNT.load(Relaxed);

    let kept: Vec<&u64> = v.iter().filter(|x| *x % 3 == 0).collect();
    let doubled: Vec<u64> = kept.iter().map(|x| *x * 2).collect();
    let stepwise: u64 = doubled.iter().sum();
    let c2 = COUNT.load(Relaxed);

    println!("سلسلة   : {} تخصيصاً  ·  {}", c1 - c0, chained);
    println!("بخطوات  : {} تخصيصاً  ·  {}", c2 - c1, stepwise);
}
