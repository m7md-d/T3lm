use std::error::Error;
use std::fmt;

#[derive(Debug)]
struct Bad(String);

impl fmt::Display for Bad {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "مدخلٌ سيّئ: {}", self.0)
    }
}

impl Error for Bad {}

fn run(src: &str) -> Result<i64, Box<dyn Error>> {
    let w = src.split_whitespace().next().ok_or(Bad(String::from("فارغ")))?;
    let n: i64 = w.parse()?;
    Ok(n * 2)
}

fn main() -> Result<(), Box<dyn Error>> {
    println!("{}", run("21 + 1")?);
    println!("{}", run("سعر")?);
    Ok(())
}
