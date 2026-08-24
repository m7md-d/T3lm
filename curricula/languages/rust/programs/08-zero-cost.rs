//! rustc: -O
use std::hint::black_box;
use std::time::{Duration, Instant};

const N: usize = 20_000_000;
const ROUNDS: usize = 7;

fn by_loop(v: &[u64]) -> u64 {
    let mut acc = 0;
    let mut i = 0;
    while i < v.len() {
        if v[i] % 3 == 0 {
            acc += v[i] * 2;
        }
        i += 1;
    }
    acc
}

fn by_chain(v: &[u64]) -> u64 {
    v.iter().filter(|x| *x % 3 == 0).map(|x| x * 2).sum()
}

/// أقلّ زمنٍ من عدّة جولات — الضجيج يزيد ولا ينقص.
fn best(f: impl Fn() -> u64) -> (Duration, u64) {
    let mut lo = Duration::MAX;
    let mut out = 0;
    for _ in 0..ROUNDS {
        let t = Instant::now();
        out = black_box(f());
        lo = lo.min(t.elapsed());
    }
    (lo, out)
}

fn main() {
    let v: Vec<u64> = (0..N as u64).collect();

    let (tl, a) = best(|| by_loop(black_box(&v)));
    let (tc, b) = best(|| by_chain(black_box(&v)));

    println!("حلقة يدوية : {tl:?}");
    println!("سلسلة      : {tc:?}");
    println!("النسبة     : {:.2}×", tc.as_secs_f64() / tl.as_secs_f64());
    println!("متساويان؟ {}", a == b);
}
