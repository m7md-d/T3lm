//! vm: --old_gen_heap_size=64
// عشرون مليون كائنٍ **محفوظ** في كومةٍ حدُّها ٦٤ ميغابايت.

class Small {
  final int a;
  Small(this.a);
}

void main() {
  const n = 20000000;
  final kept = <Small>[];
  for (var i = 0; i < n; i++) {
    kept.add(Small(i));
  }
  print('نجا: ${kept.length}');
}
