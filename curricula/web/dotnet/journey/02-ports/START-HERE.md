# المنافذ واتجاه الاعتماد

## نفس المشروع

اعمل داخل مجلد TeamBoard الذي بدأت به. لا تنشئ مشروعًا منفصلًا. ملفات checkpoints مرجع وتعافٍ فقط.

## جاهز لك

الشجرة وملفات المشاريع والعقود والأجزاء غير المستهدفة مجهزة. reference/ نسخة المحطة مكتملة للمقارنة. files-to-copy/ هي الملفات الجديدة أو المعدلة، وفي بعضها TODO للتكليف.

## المطلوب منك

أكمل CancellationToken في منفذ الإشعار. ارسم implements من adapter إلى العقد. تأكد أن Application لا تستورد EF أو ASP.NET.

## أين تبدأ

- `src/TeamBoard.Application/Ports.cs`
- `src/TeamBoard.Application/WorkItemService.cs`

## ترتيب التنفيذ

1. خذ نسخة محلية من تعديلاتك المهمة قبل مقارنة الملفات.
2. افتح `files-to-copy/`، وانقل الملفات بأسمائها ومساراتها فوق **نفس** مشروعك. لا تنقل مجلد files-to-copy نفسه.
3. اقرأ TODO وأكمل المهمة أعلاه؛ ليس مطلوبًا كتابة جميع الملفات من الصفر.
4. تحقق من السلوك التالي. لو تعثرت افتح reference/ أو changes.patch للمقارنة.

## دليل النجاح

dotnet build ينجح، وتشرح الفرق بين اتجاه النداء واتجاه ProjectReference.

الأمر المعتاد: `dotnet build TeamBoard.slnx` ثم `dotnet test TeamBoard.slnx`. قبل محطة08 الهوية ثابتة محليًا لغرض التعلم؛ هذه النسخ لا تُنشر. بعد محطة06 اتبع README لـPostgreSQL، وبعد08 اتبع JWT.
