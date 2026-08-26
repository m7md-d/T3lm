// كلُّ ما في `lib/src/` اصطلاحاً **داخليّ**: يُستورَد من داخل الحزمة، ولا
// يَعِد به مؤلّفها أحداً.

String _format(String s) => '«$s»';

String reveal(String s) => _format(s);

String alsoPublic() => 'مرئيّ في الملفّ، غيرُ مُصدَّر من الحزمة';
