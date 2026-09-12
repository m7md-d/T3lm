from pathlib import Path
import json, zipfile, difflib, html, re
root=Path(__file__).resolve().parents[1]
project=root/'project'; public=root/'site/public'; out=root/'journey'
public.mkdir(parents=True,exist_ok=True);(public/'stages').mkdir(exist_ok=True);out.mkdir(exist_ok=True)
# Generated standalone pages and browser assets share the course palette.
palette=(root/'site/src/styles/tokens.css').read_text()
(public/'tokens.css').write_text(palette)
colours=dict(re.findall(r'--([\w-]+):\s*(#[\da-fA-F]+)',palette))
(public/'favicon.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="{colours["surface-deep"]}"/><path d="M12 32h40" stroke="{colours["adapter"]}" stroke-width="4"/><path d="M24 18h16l8 14-8 14H24l-8-14z" fill="{colours["core-dim"]}" stroke="{colours["core"]}" stroke-width="3"/></svg>')
index=root/'site/index.html'
index.write_text(re.sub(r'(<meta name="theme-color" content=")[^"]+',lambda m:m[1]+colours['surface-void'],index.read_text()))

exclude={'bin','obj','.git','TestResults'}
files={str(p.relative_to(project)):p.read_text() for p in project.rglob('*') if p.is_file() and not any(x in exclude for x in p.relative_to(project).parts) and p.suffix not in ['.db','.zip']}
D='src/TeamBoard.Domain/';A='src/TeamBoard.Application/';I='src/TeamBoard.Infrastructure/';P='src/TeamBoard.Api/';T='tests/TeamBoard.Tests/'
stages=[
('00-start','تشغيل الهيكل الجاهز','افتح Program.cs، غيّر الاسم، ثم أعد 404 لأي رقم غير42. الشجرة وملفات المشاريع وUML جاهزة.','GET /users/42 →200، وGET /users/7 →404 بعد تعديله.',[P+'Program.cs']),
('01-domain','عقود المهام وقاعدة العنوان','أكمل TitleRules.IsValid: ارفض null والفراغ، واقبل حتى120 حرفًا بعد Trim. راجع record TaskDto وجرب with وLINQ داخل اختبار.','dotnet test؛ تمر الحالات الفارغة وحدا120 و121.',[D+'Model.cs',T+'TitleRulesTests.cs']),
('02-ports','المنافذ واتجاه الاعتماد','أكمل CancellationToken في منفذ الإشعار. ارسم implements من adapter إلى العقد. تأكد أن Application لا تستورد EF أو ASP.NET.','dotnet build ينجح، وتشرح الفرق بين اتجاه النداء واتجاه ProjectReference.',[A+'Ports.cs',A+'WorkItemService.cs']),
('03-http','مدخل HTTP وسجل الطلب','أكمل شرط المستخدم المفقود في LabUsersController. ضع logger حول pipeline وتوقع ترتيب الدخول والخروج.','GET /users/42 →200 و/users/7 →404؛ ترى method/path/status/time.',[P+'Program.cs',P+'Controllers/LabUsersController.cs']),
('04-wiring','وصل القلب بمنافذه','أكمل تسجيل IBoardStore مع InMemoryBoardStore. مرّر نفس use case من controller، ولا تنشئ الخدمة يدويًا داخله.','GET /tasks/1 →200؛ PATCH /tasks/1/assignee مع userId2 →204، وuserId3 →400.',[P+'Program.cs',I+'InMemoryBoardStore.cs']),
('05-config','الإعدادات والسجل المنظم','فعّل Information في ملف Development. بدّل قيمة إعداد من environment ولا تطبع الأسرار.','ترى سجل taskId وassigneeId عند نجاح التعيين؛ تخفض الضوضاء بإعداد category.',[P+'appsettings.Development.json']),
('06-persistence','EF adapter وPostgreSQL','أكمل Where في ListTasksAsync بحيث يقيد النتائج بالمشروع المطلوب. راجع migration ثم طبّقها على حاوية المختبر. سجّل SQL.','بعد إعادة تشغيل API تبقى البيانات. /projects/1/tasks لا يعرض مهام مشروع آخر.',[I+'EfBoardStore.cs',I+'BoardDbContext.cs']),
('07-contracts','عقود API والتعليقات','اجعل POST مهمة يرجع CreatedAtAction بدل200. أكمل الفرق بين request DTO وentity؛ جرّب blank title وتعليق من مستخدم غير عضو.','POST →201 مع Location صالح؛ التحديث204 بلا body؛ التحقق400.',[P+'Controllers/WorkItemsController.cs']),
('08-identity','هوية الفاعل وعضوية المرشح','أكمل فحص عضوية المرشح في WorkItemService. الهوية الآن من JWT، وليس المعرّف التجريبي الثابت. أعد تشغيل API بعد إنشاء token التطوير.','بلا token →401، فاعل3 →403، فاعل1 ومرشح3 →400 دون حفظ أو إشعار.',[A+'WorkItemService.cs',P+'Controllers/ApiController.cs']),
('09-notification','الإشعار عبر HTTP adapter','أكمل EnsureSuccessStatusCode. شغّل notification-receiver.py ثم بدّل Notifications:Mode إلىHttp. أوقف المستقبل وراقب بقاء الحفظ.', 'الإشعار يصل بعد تعيين صحيح فقط. فشل HTTP يظهر في السجل، ولا يلغي التعيين المحفوظ.',[I+'AssignmentNotifiers.cs',P+'Program.cs']),
('10-tests','اختبار نفس القلب من مدخل آخر','أكمل assertions للاختبار الذي يستدعي WorkItemService دون HTTP أوEF. شغّل ApiTests واقرأ الفرق بين test auth والتحقق الحقيقي منJWT.','dotnet test يمر؛ إثبات عدم الكتابة وعدم الإشعار عند الرفض، ووجود FK مركب.',[T+'HexagonTests.cs',T+'ApiTests.cs']),
('11-feature','ميزة مستقلة: إلغاء التعيين','أضف DELETE /tasks/{id}/assignee. لا migration لأن AssigneeId اختيارية أصلًا. المطلوب منك port/use case/endpoint/tests؛ المساعدة أقل هنا.','فاعل عضو →204 والقيمةnull؛ غير عضو →403 بلا تغيير؛ مفقودة404؛ تكرار الإلغاء204.',[A+'Ports.cs',A+'WorkItemService.cs',P+'Controllers/WorkItemsController.cs'])]
minimal='''using TeamBoard.Domain;
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/users/{id:int}", (int id) =>
{
    if (id != 42) return Results.NotFound();
    return Results.Ok(new UserDto(id, "Nora"));
});
app.Run();
public partial class Program { }
'''
logger='''app.Use(async (context, next) =>
{
    var timer = System.Diagnostics.Stopwatch.StartNew();
    await next(context);
    app.Logger.LogInformation("{Method} {Path} -> {Status} in {ElapsedMs}ms",
        context.Request.Method, context.Request.Path,
        context.Response.StatusCode, timer.Elapsed.TotalMilliseconds);
});
'''
labcontroller='''using Microsoft.AspNetCore.Mvc;
using TeamBoard.Domain;
namespace TeamBoard.Api.Controllers;
[ApiController, Route("users")]
public sealed class LabUsersController : ControllerBase
{
    [HttpGet("{id:int}")]
    public ActionResult<UserDto> Get(int id)
    {
        if (id != 42) return NotFound();
        return Ok(new UserDto(id, "Nora"));
    }
}
'''
smoke='''using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
namespace TeamBoard.Tests;
public class StarterTests
{
    [Fact]
    public async Task Application_starts_and_answers_health()
    {
        using var app = new WebApplicationFactory<Program>();
        using var client = app.CreateClient();
        using var response = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
'''
def snapshot(n):
 s={k:v for k,v in files.items() if not k.endswith('.cs')}
 s[D+'Model.cs']=files[D+'Model.cs']
 s[P+'appsettings.json']=json.dumps({'Database':{'Provider':'Memory'},'Notifications':{'Mode':'Log'},'Logging':{'LogLevel':{'Default':'Information','Microsoft.AspNetCore':'Warning'}}},indent=2)
 s[P+'Properties/launchSettings.json']=json.dumps({'profiles':{'Lab':{'commandName':'Project','applicationUrl':'http://localhost:5080','environmentVariables':{'ASPNETCORE_ENVIRONMENT':'Development','Database__Provider':'Memory'}}}},indent=2)
 s[P+'Program.cs']=minimal
 s[T+'StarterTests.cs']=smoke
 if n>=1:s[T+'TitleRulesTests.cs']=files[T+'TitleRulesTests.cs']
 if n>=2:
  for k,v in files.items():
   if k.startswith(A) and k.endswith('.cs'):s[k]=v
 if n==3:
  s[P+'Program.cs']='''var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
var app = builder.Build();
'''+logger+'''app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.Run();
public partial class Program { }
'''
  s[P+'Controllers/LabUsersController.cs']=labcontroller
 if n>=4:
  for k,v in files.items():
   if k.endswith('.cs') and (k.startswith(A) or k.startswith(I) or k.startswith(P)):s[k]=v
  # Before EF, remove EF source, migrations, and seed; the use cases use Memory.
  if n<6:
   for k in list(s):
    if k.startswith(I) and (k.endswith('BoardDbContext.cs') or k.endswith('EfBoardStore.cs') or k.endswith('Seed.cs') or '/Migrations/' in k):del s[k]
   pg='''using TeamBoard.Application;
using TeamBoard.Infrastructure;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddSingleton<InMemoryBoardState>();
builder.Services.AddScoped<IBoardStore, InMemoryBoardStore>();
builder.Services.AddScoped<IWorkItemService, WorkItemService>();
builder.Services.AddScoped<BoardService>();
builder.Services.AddScoped<IAssignmentNotifier, LogAssignmentNotifier>();
var app = builder.Build();
'''+logger+'''app.UseExceptionHandler();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.Run();
public partial class Program { }
'''
   if n>=5:
    pg=pg.replace('builder.Services.AddProblemDetails();', 'builder.Services.AddProblemDetails();\nbuilder.Services.AddOptions<NotificationOptions>().BindConfiguration("Notifications").Validate(o => o.Mode is "Log" or "Http", "Unknown mode").ValidateOnStart();')
   s[P+'Program.cs']=pg
  if n<7:
   for name in ['ProjectsController.cs','CommentsController.cs']:s.pop(P+'Controllers/'+name,None)
  if n<8:
   s[P+'Controllers/ApiController.cs']=s[P+'Controllers/ApiController.cs'].replace('[ApiController, Authorize]','[ApiController]')
   x=s[P+'Controllers/ApiController.cs'];start=x.index('    protected int? ActorId');end=x.index('    protected ActionResult Failure',start)
   s[P+'Controllers/ApiController.cs']=x[:start]+'    // Learning checkpoint only: fixed actor, loopback only. Replaced by JWT in stage 08.\n    protected int? ActorId => 1;\n'+x[end:]
   x=s[P+'Program.cs']
   if 'builder.Services.AddAuthentication(' in x:
    start=x.index('builder.Services.AddAuthentication(');end=x.index('var app = builder.Build();',start)
    x=x[:start]+x[end:]
   x=x.replace('app.UseAuthentication();\n','').replace('app.UseAuthorization();\n','')
   s[P+'Program.cs']=x
  if n<9:
   x=s[P+'Program.cs'];start=x.find('if (builder.Configuration["Notifications:Mode"]')
   if start>=0:
    end=x.index('builder.Services.AddDbContext',start)
    x=x[:start]+'builder.Services.AddScoped<IAssignmentNotifier, LogAssignmentNotifier>();\n'+x[end:]
   s[P+'Program.cs']=x
 if n>=6:
  s[P+'appsettings.json']=files[P+'appsettings.json']
  s[P+'Properties/launchSettings.json']=files[P+'Properties/launchSettings.json']
 if n>=10:
  for k in list(s):
   if k.startswith(T) and k.endswith('.cs'):del s[k]
  for k,v in files.items():
   if k.startswith(T) and k.endswith('.cs'):s[k]=v
 return s

