use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

/// جدولُ رموزٍ يمسكه المُحلِّل والحاسب معاً.
#[derive(Default)]
struct Symbols {
    ids: HashMap<String, usize>,
    names: Vec<String>,
}

impl Symbols {
    fn intern(&mut self, name: &str) -> usize {
        if let Some(i) = self.ids.get(name) {
            return *i;
        }
        let i = self.names.len();
        self.names.push(name.to_owned());
        self.ids.insert(name.to_owned(), i);
        i
    }
}

type Shared = Rc<RefCell<Symbols>>;

struct Parser {
    syms: Shared,
}

struct Evaluator {
    syms: Shared,
    values: HashMap<usize, i64>,
}

impl Parser {
    fn read(&self, src: &str) -> Vec<usize> {
        src.split_whitespace()
            .map(|w| self.syms.borrow_mut().intern(w))
            .collect()
    }
}

impl Evaluator {
    fn set(&mut self, id: usize, v: i64) {
        self.values.insert(id, v);
    }
    fn show(&self, id: usize) -> String {
        let syms = self.syms.borrow();
        format!("{}={}", syms.names[id], self.values.get(&id).copied().unwrap_or(0))
    }
}

fn main() {
    let syms: Shared = Rc::new(RefCell::new(Symbols::default()));

    let p = Parser { syms: Rc::clone(&syms) };
    let mut e = Evaluator { syms: Rc::clone(&syms), values: HashMap::new() };

    let ids = p.read("سعر كمّية سعر");
    println!("معرّفات: {ids:?}");
    println!("عدد الرموز: {}", syms.borrow().names.len());

    e.set(ids[0], 12);
    e.set(ids[1], 30);

    println!("{}", e.show(ids[0]));
    println!("{}", e.show(ids[1]));
    println!("مالكون: {}", Rc::strong_count(&syms));
}
