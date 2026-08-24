use std::mem::size_of;

#[derive(Debug)]
enum Token {
    Word(String),
    Num(i64),
    Sym(char),
}

fn describe(t: &Token) -> String {
    match t {
        Token::Word(w) => format!("كلمة بطول {}", w.len()),
        Token::Num(n) => format!("عدد {}", n * 2),
        Token::Sym(c) => format!("رمز {c}"),
    }
}

fn main() {
    for t in [
        Token::Word(String::from("let")),
        Token::Num(21),
        Token::Sym('='),
    ] {
        println!("{t:?} → {}", describe(&t));
    }
    println!("حجم Token = {}", size_of::<Token>());
}