def incomplete(n,s):
 w={}
 def change(k,a,b):
  if a not in s[k]:raise Exception(f'Missing exercise anchor {n}: {k}')
  w[k]=s[k].replace(a,b,1)
 if n==0:change(P+'Program.cs','    if (id != 42) return Results.NotFound();','    // TODO: return NotFound when id is not 42.')
 if n==1:change(D+'Model.cs','!string.IsNullOrWhiteSpace(title) && title.Trim().Length <= 120;','false; // TODO: validate null, whitespace and trimmed length.')
 if n==2:change(A+'Ports.cs','Task<bool> NotifyAsync(AssignmentNotice notice, CancellationToken ct);','// TODO: explain why the token crosses this outbound port.\n    Task<bool> NotifyAsync(AssignmentNotice notice, CancellationToken ct);')
 if n==3:change(P+'Controllers/LabUsersController.cs','        if (id != 42) return NotFound();','        // TODO: missing user should return 404.')
 if n==4:change(P+'Program.cs','builder.Services.AddScoped<IBoardStore, InMemoryBoardStore>();','// TODO: register IBoardStore with its in-memory adapter.')
 if n==5:
  k=P+'appsettings.Development.json';v=json.loads(s[k]);v.setdefault('Logging',{}).setdefault('LogLevel',{})['Default']='None';w[k]=json.dumps(v,indent=2)
 if n==6:change(I+'EfBoardStore.cs','db.WorkItems.Where(t => t.ProjectId == id).OrderBy','db.WorkItems /* TODO: filter by project id */.OrderBy')
 if n==7:change(P+'Controllers/WorkItemsController.cs','? CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value)','? Ok(result.Value) // TODO: return 201 and a working Location')
 if n==8:change(A+'WorkItemService.cs','        if (!await store.IsMemberAsync(item.ProjectId, assigneeId, ct)) return ChangeResult.InvalidAssignee;','        // TODO: reject an assignee who is not a member of this project.')
 if n==9:change(I+'AssignmentNotifiers.cs','            response.EnsureSuccessStatusCode();','            // TODO: a non-success HTTP response must be treated as a failed notification.')
 if n==10:change(T+'HexagonTests.cs','        Assert.Equal(expected, result);','        Assert.True(false, "TODO: assert the expected use-case result");')
 return w

