use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let m = Arc::new(Mutex::new(vec![1, 2, 3]));

    let c = Arc::clone(&m);
    let h = thread::spawn(move || {
        let _g = c.lock().unwrap();
        panic!("سقط الخيط وهو ممسكٌ بالقفل");
    });

    println!("انضمام: {:?}", h.join().is_err());

    match m.lock() {
        Ok(v) => println!("سليم: {v:?}"),
        Err(e) => {
            println!("مسموم: {}", e);
            println!("والبيانات ما زالت: {:?}", e.into_inner());
        }
    }
}
