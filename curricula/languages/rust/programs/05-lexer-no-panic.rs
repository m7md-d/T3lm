use std::fmt;
use std::num::ParseIntError;

#[derive(Debug, PartialEq)]
enum Token<'a> {
    Word(&'a str),
    Num(i64),
    Sym(char),
}

#[derive(Debug)]
enum LexError {
    BadNumber(String, ParseIntError),
}

#[derive(Debug)]
enum EvalError {
    Empty,
    NotANumber,
    BadOperator(char),
    Overflow(char),
}

impl fmt::Display for LexError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LexError::BadNumber(w, e) => write!(f, "عددٌ لا يُقرأ «{w}»: {e}"),
        }
    }
}

impl fmt::Display for EvalError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EvalError::Empty => write!(f, "تعبيرٌ فارغ"),
            EvalError::NotANumber => write!(f, "كان المنتظَر عدداً"),
            EvalError::BadOperator(c) => write!(f, "عاملٌ غير مدعوم: {c}"),
            EvalError::Overflow(c) => write!(f, "فيضٌ عند العامل {c}"),
        }
    }
}

impl std::error::Error for LexError {}
impl std::error::Error for EvalError {}

fn lex(src: &str) -> Result<Vec<Token<'_>>, LexError> {
    let mut out = Vec::new();
    for w in src.split_whitespace() {
        let c = w.chars().next().unwrap();
        if c.is_ascii_digit() {
            let n = w.parse().map_err(|e| LexError::BadNumber(w.to_owned(), e))?;
            out.push(Token::Num(n));
        } else if c.is_alphabetic() {
            out.push(Token::Word(w));
        } else {
            out.push(Token::Sym(c));
        }
    }
    Ok(out)
}

fn eval(tokens: &[Token]) -> Result<i64, EvalError> {
    let mut it = tokens.iter();

    let mut acc = match it.next() {
        None => return Err(EvalError::Empty),
        Some(Token::Num(n)) => *n,
        Some(_) => return Err(EvalError::NotANumber),
    };

    while let Some(op) = it.next() {
        let sym = match op {
            Token::Sym(c) => *c,
            _ => return Err(EvalError::NotANumber),
        };
        let rhs = match it.next() {
            Some(Token::Num(n)) => *n,
            _ => return Err(EvalError::NotANumber),
        };
        acc = match sym {
            '+' => acc.checked_add(rhs),
            '*' => acc.checked_mul(rhs),
            other => return Err(EvalError::BadOperator(other)),
        }
        .ok_or(EvalError::Overflow(sym))?;
    }

    Ok(acc)
}

fn run(src: &str) -> Result<i64, Box<dyn std::error::Error>> {
    let tokens = lex(src)?;
    Ok(eval(&tokens)?)
}

fn main() {
    for src in [
        "12 + 30 * 2",
        "9000000000000000000 + 9000000000000000000",
        "99999999999999999999 + 1",
        "7 - 1",
        "",
    ] {
        match run(src) {
            Ok(n) => println!("[{src}] = {n}"),
            Err(e) => println!("[{src}] ✗ {e}"),
        }
    }
}
