using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using TeamBoard.Application;
namespace TeamBoard.Infrastructure;

public sealed class LogAssignmentNotifier(ILogger<LogAssignmentNotifier> logger) : IAssignmentNotifier
{
    public Task<bool> NotifyAsync(AssignmentNotice notice, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        logger.LogInformation("Assignment notice: task {TaskId}, assignee {AssigneeId}", notice.TaskId, notice.AssigneeId);
        return Task.FromResult(true);
    }
}
public sealed class HttpAssignmentNotifier(HttpClient http, ILogger<HttpAssignmentNotifier> logger) : IAssignmentNotifier
{
    public async Task<bool> NotifyAsync(AssignmentNotice notice, CancellationToken ct)
    {
        try
        {
            using var response = await http.PostAsJsonAsync("notifications", notice, ct);
            response.EnsureSuccessStatusCode();
            return true;
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "Assignment {TaskId} saved, notification failed", notice.TaskId);
            return false;
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            logger.LogWarning("Assignment {TaskId} saved, notification timed out", notice.TaskId);
            return false;
        }
    }
}
public sealed class NotificationOptions
{
    public string Mode { get; set; } = "Log";
    public string? BaseUrl { get; set; }
}