def zip_files(path,data,prefix=''):
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
  for k,v in data.items():z.writestr(prefix+k,v)

previous={};journey_bundle={};descriptions=[]
for n,(sid,title,task,check,focus) in enumerate(stages):
 s=snapshot(n);changed={k:v for k,v in s.items() if previous.get(k)!=v};removed=[k for k in previous if k not in s];work=incomplete(n,s)
 brief=f'''# {title}

## نفس المشروع

اعمل داخل مجلد TeamBoard الذي بدأت به. لا تنشئ مشروعًا منفصلًا. ملفات checkpoints مرجع وتعافٍ فقط.

## جاهز لك

الشجرة وملفات المشاريع والعقود والأجزاء غير المستهدفة مجهزة. reference/ نسخة المحطة مكتملة للمقارنة. files-to-copy/ هي الملفات الجديدة أو المعدلة، وفي بعضها TODO للتكليف.

## المطلوب منك

{task}

## أين تبدأ

'''+''.join(f'- `{p}`\n' for p in focus)+f'''
## ترتيب التنفيذ

1. خذ نسخة محلية من تعديلاتك المهمة قبل مقارنة الملفات.
2. افتح `files-to-copy/`، وانقل الملفات بأسمائها ومساراتها فوق **نفس** مشروعك. لا تنقل مجلد files-to-copy نفسه.
3. اقرأ TODO وأكمل المهمة أعلاه؛ ليس مطلوبًا كتابة جميع الملفات من الصفر.
4. تحقق من السلوك التالي. لو تعثرت افتح reference/ أو changes.patch للمقارنة.

## دليل النجاح

{check}

الأمر المعتاد: `dotnet build TeamBoard.slnx` ثم `dotnet test TeamBoard.slnx`. قبل محطة08 الهوية ثابتة محليًا لغرض التعلم؛ هذه النسخ لا تُنشر. بعد محطة06 اتبع README لـPostgreSQL، وبعد08 اتبع JWT.
'''
 if removed:brief+='\n## ملفات انتهى دورها\n\n'+''.join(f'- احذف من نسخة تعلمك `{p}` بعد نقل بديله؛ لا تحذف ملفات أخرى.\n' for p in removed)
 if n==0:brief+='\nحزمة البداية مستقلة عن ملفات copy: فك teamboard-starter.zip مرة واحدة، ثم عدّل Program.cs مباشرة.\n'
 if n==11:brief+='''
## نموذج الحل عند الحاجة

أضف method إلى IWorkItemService باسم UnassignAsync. التنفيذ: FindTaskAsync، ثم NotFound عند الغياب، ثم IsMemberAsync للفاعل على ProjectId المخزن، ثم Forbidden عند الرفض، ثم AssigneeId = null، وCommitAsync، وSuccess. أضف endpoint DELETE يستخرج ActorId من الهوية ويحوّل النتائج كما في Assign. لا ترسل AssignmentNotice القديمة عند الإلغاء لأنها تصف فعلًا مختلفًا. اختبر التكرار كنجاح بلا تغيير. لا migration إضافية.
'''
 patch=''.join(''.join(difflib.unified_diff(previous.get(k,'').splitlines(True),s.get(k,'').splitlines(True),fromfile='a/'+k,tofile='b/'+k)) for k in sorted(set(previous)|set(s)) if previous.get(k)!=s.get(k))
 payload={'START-HERE.md':brief,'changes.patch':patch,'changes.json':json.dumps({'copy':list(changed),'remove':removed},ensure_ascii=False,indent=2)}
 payload.update({'files-to-copy/'+k:v for k,v in {**changed,**work}.items()});payload.update({'reference/'+k:v for k,v in s.items()})
 zip_files(public/'stages'/f'{sid}.zip',payload)
 for k,v in payload.items():journey_bundle[f'{sid}/{k}']=v
 stage_dir=out/sid;stage_dir.mkdir(exist_ok=True);(stage_dir/'START-HERE.md').write_text(brief)
 (stage_dir/'changes.patch').write_text(patch)
 # Snapshots live as source outside the site output so every reference can be built.
 for k,v in s.items():
  f=stage_dir/'reference'/k;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(v)
 body=html.escape(brief)
 code=''.join(f'<details><summary dir="ltr">{html.escape(k)}</summary><pre dir="ltr">{html.escape(v)}</pre></details>' for k,v in {**changed,**work}.items() if k.endswith(('.cs','.json','.csproj')))
 page=f'''<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} · TeamBoard</title><link rel="stylesheet" href="../tokens.css"><style>@font-face{{font-family:Readex;src:url('../fonts/ReadexPro-400-arabic.woff2')}}*{{box-sizing:border-box}}body{{background:var(--surface-void);color:var(--fg);font:16px/2 Readex,sans-serif;margin:auto;max-width:960px;padding:30px 24px}}a{{color:var(--adapter)}}h1{{font-size:28px}}.brief{{white-space:pre-wrap;font:inherit}}details{{border:1px solid var(--line);border-radius:10px;margin:18px 0;padding:16px}}summary{{cursor:pointer;overflow-wrap:anywhere;font:14px/2 monospace}}pre{{background:var(--surface-code);color:var(--fg);padding:18px;overflow:auto;text-align:left;unicode-bidi:isolate;font:13px/1.9 monospace}}nav{{display:flex;gap:24px;flex-wrap:wrap}}</style><nav><a href="../#home">الرئيسية</a><a href="./{sid}.zip" download>تنزيل ملفات المحطة</a></nav><h1>{title}</h1><div class="brief">{body}</div><h2>الملفات المجهزة للنسخ والتعديل</h2>{code}</html>'''
 (public/'stages'/f'{sid}.html').write_text(page)
 descriptions.append({'id':sid,'title':title,'task':task,'check':check,'files':focus,'changedFiles':list(changed),'removedFiles':removed})
 if n==0:
  starter={**s,**work,'START-HERE.md':brief}
  starter['JOURNEY.md']='مشروع واحد: اتبع محطات موقع مسار .NET، وانقل ملفات المحطة فوق نفس المجلد. اقرأ START-HERE.md.\n'
  zip_files(public/'teamboard-starter.zip',starter,'TeamBoard/')
 previous=s
journey_bundle['README.md']='ابدأ من 00-start. كل محطة تضيف أو تعدل نفس TeamBoard. START-HERE.md يحدد الجاهز والمطلوب وعلامة النجاح. reference للمقارنة وfiles-to-copy للعمل.\n'
zip_files(public/'teamboard-journey.zip',journey_bundle,'TeamBoard-Journey/')
zip_files(public/'teamboard.zip',files,'TeamBoard/')
(root/'content/stages.json').write_text(json.dumps(descriptions,ensure_ascii=False,indent=2)+'\n')
print(f'Packaged {len(stages)} stages, starter, journey and reference; {len(files)} reference source files.')
