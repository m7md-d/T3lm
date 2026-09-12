using TeamBoard.Application;
using TeamBoard.Domain;
using TeamBoard.Infrastructure;
namespace TeamBoard.Tests;
public class HexagonTests
{
    [Theory]
    [InlineData(1, 2, ChangeResult.Success, 1)]
    [InlineData(3, 2, ChangeResult.Forbidden, 0)]
    [InlineData(1, 3, ChangeResult.InvalidAssignee, 0)]
    public async Task Same_use_case_runs_without_HTTP_or_EF(int actor, int assignee, ChangeResult expected, int writes)
    {
        var state = new InMemoryBoardState();
        var store = new InMemoryBoardStore(state);
        var notifier = new RecordingNotifier();
        var useCase = new WorkItemService(store, notifier);
        var result = await useCase.AssignAsync(1, assignee, actor, default);
        Assert.Equal(expected, result);
        Assert.Equal(writes, store.Commits);
        Assert.Equal(writes, notifier.Notices.Count);
        Assert.Equal(writes == 0 ? null : assignee, state.Tasks.Single().AssigneeId);
    }
    [Fact]
    public async Task Notification_failure_does_not_undo_committed_assignment()
    {
        var state = new InMemoryBoardState();
        var store = new InMemoryBoardStore(state);
        var useCase = new WorkItemService(store, new FailedNotifier(store));
        Assert.Equal(ChangeResult.Success, await useCase.AssignAsync(1, 2, 1, default));
        Assert.Equal(2, state.Tasks.Single().AssigneeId);
    }
    private sealed class FailedNotifier(InMemoryBoardStore store) : IAssignmentNotifier
    {
        public Task<bool> NotifyAsync(AssignmentNotice notice, CancellationToken ct)
        {
            Assert.Equal(1, store.Commits); // Notification happens after persistence.
            return Task.FromResult(false);
        }
    }
    [Fact]
    public void Core_assemblies_do_not_reference_web_or_ef()
    {
        foreach (var assembly in new[] { typeof(TitleRules).Assembly, typeof(IWorkItemService).Assembly })
            Assert.DoesNotContain(assembly.GetReferencedAssemblies(), a =>
                a.Name!.StartsWith("Microsoft.EntityFrameworkCore") || a.Name.StartsWith("Microsoft.AspNetCore"));
    }
}
