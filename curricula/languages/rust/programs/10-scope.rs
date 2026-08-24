use std::thread;

fn main() {
    let src = String::from("سعر 12 + 30 * 2");
    let mut lens = vec![0usize; 3];

    thread::scope(|s| {
        for (i, chunk) in lens.chunks_mut(1).enumerate() {
            let text = &src;
            s.spawn(move || {
                chunk[0] = text.split_whitespace().nth(i).map(str::len).unwrap_or(0);
            });
        }
    });

    println!("{lens:?}");
    println!("النصّ ما زال هنا: {}", src);
}
