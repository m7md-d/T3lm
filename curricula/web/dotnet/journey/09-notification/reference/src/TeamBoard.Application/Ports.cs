using TeamBoard.Domain;
namespace TeamBoard.Application;

// Outbound port. No EF, IQueryable, SQL, HTTP or provider types cross this boundary.
public interface IBoardStore
{
    Task<WorkItem?> FindTaskAsync(int id, CancellationToken ct);
    Task<bool> IsMemberAsync(int projectId, int userId, CancellationToken ct);
    Task<bool> ProjectExistsAsync(int projectId, CancellationToken ct);
    Task<bool> UserExistsAsync(int userId, CancellationToken ct);
    Task<bool> SharesProjectAsync(int actorId, int userId, CancellationToken ct);
    Task<UserDto?> FindUserAsync(int id, CancellationToken ct);
    Task<List<ProjectDto>> ListProjectsAsync(int actorId, CancellationToken ct);
    Task<ProjectDto?> FindProjectAsync(int id, CancellationToken ct);
    Task<List<TaskDto>> ListTasksAsync(int projectId, int take, CancellationToken ct);
    Task<List<CommentDto>> ListCommentsAsync(int taskId, CancellationToken ct);
    Task<CommentDto?> FindCommentAsync(int taskId, int id, CancellationToken ct);
    void AddTask(WorkItem task);
    void AddProject(Project project, int ownerId);
    void AddComment(Comment comment);
    Task CommitAsync(CancellationToken ct);
}
public sealed class MembershipConflictException(Exception inner) : Exception("Membership changed", inner);
public record AssignmentNotice(int TaskId, int ProjectId, int AssigneeId);
// Best effort in this bounded teaching project. False means saved assignment, missed notification.
public interface IAssignmentNotifier
{
    Task<bool> NotifyAsync(AssignmentNotice notice, CancellationToken ct);
}
public interface IWorkItemService
{
    Task<Operation<TaskDto>> FindAsync(int id, int actorId, CancellationToken ct);
    Task<Operation<TaskDto>> CreateAsync(int projectId, string title, int actorId, CancellationToken ct);
    Task<ChangeResult> AssignAsync(int taskId, int assigneeId, int actorId, CancellationToken ct);
    Task<ChangeResult> RenameAsync(int taskId, string title, int actorId, CancellationToken ct);
}
