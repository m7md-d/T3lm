using System.Diagnostics;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using TeamBoard.Domain;
using TeamBoard.Application;
using TeamBoard.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddOptions<NotificationOptions>().BindConfiguration("Notifications")
    .Validate(o => o.Mode is "Log" or "Http", "Unknown notification mode")
    .Validate(o => o.Mode != "Http" ||
        (Uri.TryCreate(o.BaseUrl, UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https"),
        "HTTP notifications need a valid BaseUrl")
    .ValidateOnStart();
builder.Services.AddScoped<IWorkItemService, WorkItemService>();
builder.Services.AddScoped<BoardService>();
if (builder.Configuration["Database:Provider"] == "Memory")
{
    builder.Services.AddSingleton<InMemoryBoardState>();
    builder.Services.AddScoped<IBoardStore, InMemoryBoardStore>();
}
else builder.Services.AddScoped<IBoardStore, EfBoardStore>();
builder.Services.AddScoped<IAssignmentNotifier, LogAssignmentNotifier>();
builder.Services.AddDbContext<BoardDbContext>(options =>
{
    var provider = builder.Configuration["Database:Provider"] ?? "Postgres";
    var connection = builder.Configuration.GetConnectionString("Board")
        ?? throw new InvalidOperationException("Missing ConnectionStrings:Board");
    if (provider == "Sqlite") options.UseSqlite(connection);
    else if (provider == "Postgres") options.UseNpgsql(connection);
    else throw new InvalidOperationException("Unknown database provider");
});
var app = builder.Build();
app.Use(async (context, next) =>
{
    var clock = Stopwatch.StartNew();
    await next(context);
    app.Logger.LogInformation("{Method} {Path} -> {Status} in {ElapsedMs}ms", context.Request.Method,
        context.Request.Path, context.Response.StatusCode, clock.Elapsed.TotalMilliseconds);
});
app.UseExceptionHandler();
app.UseRouting();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
if (app.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("Lab:Initialize") && builder.Configuration["Database:Provider"] != "Memory")
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<BoardDbContext>();
    // Only the disposable SQLite lab uses EnsureCreated. PostgreSQL uses reviewed migrations.
    if (db.Database.IsSqlite()) await db.Database.EnsureCreatedAsync();
    await Seed.ApplyAsync(db);
}
app.Run();
public partial class Program { }
