var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
var app = builder.Build();
app.Use(async (context, next) =>
{
    var timer = System.Diagnostics.Stopwatch.StartNew();
    await next(context);
    app.Logger.LogInformation("{Method} {Path} -> {Status} in {ElapsedMs}ms",
        context.Request.Method, context.Request.Path,
        context.Response.StatusCode, timer.Elapsed.TotalMilliseconds);
});
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.Run();
public partial class Program { }
