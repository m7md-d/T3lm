struct Node {
    v: i64,
    next: Option<Box<Node>>,
}

struct List {
    head: Option<Box<Node>>,
}

impl Drop for List {
    fn drop(&mut self) {
        let mut cur = self.head.take();
        while let Some(mut n) = cur {
            cur = n.next.take();
        }
    }
}

fn build(n: usize) -> List {
    let mut head = None;
    for i in 0..n {
        head = Some(Box::new(Node { v: i as i64, next: head }));
    }
    List { head }
}

fn main() {
    let n = 200_000;
    let l = build(n);
    println!("بُنيت {n} عقدة، وأوّلها {}", l.head.as_ref().unwrap().v);
    drop(l);
    println!("حُرِّرت");
}
