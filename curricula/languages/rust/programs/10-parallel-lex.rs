use std::thread;

#[derive(Debug, PartialEq)]
enum Token<'a> {
    Word(&'a str),
    Num(i64),
    Sym(char),
}

fn lex(src: &str) -> Vec<Token<'_>> {
    src.split_whitespace()
        .map(|w| match w.parse::<i64>() {
            Ok(n) => Token::Num(n),
            Err(_) if w.chars().all(char::is_alphabetic) => Token::Word(w),
            Err(_) => Token::Sym(w.chars().next().unwrap()),
        })
        .collect()
}

fn main() {
    let text = String::from("سعر 12 + 30\nكمية 4 * 2\nخصم 7 + 1\nمجموع 9 * 9");
    let lines: Vec<&str> = text.lines().collect();
    let mut out: Vec<Vec<Token>> = Vec::new();

    thread::scope(|s| {
        let handles: Vec<_> = lines.iter().map(|line| s.spawn(move || lex(line))).collect();
        for h in handles {
            out.push(h.join().unwrap());
        }
    });

    for (i, toks) in out.iter().enumerate() {
        println!("سطر {i}: {toks:?}");
    }
    println!("النصّ حيّ: {} بايت", text.len());
}
