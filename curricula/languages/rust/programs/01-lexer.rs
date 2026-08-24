#[derive(Debug, PartialEq)]
enum Token<'a> {
    Word(&'a str),
    Num(i64),
    Sym(char),
}

struct Lexer<'a> {
    src: &'a str,
    pos: usize,
}

impl<'a> Lexer<'a> {
    fn new(src: &'a str) -> Self {
        Lexer { src, pos: 0 }
    }

    fn rest(&self) -> &'a str {
        &self.src[self.pos..]
    }
}

impl<'a> Iterator for Lexer<'a> {
    type Item = Token<'a>;

    fn next(&mut self) -> Option<Token<'a>> {
        let rest = self.rest();
        let skip = rest.len() - rest.trim_start().len();
        self.pos += skip;

        let rest = self.rest();
        let c = rest.chars().next()?;

        if c.is_ascii_digit() {
            let end = rest
                .find(|x: char| !x.is_ascii_digit())
                .unwrap_or(rest.len());
            self.pos += end;
            return Some(Token::Num(rest[..end].parse().unwrap()));
        }

        if c.is_alphabetic() {
            let end = rest
                .find(|x: char| !x.is_alphabetic())
                .unwrap_or(rest.len());
            self.pos += end;
            return Some(Token::Word(&rest[..end]));
        }

        self.pos += c.len_utf8();
        Some(Token::Sym(c))
    }
}

#[derive(Debug)]
enum EvalError {
    Empty,
    NotANumber,
    BadOperator(char),
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
            '+' => acc + rhs,
            '*' => acc * rhs,
            other => return Err(EvalError::BadOperator(other)),
        };
    }

    Ok(acc)
}

fn main() {
    let src = String::from("سعر 12 + 30 * 2");

    let tokens: Vec<Token> = Lexer::new(&src).collect();
    println!("{:?}", tokens);

    println!("{:?}", eval(&tokens[1..]));
    println!("{:?}", eval(&tokens));
    println!("{:?}", eval(&[]));

    let minus: Vec<Token> = Lexer::new("7 - 1").collect();
    if let Err(EvalError::BadOperator(c)) = eval(&minus) {
        println!("عاملٌ غير مدعوم: {c}");
    }
}
