use std::cell::RefCell;
use std::rc::{Rc, Weak};

struct Node {
    name: &'static str,
    child: RefCell<Option<Rc<Node>>>,
    parent: RefCell<Weak<Node>>,
}

impl Drop for Node {
    fn drop(&mut self) {
        println!("مات {}", self.name);
    }
}

fn main() {
    {
        let parent = Rc::new(Node {
            name: "الأب",
            child: RefCell::new(None),
            parent: RefCell::new(Weak::new()),
        });
        let child = Rc::new(Node {
            name: "الابن",
            child: RefCell::new(None),
            parent: RefCell::new(Weak::new()),
        });

        *parent.child.borrow_mut() = Some(Rc::clone(&child));
        *child.parent.borrow_mut() = Rc::downgrade(&parent);

        println!("قويّ: أب={} ابن={}", Rc::strong_count(&parent), Rc::strong_count(&child));
        println!("ضعيف على الأب: {}", Rc::weak_count(&parent));

        let up = child.parent.borrow().upgrade();
        println!("الصعود إلى الأب: {:?}", up.map(|p| p.name));
    }
    println!("— انتهى النطاق —");
}
