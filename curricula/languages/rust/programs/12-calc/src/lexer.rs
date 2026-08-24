//! تحويل النصّ إلى رموز، بلا تخصيصٍ لكل رمز.

/// رمزٌ واحد من النصّ. **نافذةٌ عليه**، فلا يعيش بعده.
#[derive(Debug, PartialEq, Clone, Copy)]
pub enum Token<'a> {
    Num(i64),
    Sym(char),
    Word(&'a str),
}

/// مكرِّرٌ يعطي رموز النصّ واحداً واحداً.
///
/// ```
/// use calc::{Lexer, Token};
/// let mut lx = Lexer::new("12 + سعر");
/// assert_eq!(lx.next(), Some(Token::Num(12)));
/// assert_eq!(lx.next(), Some(Token::Sym('+')));
/// assert_eq!(lx.next(), Some(Token::Word("سعر")));
/// assert_eq!(lx.next(), None);
/// ```
pub struct Lexer<'a> {
    rest: &'a str,
}

impl<'a> Lexer<'a> {
    /// يبني مفكِّكاً على نصٍّ مستعار.
    pub fn new(src: &'a str) -> Self {
        Lexer { rest: src }
    }

    /// ما لم يُفكَّك بعد.
    pub fn as_str(&self) -> &'a str {
        self.rest
    }
}

impl<'a> Iterator for Lexer<'a> {
    type Item = Token<'a>;

    fn next(&mut self) -> Option<Token<'a>> {
        self.rest = self.rest.trim_start();
        let c = self.rest.chars().next()?;

        if c.is_ascii_digit() {
            let end = self
                .rest
                .find(|x: char| !x.is_ascii_digit())
                .unwrap_or(self.rest.len());
            let n = self.rest[..end].parse().ok()?;
            self.rest = &self.rest[end..];
            return Some(Token::Num(n));
        }

        if c.is_alphabetic() {
            let end = self
                .rest
                .find(|x: char| !x.is_alphabetic())
                .unwrap_or(self.rest.len());
            let w = &self.rest[..end];
            self.rest = &self.rest[end..];
            return Some(Token::Word(w));
        }

        self.rest = &self.rest[c.len_utf8()..];
        Some(Token::Sym(c))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn arabic_word_is_one_token() {
        let toks: Vec<_> = Lexer::new("سعر 12").collect();
        assert_eq!(toks, vec![Token::Word("سعر"), Token::Num(12)]);
    }

    #[test]
    fn empty_gives_nothing() {
        assert_eq!(Lexer::new("   ").count(), 0);
    }

    #[test]
    fn rest_shrinks() {
        let mut lx = Lexer::new("12 + 30");
        lx.next();
        assert_eq!(lx.as_str().trim(), "+ 30");
    }
}
