//! rustc: -O
use std::hint::black_box;
use std::time::Instant;

trait Weigh {
    fn weight(&self) -> usize;
}

struct Word(usize);
impl Weigh for Word {
    fn weight(&self) -> usize { self.0 }
}

fn sum_static<T: Weigh>(v: &[T]) -> usize {
    v.iter().map(|x| x.weight()).sum()
}

fn sum_dyn(v: &[Box<dyn Weigh>]) -> usize {
    v.iter().map(|x| x.weight()).sum()
}

const N: usize = 2_000_000;
const R: usize = 50;

fn main() {
    let stat: Vec<Word> = (0..N).map(Word).collect();
    let dynm: Vec<Box<dyn Weigh>> = (0..N).map(|i| Box::new(Word(i)) as Box<dyn Weigh>).collect();

    let t0 = Instant::now();
    let mut a = 0;
    for _ in 0..R { a += black_box(sum_static(black_box(&stat))); }
    let ts = t0.elapsed();

    let t1 = Instant::now();
    let mut b = 0;
    for _ in 0..R { b += black_box(sum_dyn(black_box(&dynm))); }
    let td = t1.elapsed();

    println!("ثابت : {:?}", ts);
    println!("ديناميّ: {:?}", td);
    println!("النسبة: {:.1}×", td.as_secs_f64() / ts.as_secs_f64());
    println!("{}", a == b);
}
