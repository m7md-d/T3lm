typedef Hit = (String ip, int status, int bytes);

sealed class Line {
  const Line();
}

final class Ok extends Line {
  final Hit hit;
  const Ok(this.hit);
}

final class Bad extends Line {
  final String raw;
  final String why;
  const Bad(this.raw, this.why);
}

Line parse(String raw) {
  final f = raw.split(' ');
  if (f.length != 3) return Bad(raw, 'حقولٌ ${f.length} لا ٣');
  final status = int.tryParse(f[1]);
  if (status == null) return Bad(raw, 'الحالة ليست عدداً');
  final bytes = int.tryParse(f[2]);
  if (bytes == null) return Bad(raw, 'الحجم ليس عدداً');
  return Ok((f[0], status, bytes));
}

class Tally<K> {
  final Map<K, int> _n = {};
  void add(K key, [int by = 1]) => _n[key] = (_n[key] ?? 0) + by;
  int get total => _n.values.fold(0, (a, b) => a + b);
  int of(K key) => _n[key] ?? 0;
}
