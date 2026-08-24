unsafe extern "C" {
    fn abs(x: i32) -> i32;
    fn strlen(s: *const i8) -> usize;
}

fn main() {
    unsafe {
        println!("abs(-42) = {}", abs(-42));
    }

    let owned = std::ffi::CString::new("hello").unwrap();
    unsafe {
        println!("strlen = {}", strlen(owned.as_ptr()));
    }
    println!("len في Rust = {}", "hello".len());
}
