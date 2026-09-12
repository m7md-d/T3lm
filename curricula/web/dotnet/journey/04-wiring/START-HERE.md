# وصل القلب بمنافذه

## نفس المشروع

اعمل داخل مجلد TeamBoard الذي بدأت به. لا تنشئ مشروعًا منفصلًا. ملفات checkpoints مرجع وتعافٍ فقط.

## جاهز لك

الشجرة وملفات المشاريع والعقود والأجزاء غير المستهدفة مجهزة. reference/ نسخة المحطة مكتملة للمقارنة. files-to-copy/ هي الملفات الجديدة أو المعدلة، وفي بعضها TODO للتكليف.

## المطلوب منك

أكمل تسجيل IBoardStore مع InMemoryBoardStore. مرّر نفس use case من controller، ولا تنشئ الخدمة يدويًا داخله.

## أين تبدأ

- `src/TeamBoard.Api/Program.cs`
- `src/TeamBoard.Infrastructure/InMemoryBoardStore.cs`

## ترتيب التنفيذ

1. خذ نسخة محلية من تعديلاتك المهمة قبل مقارنة الملفات.
2. افتح `files-to-copy/`، وانقل الملفات بأسمائها ومساراتها فوق **نفس** مشروعك. لا تنقل مجلد files-to-copy نفسه.
3. اقرأ TODO وأكمل المهمة أعلاه؛ ليس مطلوبًا كتابة جميع الملفات من الصفر.
4. تحقق من السلوك التالي. لو تعثرت افتح reference/ أو changes.patch للمقارنة.

## دليل النجاح

GET /tasks/1 →200؛ PATCH /tasks/1/assignee مع userId2 →204، وuserId3 →400.

الأمر المعتاد: `dotnet build TeamBoard.slnx` ثم `dotnet test TeamBoard.slnx`. قبل محطة08 الهوية ثابتة محليًا لغرض التعلم؛ هذه النسخ لا تُنشر. بعد محطة06 اتبع README لـPostgreSQL، وبعد08 اتبع JWT.

## ملفات انتهى دورها

- احذف من نسخة تعلمك `src/TeamBoard.Api/Controllers/LabUsersController.cs` بعد نقل بديله؛ لا تحذف ملفات أخرى.
