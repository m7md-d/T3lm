#[derive(Debug)]
enum Expr {
    Num(i64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

fn eval(e: &Expr) -> i64 {
    match e {
        Expr::Num(n) => *n,
        Expr::Add(a, b) => eval(a) + eval(b),
        Expr::Mul(a, b) => eval(a) * eval(b),
    }
}

fn main() {
    // 12 + (30 * 2)
    let tree = Expr::Add(
        Box::new(Expr::Num(12)),
        Box::new(Expr::Mul(Box::new(Expr::Num(30)), Box::new(Expr::Num(2)))),
    );
    println!("{tree:?}");
    println!("= {}", eval(&tree));

    // (12 + 30) * 2  — ما كان يفعله المفكِّك المسطّح
    let flat = Expr::Mul(
        Box::new(Expr::Add(Box::new(Expr::Num(12)), Box::new(Expr::Num(30)))),
        Box::new(Expr::Num(2)),
    );
    println!("= {}", eval(&flat));
}
