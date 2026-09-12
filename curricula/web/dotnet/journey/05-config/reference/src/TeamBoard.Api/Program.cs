using TeamBoard.Application;
using TeamBoard.Infrastructure;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOptions<NotificationOptions>().BindConfiguration("Notifications").Validate(o => o.Mode is "Log" or "Http", "Unknown mode").ValidateOnStart();
builder.Services.AddSingleton<InMemoryBoardState>();
builder.Services.AddScoped<IBoardStore, InMemoryBoardStore>();
builder.Services.AddScoped<IWorkItemService, WorkItemService>();
builder.Services.AddScoped<BoardService>();
builder.Services.AddScoped<IAssignmentNotifier, LogAssignmentNotifier>();
var app = builder.Build();
app.Use(async (context, next) =>
{
    var timer = System.Diagnostics.Stopwatch.StartNew();
    await next(context);
    app.Logger.LogInformation("{Method} {Path} -> {Status} in {ElapsedMs}ms",
        context.Request.Method, context.Request.Path,
        context.Response.StatusCode, timer.Elapsed.TotalMilliseconds);
});
app.UseExceptionHandler();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.Run();
public partial class Program { }
