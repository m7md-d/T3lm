use std::mem::size_of;

trait Weigh {
    fn weight(&self) -> usize;
}

struct Word(String);
struct Num(i64);

impl Weigh for Word {
    fn weight(&self) -> usize { self.0.len() }
}
impl Weigh for Num {
    fn weight(&self) -> usize { self.0.unsigned_abs().to_string().len() }
}

fn main() {
    let items: Vec<Box<dyn Weigh>> = vec![
        Box::new(Word(String::from("سعر"))),
        Box::new(Num(1200)),
        Box::new(Word(String::from("مجموع"))),
    ];

    let total: usize = items.iter().map(|x| x.weight()).sum();
    println!("مجموع الأوزان: {total}");

    println!("&Word          : {}", size_of::<&Word>());
    println!("&dyn Weigh     : {}", size_of::<&dyn Weigh>());
    println!("Box<dyn Weigh> : {}", size_of::<Box<dyn Weigh>>());
}
