import 'shapes.dart';

class Mine implements Plain {
  @override
  void go() => print('mine');
}

void main() => Mine().go();
