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

/* ── تمثيلان لنفس الشجرة ── */

enum Boxed {
    Num(i64),
    Add(Box<Boxed>, Box<Boxed>),
    Mul(Box<Boxed>, Box<Boxed>),
}

#[derive(Clone, Copy)]
enum Node {
    Num(i64),
    Add(u32, u32),
    Mul(u32, u32),
}

struct Arena(Vec<Node>);

impl Arena {
    fn push(&mut self, n: Node) -> u32 {
        self.0.push(n);
        (self.0.len() - 1) as u32
    }
    fn eval(&self, i: u32) -> i64 {
        match self.0[i as usize] {
            Node::Num(n) => n,
            Node::Add(a, b) => self.eval(a) + self.eval(b),
            Node::Mul(a, b) => self.eval(a) * self.eval(b),
        }
    }
}

fn eval_boxed(e: &Boxed) -> i64 {
    match e {
        Boxed::Num(n) => *n,
        Boxed::Add(a, b) => eval_boxed(a) + eval_boxed(b),
        Boxed::Mul(a, b) => eval_boxed(a) * eval_boxed(b),
    }
}

fn main() {
    let c0 = COUNT.load(Relaxed);
    let tree = Boxed::Add(
        Box::new(Boxed::Num(12)),
        Box::new(Boxed::Mul(Box::new(Boxed::Num(30)), Box::new(Boxed::Num(2)))),
    );
    let c1 = COUNT.load(Relaxed);

    let mut a = Arena(Vec::with_capacity(5));
    let n12 = a.push(Node::Num(12));
    let n30 = a.push(Node::Num(30));
    let n2 = a.push(Node::Num(2));
    let mul = a.push(Node::Mul(n30, n2));
    let root = a.push(Node::Add(n12, mul));
    let c2 = COUNT.load(Relaxed);

    println!("Box   : {} تخصيصاً  ·  = {}", c1 - c0, eval_boxed(&tree));
    println!("Arena : {} تخصيصاً  ·  = {}", c2 - c1, a.eval(root));
    println!("حجم Node = {}", std::mem::size_of::<Node>());
}
