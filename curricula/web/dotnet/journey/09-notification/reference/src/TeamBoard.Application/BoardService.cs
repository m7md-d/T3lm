using TeamBoard.Domain;
namespace TeamBoard.Application;

public sealed class BoardService(IBoardStore store, IWorkItemService tasks)
{
    public Task<List<ProjectDto>> ProjectsAsync(int actor, CancellationToken ct) => store.ListProjectsAsync(actor, ct);
    public async Task<Operation<ProjectDto>> ProjectAsync(int id, int actor, CancellationToken ct)
    {
        if (!await store.IsMemberAsync(id, actor, ct)) return new(ChangeResult.Forbidden);
        var project = await store.FindProjectAsync(id, ct);
        return project is null ? new(ChangeResult.NotFound) : new(ChangeResult.Success, project);
    }
    public async Task<Operation<ProjectDto>> CreateProjectAsync(string name, int actor, CancellationToken ct)
    {
        if (!TitleRules.IsValid(name)) return new(ChangeResult.InvalidInput);
        if (!await store.UserExistsAsync(actor, ct)) return new(ChangeResult.Forbidden);
        var project = new Project { Name = name.Trim() };
        store.AddProject(project, actor);
        await store.CommitAsync(ct);
        return new(ChangeResult.Success, new(project.Id, project.Name, 0));
    }
    public async Task<Operation<List<TaskDto>>> TasksAsync(int projectId, int take, int actor, CancellationToken ct)
    {
        if (take is < 1 or > 100) return new(ChangeResult.InvalidInput);
        if (!await store.IsMemberAsync(projectId, actor, ct)) return new(ChangeResult.Forbidden);
        return new(ChangeResult.Success, await store.ListTasksAsync(projectId, take, ct));
    }
    public async Task<Operation<UserDto>> UserAsync(int id, int actor, CancellationToken ct)
    {
        if (id != actor && !await store.SharesProjectAsync(actor, id, ct)) return new(ChangeResult.Forbidden);
        var user = await store.FindUserAsync(id, ct);
        return user is null ? new(ChangeResult.NotFound) : new(ChangeResult.Success, user);
    }
    public async Task<Operation<List<CommentDto>>> CommentsAsync(int taskId, int actor, CancellationToken ct)
    {
        var task = await tasks.FindAsync(taskId, actor, ct);
        if (task.Result != ChangeResult.Success) return new(task.Result);
        return new(ChangeResult.Success, await store.ListCommentsAsync(taskId, ct));
    }
    public async Task<Operation<CommentDto>> CommentAsync(int taskId, int id, int actor, CancellationToken ct)
    {
        var task = await tasks.FindAsync(taskId, actor, ct);
        if (task.Result != ChangeResult.Success) return new(task.Result);
        var comment = await store.FindCommentAsync(taskId, id, ct);
        return comment is null ? new(ChangeResult.NotFound) : new(ChangeResult.Success, comment);
    }
    public async Task<Operation<CommentDto>> AddCommentAsync(int taskId, string text, int actor, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Length > 1000) return new(ChangeResult.InvalidInput);
        var task = await tasks.FindAsync(taskId, actor, ct);
        if (task.Result != ChangeResult.Success) return new(task.Result);
        var comment = new Comment { WorkItemId = taskId, AuthorId = actor, Text = text.Trim() };
        store.AddComment(comment);
        await store.CommitAsync(ct);
        return new(ChangeResult.Success, new(comment.Id, actor, comment.Text));
    }
}
