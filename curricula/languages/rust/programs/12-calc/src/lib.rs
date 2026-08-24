//! حاسبةُ تعبيراتٍ صغيرة: نصٌّ ← رموز ← شجرة ← عدد.
//!
//! ```
//! assert_eq!(calc::eval("12 + 30 * 2").unwrap(), 72);
//! ```

pub mod ast;
pub mod lexer;
pub mod parser;

pub use ast::Expr;
pub use lexer::{Lexer, Token};
pub use parser::{ParseError, parse};

/// يحسب تعبيراً كاملاً في خطوةٍ واحدة.
///
/// # أمثلة
///
/// ```
/// use calc::eval;
/// assert_eq!(eval("2 + 3 * 4").unwrap(), 14);
/// assert!(eval("").is_err());
/// ```
pub fn eval(src: &str) -> Result<i64, ParseError> {
    Ok(parse(src)?.value())
}
