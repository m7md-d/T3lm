use std::alloc::{GlobalAlloc, Layout, System};
use std::cell::RefCell;
use std::rc::Rc;
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

#[derive(Clone)]
struct Table {
    names: Vec<String>,
}

fn main() {
    let big = Table { names: (0..100).map(|i| format!("اسم{i}")).collect() };

    let c0 = COUNT.load(Relaxed);
    let deep: Vec<Table> = (0..8).map(|_| big.clone()).collect();
    let c1 = COUNT.load(Relaxed);

    let rc = Rc::new(RefCell::new(big));
    let c2 = COUNT.load(Relaxed);
    let shared: Vec<Rc<RefCell<Table>>> = (0..8).map(|_| Rc::clone(&rc)).collect();
    let c3 = COUNT.load(Relaxed);

    println!("ثمانُ نسخٍ عميقة : {} تخصيصاً", c1 - c0);
    println!("ثمانُ مشاركات   : {} تخصيصاً", c3 - c2);
    println!("(بناء Rc نفسه   : {} تخصيصاً)", c2 - c1);
    println!("{} أسماء · {} نسخة · {} مشاركة",
        shared[0].borrow().names.len(), deep.len(), shared.len());
}
