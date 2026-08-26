// استيرادٌ من `lib/src/` مباشرةً — تجاوزٌ للواجهة.
// يمرّ داخل الحزمة نفسها، **ويسقط عند الخصوصية الحقيقية**.
import 'package:shapes/src/internal.dart';

void main() {
  print(_format('مباشرةً'));
}
