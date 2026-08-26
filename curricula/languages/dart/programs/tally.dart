// tally — يقرأ سجلّ وصولٍ سطراً سطراً، ويطبع تقريراً عمّا فيه.
//
//     dart run tally.dart <ملفّ>
//     dart run tally.dart            ← يكتب عيّنةً ويحلّلها
//
// مئةُ سطرٍ فيها كل علاقةٍ بنيوية يفصّلها هذا المنهج.

import 'dart:convert';
import 'dart:io';

// ── ١ · الشكل الذي نقرأ إليه ────────────────────────────────────────────

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

// ── ٢ · التحليل: من نصٍّ إلى شكل ────────────────────────────────────────

Line parse(String raw) {
  final f = raw.split(' ');
  if (f.length != 3) return Bad(raw, 'حقولٌ ${f.length} لا ٣');

  final status = int.tryParse(f[1]);
  if (status == null) return Bad(raw, 'الحالة «${f[1]}» ليست عدداً');

  final bytes = int.tryParse(f[2]);
  if (bytes == null) return Bad(raw, 'الحجم «${f[2]}» ليس عدداً');

  return Ok((f[0], status, bytes));
}

// ── ٣ · العدّاد: بنيةٌ واحدة لكل ما يُعدّ ───────────────────────────────

class Tally<K> {
  final Map<K, int> _n = {};

  void add(K key, [int by = 1]) => _n[key] = (_n[key] ?? 0) + by;

  int get total => _n.values.fold(0, (a, b) => a + b);

  int of(K key) => _n[key] ?? 0;

  List<(K, int)> top(int k) {
    final all = [for (final e in _n.entries) (e.key, e.value)]
      ..sort((a, b) {
        final byCount = b.$2.compareTo(a.$2);
        return byCount != 0 ? byCount : '${a.$1}'.compareTo('${b.$1}');
      });
    return all.take(k).toList();
  }
}

// ── ٤ · القراءة: مجرًى لا مصفوفة ────────────────────────────────────────

Stream<Line> lines(File f) => f
    .openRead()
    .transform(utf8.decoder)
    .transform(const LineSplitter())
    .where((s) => s.trim().isNotEmpty)
    .map(parse);

// ── ٥ · التقرير ─────────────────────────────────────────────────────────

const sample = '''
10.0.0.1 200 1200
10.0.0.2 404 90
10.0.0.1 200 3400
10.0.0.3 500 0
10.0.0.1 404 90
سطرٌ مكسور
10.0.0.2 200 لاعدد
''';

Future<void> main(List<String> args) async {
  final file = File(args.isEmpty ? 'sample.log' : args.first);
  if (args.isEmpty) await file.writeAsString(sample);

  if (!await file.exists()) {
    stderr.writeln('لا ملفّ: ${file.path}');
    exitCode = 66;
    return;
  }

  final byIp = Tally<String>();
  final byStatus = Tally<int>();
  final bytes = Tally<String>();
  final bad = <Bad>[];

  await for (final line in lines(file)) {
    switch (line) {
      case Ok(hit: (final ip, final status, final n)):
        byIp.add(ip);
        byStatus.add(status);
        bytes.add(ip, n);
      case Bad b:
        bad.add(b);
    }
  }

  print('الملفّ    : ${file.path}');
  print('مقروء    : ${byIp.total} سطراً · مرفوض: ${bad.length}');
  print('بايتات   : ${bytes.total}');

  print('\nالحالات:');
  for (final (status, n) in byStatus.top(9)) {
    print('  $status  ${'▍' * n}  $n');
  }

  print('\nأكثر ثلاثة:');
  for (final (ip, n) in byIp.top(3)) {
    print('  $ip  $n طلباً  ${bytes.of(ip)} بايتاً');
  }

  if (bad.isNotEmpty) {
    print('\nمرفوض:');
    for (final b in bad) {
      print('  ${b.why}  ←  «${b.raw}»');
    }
  }
}
