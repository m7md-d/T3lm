# TeamBoard — مشروع رحلة .NET

هذا المشروع الوحيد في المنهج. استخدم مجلد عمل واحدًا. حزمة البداية تعطيك الشجرة والرسم وأول endpoint؛ ملفات المحطات تضيف أجزاءً إلى نفس المجلد. الحل المرجعي للمقارنة، وليس بديلًا عن تنفيذ التكليف.

## المتطلبات

.NET SDK 10. حزمة البداية تعمل دون database. النسخة النهائية تستخدم PostgreSQL؛ SQLite داخل اختبارات التكامل فقط. تثبت ملفات المشروع إصدارات حزم متوافقة؛ اتبع lockfile عند توفيره.

## تشغيل البداية

```sh
dotnet restore TeamBoard.slnx
dotnet run --project src/TeamBoard.Api --urls http://localhost:5080
curl -i http://localhost:5080/users/42
```

هذه الأوامر تخص حزمة البداية. بعد محطة controllers تصبح الهوية المحلية التجريبية رقم1، وبعد محطة auth تحتاج JWT.

## تشغيل المرجع الكامل مع PostgreSQL

جهّز حاوية مختبر محلية فقط:

```sh
docker compose up -d
dotnet restore TeamBoard.slnx
dotnet tool restore
dotnet user-secrets set "ConnectionStrings:Board" "Host=localhost;Port=5438;Database=teamboard;Username=teamboard;Password=local-lab-only" --project src/TeamBoard.Api
```

لا تطبق migrations على قاعدة الفريق. بعد مراجعة ملفاتها:

```sh
dotnet ef migrations script --project src/TeamBoard.Infrastructure --startup-project src/TeamBoard.Api
dotnet ef database update --project src/TeamBoard.Infrastructure --startup-project src/TeamBoard.Api
dotnet run --project src/TeamBoard.Api --launch-profile Postgres
```

ملف Postgres يفعّل Development وتهيئة seed. البيانات: Nora رقم1 وOmar رقم2 في المشروع1، وLina رقم3 في المشروع2. أول مهمة رقم1 في المشروع1. قاعدة جديدة لا تشارك بيانات إنتاج.

## هوية التطوير

من مجلد المشروع شغّل الأداة الرسمية؛ ستكتب الإعداد العام في appsettings.Development.json ومفتاح التوقيع في user secrets:

```sh
dotnet user-jwts create --project src/TeamBoard.Api --name 1 --audience http://localhost:5080
```

احتفظ بالـtoken محليًا ولا تضعه في ملفات تسلمها أو مستودعك. أعد تشغيل API بعد الإنشاء. استخدمه في terminal ثانٍ (استبدل النص يدويًا):

```sh
curl -i http://localhost:5080/tasks/1 -H 'Authorization: Bearer YOUR_LOCAL_TOKEN'
curl -i -X PATCH http://localhost:5080/tasks/1/assignee -H 'Content-Type: application/json' -H 'Authorization: Bearer YOUR_LOCAL_TOKEN' -d '{"userId":2}'
```

إذا أداة إصدارك تضع subject غير رقمي افحص claims بـ`dotnet user-jwts print ID`، وأنشئ token يطابق عقد sub الرقمي في التطبيق. لا تعطل issuer أو signature validation. خارج Development يحتاج التطبيق Auth:Authority وAuth:Audience من موفر هوية حقيقي؛ التطبيق ليس خدمة إصدار tokens.

## الإشعار: بدّل الطرف

الافتراضي LogAssignmentNotifier؛ يسجل الإشعار محليًا. لتجربة HTTP شغّل مستقبل المختبر المرفق، وهو أداة جاهزة لا مشروع منهج ثانٍ:

```sh
python3 tools/notification-receiver.py
```

ثم في terminal آخر:

```sh
Notifications__Mode=Http Notifications__BaseUrl=http://127.0.0.1:5090/ dotnet run --project src/TeamBoard.Api --launch-profile Postgres
```

PowerShell: اضبط `$env:Notifications__Mode="Http"` و`$env:Notifications__BaseUrl="http://127.0.0.1:5090/"` ثم شغّل dotnet run.

العميل يرسل POST /notifications. التعيين يُحفظ قبل الإشعار. توقف المستقبل يؤدي إلى warning مع بقاء التعيين محفوظًا. هذا best effort، لا ضمان تسليم. لا retry أو outbox في المنهج.

## الاختبارات

```sh
dotnet test TeamBoard.slnx
```

- TitleRulesTests: قواعد العنوان وحدوده.
- HexagonTests: نفس use case دون ASP.NET أو EF، عبر InMemoryBoardStore وnotifier بديل.
- ApiTests: HTTP + DI + authorization + SQLite مؤقتة مع foreign keys.
- NotificationTests: HTTP adapter عبر handler بديل دون شبكة.

Test-User header موجود في test host فقط. لا يقبله API الحقيقي. هذه الاختبارات لا تثبت JWT signatures أو ترجمة PostgreSQL؛ افحصهما بمختبر التشغيل الفعلي.

## الملفات حسب المسؤولية

| الموقع | المسؤولية |
|---|---|
| Domain/Model.cs | entities وDTOs المشتركة وقواعد العنوان |
| Application/Ports.cs | عقود الدخول والخروج، بلا أنواع EF أو HTTP |
| Application/WorkItemService.cs | إنشاء المهمة وتعيينها والتحقق من العضوية |
| Application/BoardService.cs | قراءة المشاريع والمستخدمين والتعليقات |
| Infrastructure/BoardDbContext.cs | model mapping وFK المركب |
| Infrastructure/EfBoardStore.cs | queries والحفظ عبر EF |
| Infrastructure/InMemoryBoardStore.cs | طرف تعليمي بديل لا يقلّد كل ضمانات database |
| Infrastructure/AssignmentNotifiers.cs | طرف Log وطرف HTTP |
| Api/Program.cs | composition root وmiddleware |
| Api/Controllers/ | تحويل HTTP إلى use cases ونتائجها إلى response |

## حدود النطاق

تطبيق واحد، بلا microservices وDDD framework وCQRS وMediatR. العضوية seeded لتقليل CRUD الإداري. لا UI خاص بـTeamBoard؛ واجهتك التعليمية هي موقع المنهج، وTeamBoard API هو مشروع التطبيق. كل محطة تضيف معنىً إلى نفس المشروع. اقرأ ARCHITECTURE.md قبل ترتيب ملفات جديدة.
