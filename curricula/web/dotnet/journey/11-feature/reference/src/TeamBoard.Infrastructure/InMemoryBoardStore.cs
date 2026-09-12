using TeamBoard.Application;
using TeamBoard.Domain;
namespace TeamBoard.Infrastructure;

// Lab adapter, with an isolated state object per unit test. It is not a database emulator.
public sealed class InMemoryBoardState
{
    public object Gate { get; } = new();
    public List<User> Users { get; } = [new() { Id = 1, Name = "Nora" }, new() { Id = 2, Name = "Omar" }, new() { Id = 3, Name = "Lina" }];
    public List<Project> Projects { get; } = [new() { Id = 1, Name = "TeamBoard" }, new() { Id = 2, Name = "Other" }];
    public List<ProjectMember> Members { get; } = [new() { ProjectId = 1, UserId = 1 }, new() { ProjectId = 1, UserId = 2 }, new() { ProjectId = 2, UserId = 3 }];
    public List<WorkItem> Tasks { get; } = [new() { Id = 1, ProjectId = 1, Title = "Read Program.cs" }];
    public List<Comment> Comments { get; } = [];
}
public sealed class InMemoryBoardStore(InMemoryBoardState state) : IBoardStore
{
    private readonly Dictionary<int, WorkItem> tracked = [];
    private readonly List<WorkItem> addedTasks = [];
    private readonly List<(Project Project, int Owner)> addedProjects = [];
    private readonly List<Comment> addedComments = [];
    public int Commits { get; private set; }
    private Task<T> Read<T>(Func<T> read, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (state.Gate) return Task.FromResult(read());
    }
    public Task<WorkItem?> FindTaskAsync(int id, CancellationToken ct) => Read(() =>
    {
        if (tracked.TryGetValue(id, out var existing)) return existing;
        var source = state.Tasks.Find(t => t.Id == id);
        if (source is null) return null;
        var copy = new WorkItem { Id = source.Id, ProjectId = source.ProjectId, Title = source.Title, Done = source.Done, AssigneeId = source.AssigneeId };
        tracked[id] = copy;
        return copy;
    }, ct);
    public Task<bool> IsMemberAsync(int projectId, int userId, CancellationToken ct) => Read(() => state.Members.Any(m => m.ProjectId == projectId && m.UserId == userId), ct);
    public Task<bool> ProjectExistsAsync(int projectId, CancellationToken ct) => Read(() => state.Projects.Any(p => p.Id == projectId), ct);
    public Task<bool> UserExistsAsync(int userId, CancellationToken ct) => Read(() => state.Users.Any(u => u.Id == userId), ct);
    public Task<bool> SharesProjectAsync(int actorId, int userId, CancellationToken ct) => Read(() => state.Members.Any(m => m.UserId == userId && state.Members.Any(a => a.ProjectId == m.ProjectId && a.UserId == actorId)), ct);
    public Task<UserDto?> FindUserAsync(int id, CancellationToken ct) => Read(() => state.Users.Where(u => u.Id == id).Select(u => new UserDto(u.Id, u.Name)).SingleOrDefault(), ct);
    public Task<List<ProjectDto>> ListProjectsAsync(int actorId, CancellationToken ct) => Read(() => state.Projects.Where(p => state.Members.Any(m => m.ProjectId == p.Id && m.UserId == actorId)).Select(p => new ProjectDto(p.Id, p.Name, state.Tasks.Count(t => t.ProjectId == p.Id))).ToList(), ct);
    public Task<ProjectDto?> FindProjectAsync(int id, CancellationToken ct) => Read(() => state.Projects.Where(p => p.Id == id).Select(p => new ProjectDto(p.Id, p.Name, state.Tasks.Count(t => t.ProjectId == p.Id))).SingleOrDefault(), ct);
    public Task<List<TaskDto>> ListTasksAsync(int projectId, int take, CancellationToken ct) => Read(() => state.Tasks.Where(t => t.ProjectId == projectId).OrderBy(t => t.Id).Take(take).Select(t => new TaskDto(t.Id, t.Title, t.Done, t.ProjectId, t.AssigneeId)).ToList(), ct);
    public Task<List<CommentDto>> ListCommentsAsync(int taskId, CancellationToken ct) => Read(() => state.Comments.Where(c => c.WorkItemId == taskId).Select(c => new CommentDto(c.Id, c.AuthorId, c.Text)).Take(100).ToList(), ct);
    public Task<CommentDto?> FindCommentAsync(int taskId, int id, CancellationToken ct) => Read(() => state.Comments.Where(c => c.WorkItemId == taskId && c.Id == id).Select(c => new CommentDto(c.Id, c.AuthorId, c.Text)).SingleOrDefault(), ct);
    public void AddTask(WorkItem task) => addedTasks.Add(task);
    public void AddProject(Project project, int ownerId) => addedProjects.Add((project, ownerId));
    public void AddComment(Comment comment) => addedComments.Add(comment);
    public Task CommitAsync(CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (state.Gate)
        {
            foreach (var task in tracked.Values)
            {
                var target = state.Tasks.Single(t => t.Id == task.Id);
                target.Title = task.Title; target.Done = task.Done; target.AssigneeId = task.AssigneeId;
            }
            foreach (var (project, owner) in addedProjects)
            {
                project.Id = state.Projects.Count == 0 ? 1 : state.Projects.Max(p => p.Id) + 1;
                state.Projects.Add(project);
                state.Members.Add(new ProjectMember { ProjectId = project.Id, UserId = owner });
            }
            foreach (var task in addedTasks)
            {
                task.Id = state.Tasks.Count == 0 ? 1 : state.Tasks.Max(t => t.Id) + 1;
                state.Tasks.Add(task);
            }
            foreach (var comment in addedComments)
            {
                comment.Id = state.Comments.Count == 0 ? 1 : state.Comments.Max(c => c.Id) + 1;
                state.Comments.Add(comment);
            }
            addedProjects.Clear(); addedTasks.Clear(); addedComments.Clear(); Commits++;
        }
        return Task.CompletedTask;
    }
}
