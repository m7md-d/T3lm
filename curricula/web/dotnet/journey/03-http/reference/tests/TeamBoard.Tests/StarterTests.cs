using Microsoft.AspNetCore.Mvc.Testing;
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
