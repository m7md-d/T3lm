using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using TeamBoard.Application;
using TeamBoard.Infrastructure;
namespace TeamBoard.Tests;
public class NotificationTests
{
    [Theory]
    [InlineData(HttpStatusCode.NoContent, true)]
    [InlineData(HttpStatusCode.InternalServerError, false)]
    public async Task Adapter_reports_delivery_without_real_network(HttpStatusCode status, bool expected)
    {
        using var handler = new ReplyHandler(status);
        using var http = new HttpClient(handler) { BaseAddress = new Uri("http://notification.test/") };
        var adapter = new HttpAssignmentNotifier(http, NullLogger<HttpAssignmentNotifier>.Instance);
        var delivered = await adapter.NotifyAsync(new(1, 1, 2), default);
        Assert.Equal(expected, delivered);
        Assert.Equal("http://notification.test/notifications", handler.LastUri);
        Assert.Contains("\"assigneeId\":2", handler.LastBody);
    }
    private sealed class ReplyHandler(HttpStatusCode status) : HttpMessageHandler
    {
        public string? LastUri { get; private set; }
        public string LastBody { get; private set; } = "";
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            LastUri = request.RequestUri?.ToString();
            LastBody = await request.Content!.ReadAsStringAsync(ct);
            return new HttpResponseMessage(status);
        }
    }
}
