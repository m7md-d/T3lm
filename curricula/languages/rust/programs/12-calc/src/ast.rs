//! شجرة التعبير، وحسابها.

/// تعبيرٌ محسوب.
#[derive(Debug, PartialEq)]
pub enum Expr {
    Num(i64),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

impl Expr {
    /// يحسب قيمة الشجرة.
    ///
    /// ```
    /// use calc::Expr;
    /// let e = Expr::Add(Box::new(Expr::Num(2)), Box::new(Expr::Num(3)));
    /// assert_eq!(e.value(), 5);
    /// ```
    pub fn value(&self) -> i64 {
        match self {
            Expr::Num(n) => *n,
            Expr::Add(a, b) => a.value() + b.value(),
            Expr::Mul(a, b) => a.value() * b.value(),
        }
    }
}
