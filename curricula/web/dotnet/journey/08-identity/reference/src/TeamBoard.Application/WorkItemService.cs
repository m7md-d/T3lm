using TeamBoard.Domain;
namespace TeamBoard.Application;

// Inbound port implementation: independent of ASP.NET Core and EF Core.
public sealed class WorkItemService(IBoardStore store, IAssignmentNotifier notifier) : IWorkItemService
{
    public async Task<Operation<TaskDto>> FindAsync(int id, int actorId, CancellationToken ct)
    {
        var item = await store.FindTaskAsync(id, ct);
        if (item is null) return new(ChangeResult.NotFound);
        if (!await store.IsMemberAsync(item.ProjectId, actorId, ct)) return new(ChangeResult.Forbidden);
        return new(ChangeResult.Success, ToDto(item));
    }
    public async Task<Operation<TaskDto>> CreateAsync(int projectId, string title, int actorId, CancellationToken ct)
    {
        if (!TitleRules.IsValid(title)) return new(ChangeResult.InvalidInput);
        if (!await store.ProjectExistsAsync(projectId, ct)) return new(ChangeResult.NotFound);
        if (!await store.IsMemberAsync(projectId, actorId, ct)) return new(ChangeResult.Forbidden);
        var item = new WorkItem { ProjectId = projectId, Title = title.Trim() };
        store.AddTask(item);
        await store.CommitAsync(ct);
        return new(ChangeResult.Success, ToDto(item));
    }
    public async Task<ChangeResult> AssignAsync(int taskId, int assigneeId, int actorId, CancellationToken ct)
    {
        var item = await store.FindTaskAsync(taskId, ct);
        if (item is null) return ChangeResult.NotFound;
        if (!await store.IsMemberAsync(item.ProjectId, actorId, ct)) return ChangeResult.Forbidden;
        if (!await store.IsMemberAsync(item.ProjectId, assigneeId, ct)) return ChangeResult.InvalidAssignee;
        item.AssigneeId = assigneeId;
        try { await store.CommitAsync(ct); }
        catch (MembershipConflictException) { return ChangeResult.Conflict; }
        // Save first. Notification failure cannot roll back a committed assignment.
        // The adapter logs delivery failure; durable delivery/outbox is outside this course.
        await notifier.NotifyAsync(new(item.Id, item.ProjectId, assigneeId), ct);
        return ChangeResult.Success;
    }
    public async Task<ChangeResult> RenameAsync(int taskId, string title, int actorId, CancellationToken ct)
    {
        if (!TitleRules.IsValid(title)) return ChangeResult.InvalidInput;
        var item = await store.FindTaskAsync(taskId, ct);
        if (item is null) return ChangeResult.NotFound;
        if (!await store.IsMemberAsync(item.ProjectId, actorId, ct)) return ChangeResult.Forbidden;
        item.Title = title.Trim();
        await store.CommitAsync(ct);
        return ChangeResult.Success;
    }
    private static TaskDto ToDto(WorkItem t) => new(t.Id, t.Title, t.Done, t.ProjectId, t.AssigneeId);
}
