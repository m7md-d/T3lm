use shapes::{Fault, Sealed};

fn describe_sealed(s: &Sealed) -> &'static str {
    match s {
        Sealed::Empty => "فارغ",
        Sealed::Overflow => "فيض",
    }
}

fn describe_open(f: &Fault) -> &'static str {
    match f {
        Fault::Empty => "فارغ",
        Fault::Overflow => "فيض",
    }
}

fn main() {
    println!("{}", describe_sealed(&Sealed::Empty));
    println!("{}", describe_open(&Fault::Empty));
}
