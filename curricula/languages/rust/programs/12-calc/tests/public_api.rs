//! اختبار تكاملٍ — يرى الحزمة كما يراها مستعمِلها، من الخارج.

use calc::{Expr, eval, parse};

#[test]
fn eval_matches_parse_then_value() {
    for src in ["1", "1 + 2", "2 * 3 + 4", "12 + 30 * 2"] {
        assert_eq!(eval(src).unwrap(), parse(src).unwrap().value(), "على {src}");
    }
}

#[test]
fn tree_shape_is_public() {
    let e = parse("1 + 2").unwrap();
    assert_eq!(e, Expr::Add(Box::new(Expr::Num(1)), Box::new(Expr::Num(2))));
}
