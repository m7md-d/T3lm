use std::fmt;
use std::ops::{Add, Index};

#[derive(Debug, Clone, Copy, PartialEq)]
struct Money(i64);

impl Add for Money {
    type Output = Money;
    fn add(self, rhs: Money) -> Money {
        Money(self.0 + rhs.0)
    }
}

impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} ريال", self.0)
    }
}

struct Row(Vec<Money>);

impl Index<usize> for Row {
    type Output = Money;
    fn index(&self, i: usize) -> &Money {
        &self.0[i]
    }
}

fn main() {
    let a = Money(12);
    let b = Money(30);
    println!("{}", a + b);
    println!("{}", a + b == Money(42));

    let r = Row(vec![a, b]);
    println!("{}", r[1]);
}
