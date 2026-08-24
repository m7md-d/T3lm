fn first_word(s: &str) -> &str {
    s.split(' ').next().unwrap_or("")
}

struct Lexer<'a> {
    src: &'a str,
    pos: usize,
}

impl<'a> Lexer<'a> {
    fn src(&self) -> &str {
        self.src
    }
    fn tail(&self) -> &'a str {
        &self.src[self.pos..]
    }
}

fn main() {
    let s = String::from("سعر 12 + 30");
    println!("{}", first_word(&s));
    let lx = Lexer { src: &s, pos: 8 };
    println!("{} | {}", lx.src(), lx.tail());
}
