using TeamBoard.Domain;
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
