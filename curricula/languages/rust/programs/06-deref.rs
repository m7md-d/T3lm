use std::mem::size_of_val;

#[derive(Debug)]
enum Expr {
    Num(i64),
    Add(Box<Expr>, Box<Expr>),
}

fn eval(e: &Expr) -> i64 {
    match e {
        Expr::Num(n) => *n,
        Expr::Add(a, b) => eval(a) + eval(b),
    }
}

fn main() {
    let t = Expr::Add(Box::new(Expr::Num(12)), Box::new(Expr::Num(30)));

    if let Expr::Add(a, _) = &t {
        let as_box: &Box<Expr> = a;
        let as_expr: &Expr = a;
        println!("&Box<Expr> = {} بايت", size_of_val(as_box));
        println!("&Expr      = {} بايت", size_of_val(as_expr));
    }

    let boxed = Box::new(Expr::Num(7));
    let inner: Expr = *boxed;

    println!("{inner:?}  ·  {}", eval(&t));
}
