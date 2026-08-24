use std::cell::RefCell;
use std::rc::Rc;

struct Node {
    name: &'static str,
    links: RefCell<Vec<Rc<Node>>>,
}

impl Drop for Node {
    fn drop(&mut self) {
        println!("مات {}", self.name);
    }
}

fn main() {
    {
        println!("— بلا حلقة —");
        let a = Rc::new(Node { name: "أ", links: RefCell::new(vec![]) });
        let b = Rc::new(Node { name: "ب", links: RefCell::new(vec![]) });
        a.links.borrow_mut().push(Rc::clone(&b));
        println!("  أ={} ب={}", Rc::strong_count(&a), Rc::strong_count(&b));
    }

    println!("— بحلقة —");
    {
        let x = Rc::new(Node { name: "س", links: RefCell::new(vec![]) });
        let y = Rc::new(Node { name: "ص", links: RefCell::new(vec![]) });
        x.links.borrow_mut().push(Rc::clone(&y));
        y.links.borrow_mut().push(Rc::clone(&x));
        println!("  س={} ص={}", Rc::strong_count(&x), Rc::strong_count(&y));
    }
    println!("— انتهى النطاق —");
}
