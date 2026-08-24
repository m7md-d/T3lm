//! تحويل الرموز إلى شجرة، بأسبقيةٍ صحيحة.

use crate::ast::Expr;
use crate::lexer::{Lexer, Token};
use std::fmt;
use std::iter::Peekable;

/// ما قد يعترض المُحلِّل.
#[derive(Debug, PartialEq)]
pub enum ParseError {
    Empty,
    Unexpected(String),
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseError::Empty => write!(f, "تعبيرٌ فارغ"),
            ParseError::Unexpected(w) => write!(f, "رمزٌ غير متوقَّع: {w}"),
        }
    }
}

impl std::error::Error for ParseError {}

/// يحوّل نصّاً إلى شجرة.
///
/// ```
/// use calc::parse;
/// assert_eq!(parse("12 + 30 * 2").unwrap().value(), 72);
/// ```
pub fn parse(src: &str) -> Result<Expr, ParseError> {
    let mut it = Lexer::new(src).peekable();
    let e = expr(&mut it)?;
    match it.next() {
        None => Ok(e),
        Some(t) => Err(ParseError::Unexpected(format!("{t:?}"))),
    }
}

fn expr<'a, I: Iterator<Item = Token<'a>>>(it: &mut Peekable<I>) -> Result<Expr, ParseError> {
    let mut left = term(it)?;
    while it.peek() == Some(&Token::Sym('+')) {
        it.next();
        left = Expr::Add(Box::new(left), Box::new(term(it)?));
    }
    Ok(left)
}

fn term<'a, I: Iterator<Item = Token<'a>>>(it: &mut Peekable<I>) -> Result<Expr, ParseError> {
    let mut left = factor(it)?;
    while it.peek() == Some(&Token::Sym('*')) {
        it.next();
        left = Expr::Mul(Box::new(left), Box::new(factor(it)?));
    }
    Ok(left)
}

fn factor<'a, I: Iterator<Item = Token<'a>>>(it: &mut Peekable<I>) -> Result<Expr, ParseError> {
    match it.next() {
        Some(Token::Num(n)) => Ok(Expr::Num(n)),
        Some(t) => Err(ParseError::Unexpected(format!("{t:?}"))),
        None => Err(ParseError::Empty),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn precedence_binds_mul_tighter() {
        assert_eq!(parse("12 + 30 * 2").unwrap().value(), 72);
        assert_eq!(parse("2 * 3 + 4").unwrap().value(), 10);
    }

    #[test]
    fn empty_is_an_error() {
        assert_eq!(parse(""), Err(ParseError::Empty));
    }

    #[test]
    fn trailing_junk_is_reported() {
        let e = parse("1 + 2 سعر").unwrap_err();
        assert!(matches!(e, ParseError::Unexpected(_)));
    }
}
