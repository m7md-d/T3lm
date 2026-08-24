use std::iter::Peekable;

#[derive(Debug, PartialEq, Clone, Copy)]
enum Token {
    Num(i64),
    Sym(char),
}

#[derive(Debug)]
enum Expr {
    Num(i64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

/// مفكِّكٌ مكرِّر: لا متّجه بينه وبين المُحلِّل.
struct Lexer<'a> {
    rest: &'a str,
}

impl<'a> Iterator for Lexer<'a> {
    type Item = Token;

    fn next(&mut self) -> Option<Token> {
        self.rest = self.rest.trim_start();
        let c = self.rest.chars().next()?;
        if c.is_ascii_digit() {
            let end = self.rest.find(|x: char| !x.is_ascii_digit()).unwrap_or(self.rest.len());
            let n = self.rest[..end].parse().ok()?;
            self.rest = &self.rest[end..];
            return Some(Token::Num(n));
        }
        self.rest = &self.rest[c.len_utf8()..];
        Some(Token::Sym(c))
    }
}

fn expr<I: Iterator<Item = Token>>(it: &mut Peekable<I>) -> Expr {
    let mut left = term(it);
    while it.peek() == Some(&Token::Sym('+')) {
        it.next();
        let right = term(it);
        left = Expr::Add(Box::new(left), Box::new(right));
    }
    left
}

fn term<I: Iterator<Item = Token>>(it: &mut Peekable<I>) -> Expr {
    let mut left = factor(it);
    while it.peek() == Some(&Token::Sym('*')) {
        it.next();
        let right = factor(it);
        left = Expr::Mul(Box::new(left), Box::new(right));
    }
    left
}

fn factor<I: Iterator<Item = Token>>(it: &mut Peekable<I>) -> Expr {
    match it.next() {
        Some(Token::Num(n)) => Expr::Num(n),
        _ => Expr::Num(0),
    }
}

fn eval(e: &Expr) -> i64 {
    match e {
        Expr::Num(n) => *n,
        Expr::Add(a, b) => eval(a) + eval(b),
        Expr::Mul(a, b) => eval(a) * eval(b),
    }
}

fn main() {
    let src = "12 + 30 * 2";
    let mut it = Lexer { rest: src }.peekable();
    let tree = expr(&mut it);

    println!("{tree:?}");
    println!("{src} = {}", eval(&tree));

    let count = Lexer { rest: "1 + 2 * 3 + 4" }.count();
    println!("رموز: {count}");
}
