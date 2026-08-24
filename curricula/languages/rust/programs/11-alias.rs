fn main() {
    let mut x = 10i32;
    let p = &mut x as *mut i32;
    let a = unsafe { &mut *p };
    let b = unsafe { &mut *p };
    *a = 1;
    *b = 2;
    println!("{} {}", a, b);
}
