//! vm: --old_gen_heap_size=64
// عشرون مليون كائنٍ **عابر** في الكومة نفسها.

class Small {
  final int a;
  Small(this.a);
}

void main() {
  const n = 20000000;
  var sink = 0;
  for (var i = 0; i < n; i++) {
    sink += Small(i).a;
  }
  print('نجا، والمجموع: $sink');
}
