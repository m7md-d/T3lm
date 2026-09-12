# TeamBoard · الهيكل السداسي

القلب = Domain + Application. المدخلان في هذا المشروع هما HTTP والاختبار. الأطراف الخارجة هي التخزين والإشعار. لا تعني «سداسي» أن لدينا ست طبقات.

```mermaid
flowchart LR
  HTTP[HTTP / Controller] --> IN[IWorkItemService]
  TEST[Unit test] --> IN
  IN --> UC[WorkItemService]
  UC --> DOMAIN[Domain: membership + title rules]
  UC --> STORE[IBoardStore]
  UC --> NOTICE[IAssignmentNotifier]
  EF[EfBoardStore] -. implements .-> STORE
  MEM[InMemoryBoardStore] -. implements .-> STORE
  WEB[HttpAssignmentNotifier] -. implements .-> NOTICE
  LOG[LogAssignmentNotifier] -. implements .-> NOTICE
  EF --> DB[(PostgreSQL)]
  WEB --> REMOTE[Notification receiver]
```

## UML النموذج

```mermaid
classDiagram
  User "1" --> "*" ProjectMember
  Project "1" --> "*" ProjectMember
  Project "1" --> "*" WorkItem
  WorkItem "1" --> "*" Comment
  User "1" --> "*" Comment : author
  ProjectMember "0..1" <-- "*" WorkItem : assignee membership
  class User { int Id; string Name }
  class Project { int Id; string Name }
  class ProjectMember { int ProjectId; int UserId }
  class WorkItem { int Id; string Title; bool Done; int ProjectId; int? AssigneeId }
  class Comment { int Id; int WorkItemId; int AuthorId; string Text }
```

## أكمل الرسم قبل قراءة implementation

1. لماذا لا يكفي foreign key من AssigneeId إلى User.Id وحده؟
2. من يملك IBoardStore: القلب أم EF adapter؟
3. ارسم ProjectReference من Infrastructure. هل هو نفس اتجاه نداء use case وقت التشغيل؟

الإجابات للمقارنة: FK المركب إلى ProjectMember يحمي الانتماء لنفس المشروع؛ المنفذ يملكه Application؛ Infrastructure يعتمد Application مع أن Application ينادي implementation وقت التشغيل عبر العقد.

## حدود مقصودة

- IBoardStore منفذ خاص بحاجات هذا التطبيق، وليس generic repository.
- بعض نماذج domain هنا بيانات بسيطة؛ لا نزعم أنها DDD كاملة.
- لا IQueryable ولا DbContext ولا HttpContext في Application.
- Program.cs يعرف adapters لأنه composition root. Controllers لا تستورد EF.
- الحفظ يسبق الإشعار. الإشعار best effort؛ فشله لا يتراجع عن الحفظ. لا outbox أو تسليم مضمون في هذه الرحلة.
- اختبار test authentication يختبر الصلاحية، ولا يثبت JWT signature validation.
- SQLite في الاختبارات لا يغني عن PostgreSQL عندما نختبر provider أو migrations.
