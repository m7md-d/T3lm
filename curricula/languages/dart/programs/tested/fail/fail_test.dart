// اختبارٌ **مقصودُ الفشل** — يُشغَّل وحده ليُري شكل الرسالة.
// وهو خارج `test/` فلا يدخل التشغيل العاديّ.
import 'package:tested/tally.dart';
import 'package:test/test.dart';

void main() {
  test('ادّعاءٌ خاطئ عمداً', () {
    final line = parse('10.0.0.1 200 1200');
    expect((line as Ok).hit, ('10.0.0.1', 404, 1200));
  });
}
