use std::fmt;
use std::num::ParseIntError;

#[derive(Debug)]
enum EvalError {
    Empty,
    NotANumber(String),
    BadOperator(char),
    Overflow,
}

impl fmt::Display for EvalError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EvalError::Empty => write!(f, "تعبيرٌ فارغ"),
            EvalError::NotANumber(w) => write!(f, "ليس عدداً: {w}"),
            EvalError::BadOperator(c) => write!(f, "عاملٌ غير مدعوم: {c}"),
            EvalError::Overflow => write!(f, "فيضٌ في الحساب"),
        }
    }
}

impl std::error::Error for EvalError {}

impl From<ParseIntError> for EvalError {
    fn from(_: ParseIntError) -> Self {
        EvalError::Overflow
    }
}

fn main() {
    for e in [
        EvalError::Empty,
        EvalError::NotANumber(String::from("ثلاثون")),
        EvalError::BadOperator('-'),
        EvalError::Overflow,
    ] {
        println!("{e:?}  ←  {e}");
    }
}
