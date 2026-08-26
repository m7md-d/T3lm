import 'shapes.dart';

class Mine implements Based {
  @override
  void go() => print('mine');
}

void main() => Mine().go();
