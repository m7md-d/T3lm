/// خطأٌ مفتوحٌ للنموّ — إضافة شكلٍ إليه ليست كسراً.
#[non_exhaustive]
#[derive(Debug)]
pub enum Fault {
    Empty,
    Overflow,
}

/// خطأٌ مغلق — إضافة شكلٍ إليه تكسر كل من طابق عليه.
#[derive(Debug)]
pub enum Sealed {
    Empty,
    Overflow,
}
