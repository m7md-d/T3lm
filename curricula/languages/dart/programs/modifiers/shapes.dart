// مكتبةٌ تُستورَد — والقيود لا تعمل إلّا عبر حدّ المكتبة.

class Plain {
  void go() => print('plain');
}

base class Based {
  void go() => print('based');
}

interface class Faced {
  void go() => print('faced');
}

final class Locked {
  void go() => print('locked');
}
