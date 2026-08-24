//! rustc: -O
use std::sync::atomic::{AtomicU64, Ordering::Relaxed};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Instant;

const T: usize = 8;
const N: usize = 500_000;

fn main() {
    let m = Arc::new(Mutex::new(0u64));
    let t0 = Instant::now();
    let mut hs = Vec::new();
    for _ in 0..T {
        let c = Arc::clone(&m);
        hs.push(thread::spawn(move || {
            for _ in 0..N { *c.lock().unwrap() += 1; }
        }));
    }
    for h in hs { h.join().unwrap(); }
    let tm = t0.elapsed();

    let a = Arc::new(AtomicU64::new(0));
    let t1 = Instant::now();
    let mut hs = Vec::new();
    for _ in 0..T {
        let c = Arc::clone(&a);
        hs.push(thread::spawn(move || {
            for _ in 0..N { c.fetch_add(1, Relaxed); }
        }));
    }
    for h in hs { h.join().unwrap(); }
    let ta = t1.elapsed();

    println!("Mutex  : {tm:?}   ({})", m.lock().unwrap());
    println!("Atomic : {ta:?}   ({})", a.load(Relaxed));
    println!("النسبة : {:.1}×", tm.as_secs_f64() / ta.as_secs_f64());
}
