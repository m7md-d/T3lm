import 'package:tested/tally.dart';
import 'package:test/test.dart';

void main() {
  group('parse', () {
    test('سطرٌ سليم يعطي Ok بحقوله', () {
      final line = parse('10.0.0.1 200 1200');
      expect(line, isA<Ok>());
      expect((line as Ok).hit, ('10.0.0.1', 200, 1200));
    });

    test('عددُ الحقول الخاطئ يعطي Bad ويسمّي السبب', () {
      final line = parse('مكسور');
      expect(line, isA<Bad>());
      expect((line as Bad).why, contains('حقولٌ 1'));
    });

    test('الحجم غير العدديّ يُرفَض ولا يُقرَّب', () {
      expect(parse('10.0.0.1 200 س'), isA<Bad>());
    });
  });

  group('Tally', () {
    late Tally<String> t;

    setUp(() {
      t = Tally<String>();
    });

    test('يبدأ فارغاً', () {
      expect(t.total, 0);
      expect(t.of('أيّ'), 0);
    });

    test('يجمع بالوزن الافتراضيّ وبالوزن المعطى', () {
      t.add('أ');
      t.add('أ', 4);
      expect(t.of('أ'), 5);
      expect(t.total, 5);
    });

    test('الوسيط باقٍ وقت التشغيل', () {
      expect(t.runtimeType.toString(), 'Tally<String>');
    });
  });
}
