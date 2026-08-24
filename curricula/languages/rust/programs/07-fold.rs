#[derive(Debug)]
enum Expr {
    Num(i64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

/// طيّ الشجرة إلى نوعٍ يقرّره المنفِّذ.
trait Fold {
    type Out;
    fn num(&self, n: i64) -> Self::Out;
    fn add(&self, a: Self::Out, b: Self::Out) -> Self::Out;
    fn mul(&self, a: Self::Out, b: Self::Out) -> Self::Out;
}

fn walk<F: Fold>(f: &F, e: &Expr) -> F::Out {
    match e {
        Expr::Num(n) => f.num(*n),
        Expr::Add(a, b) => {
            let (x, y) = (walk(f, a), walk(f, b));
            f.add(x, y)
        }
        Expr::Mul(a, b) => {
            let (x, y) = (walk(f, a), walk(f, b));
            f.mul(x, y)
        }
    }
}

struct Calc;
impl Fold for Calc {
    type Out = i64;
    fn num(&self, n: i64) -> i64 { n }
    fn add(&self, a: i64, b: i64) -> i64 { a + b }
    fn mul(&self, a: i64, b: i64) -> i64 { a * b }
}

struct Show;
impl Fold for Show {
    type Out = String;
    fn num(&self, n: i64) -> String { n.to_string() }
    fn add(&self, a: String, b: String) -> String { format!("({a} + {b})") }
    fn mul(&self, a: String, b: String) -> String { format!("({a} * {b})") }
}

struct Depth;
impl Fold for Depth {
    type Out = usize;
    fn num(&self, _: i64) -> usize { 1 }
    fn add(&self, a: usize, b: usize) -> usize { 1 + a.max(b) }
    fn mul(&self, a: usize, b: usize) -> usize { 1 + a.max(b) }
}

fn main() {
    let t = Expr::Add(
        Box::new(Expr::Num(12)),
        Box::new(Expr::Mul(Box::new(Expr::Num(30)), Box::new(Expr::Num(2)))),
    );

    println!("{}", walk(&Show, &t));
    println!("= {}", walk(&Calc, &t));
    println!("عمقها {}", walk(&Depth, &t));
}
