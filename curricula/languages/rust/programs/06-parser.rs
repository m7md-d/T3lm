#[derive(Debug, PartialEq)]
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

struct Parser<'a> {
    toks: &'a [Token],
    at: usize,
}

impl<'a> Parser<'a> {
    fn peek(&self) -> Option<&'a Token> {
        self.toks.get(self.at)
    }

    /// تعبير := حدّ  { '+' حدّ }
    fn expr(&mut self) -> Expr {
        let mut left = self.term();
        while let Some(Token::Sym('+')) = self.peek() {
            self.at += 1;
            let right = self.term();
            left = Expr::Add(Box::new(left), Box::new(right));
        }
        left
    }

    /// حدّ := عامل { '*' عامل }
    fn term(&mut self) -> Expr {
        let mut left = self.factor();
        while let Some(Token::Sym('*')) = self.peek() {
            self.at += 1;
            let right = self.factor();
            left = Expr::Mul(Box::new(left), Box::new(right));
        }
        left
    }

    /// عامل := عدد
    fn factor(&mut self) -> Expr {
        match self.peek() {
            Some(Token::Num(n)) => {
                self.at += 1;
                Expr::Num(*n)
            }
            _ => Expr::Num(0),
        }
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
    let toks = vec![
        Token::Num(12),
        Token::Sym('+'),
        Token::Num(30),
        Token::Sym('*'),
        Token::Num(2),
    ];

    let mut p = Parser { toks: &toks, at: 0 };
    let tree = p.expr();

    println!("{tree:?}");
    println!("12 + 30 * 2 = {}", eval(&tree));
}
