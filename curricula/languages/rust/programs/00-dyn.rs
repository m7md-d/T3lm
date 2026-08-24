use std::mem::size_of_val;

trait Shape {
    fn area(&self) -> f64;
}

struct Sq(f64);
struct Ci(f64);

impl Shape for Sq {
    fn area(&self) -> f64 {
        self.0 * self.0
    }
}

impl Shape for Ci {
    fn area(&self) -> f64 {
        3.14 * self.0 * self.0
    }
}

fn total_dyn(shapes: &[&dyn Shape]) -> f64 {
    shapes.iter().map(|s| s.area()).sum()
}

fn main() {
    let mixed: [&dyn Shape; 2] = [&Sq(2.0), &Ci(1.0)];
    println!("{:.2}", total_dyn(&mixed));

    let r: &dyn Shape = &Sq(2.0);
    println!("&Sq = {} · &dyn Shape = {}", size_of_val(&&Sq(2.0)), size_of_val(&r));
}
