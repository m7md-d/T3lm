# ميزة مستقلة: إلغاء التعيين

## نفس المشروع

اعمل داخل مجلد TeamBoard الذي بدأت به. لا تنشئ مشروعًا منفصلًا. ملفات checkpoints مرجع وتعافٍ فقط.

## جاهز لك

الشجرة وملفات المشاريع والعقود والأجزاء غير المستهدفة مجهزة. reference/ نسخة المحطة مكتملة للمقارنة. files-to-copy/ هي الملفات الجديدة أو المعدلة، وفي بعضها TODO للتكليف.

## المطلوب منك

أضف DELETE /tasks/{id}/assignee. لا migration لأن AssigneeId اختيارية أصلًا. المطلوب منك port/use case/endpoint/tests؛ المساعدة أقل هنا.

## أين تبدأ

- `src/TeamBoard.Application/Ports.cs`
- `src/TeamBoard.Application/WorkItemService.cs`
- `src/TeamBoard.Api/Controllers/WorkItemsController.cs`

## ترتيب التنفيذ

1. خذ نسخة محلية من تعديلاتك المهمة قبل مقارنة الملفات.
2. افتح `files-to-copy/`، وانقل الملفات بأسمائها ومساراتها فوق **نفس** مشروعك. لا تنقل مجلد files-to-copy نفسه.
3. اقرأ TODO وأكمل المهمة أعلاه؛ ليس مطلوبًا كتابة جميع الملفات من الصفر.
4. تحقق من السلوك التالي. لو تعثرت افتح reference/ أو changes.patch للمقارنة.

## دليل النجاح

فاعل عضو →204 والقيمةnull؛ غير عضو →403 بلا تغيير؛ مفقودة404؛ تكرار الإلغاء204.

الأمر المعتاد: `dotnet build TeamBoard.slnx` ثم `dotnet test TeamBoard.slnx`. قبل محطة08 الهوية ثابتة محليًا لغرض التعلم؛ هذه النسخ لا تُنشر. بعد محطة06 اتبع README لـPostgreSQL، وبعد08 اتبع JWT.

## نموذج الحل عند الحاجة

أضف method إلى IWorkItemService باسم UnassignAsync. التنفيذ: FindTaskAsync، ثم NotFound عند الغياب، ثم IsMemberAsync للفاعل على ProjectId المخزن، ثم Forbidden عند الرفض، ثم AssigneeId = null، وCommitAsync، وSuccess. أضف endpoint DELETE يستخرج ActorId من الهوية ويحوّل النتائج كما في Assign. لا ترسل AssignmentNotice القديمة عند الإلغاء لأنها تصف فعلًا مختلفًا. اختبر التكرار كنجاح بلا تغيير. لا migration إضافية.
