using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TeamBoard.Application;
using TeamBoard.Infrastructure;

namespace TeamBoard.Tests;

public sealed class BoardFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    public RecordingNotifier Notifications { get; } = new();
    public BoardFactory() => connection.Open();
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<BoardDbContext>();
            services.RemoveAll<DbContextOptions<BoardDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<BoardDbContext>>();
            services.AddDbContext<BoardDbContext>(o => o.UseSqlite(connection));
            services.RemoveAll<IAssignmentNotifier>();
            services.AddSingleton<IAssignmentNotifier>(Notifications);
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "Test";
                options.DefaultChallengeScheme = "Test";
                options.DefaultForbidScheme = "Test";
            }).AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });
        });
    }
    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BoardDbContext>();
        db.Database.EnsureCreated();
        Seed.ApplyAsync(db).GetAwaiter().GetResult();
        return host;
    }
    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) connection.Dispose();
    }
    public HttpClient ClientAs(string? id)
    {
        var client = CreateClient();
        if (id is not null) client.DefaultRequestHeaders.Add("Test-User", id);
        return client;
    }
    public async Task<int?> ReadAssigneeAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BoardDbContext>();
        return await db.WorkItems.AsNoTracking().Where(x => x.Id == 1).Select(x => x.AssigneeId).SingleAsync();
    }
}
public sealed class TestAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Test-User", out var id))
            return Task.FromResult(AuthenticateResult.NoResult());
        var identity = new ClaimsIdentity([new Claim("sub", id.ToString())], "Test");
        return Task.FromResult(AuthenticateResult.Success(new(new ClaimsPrincipal(identity), "Test")));
    }
}
public sealed class RecordingNotifier : IAssignmentNotifier
{
    public List<AssignmentNotice> Notices { get; } = [];
    public Task<bool> NotifyAsync(AssignmentNotice notice, CancellationToken ct)
    {
        Notices.Add(notice);
        return Task.FromResult(true);
    }
}
