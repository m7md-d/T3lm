using Microsoft.EntityFrameworkCore;
using TeamBoard.Domain;
using TeamBoard.Application;
namespace TeamBoard.Infrastructure;

// Outbound adapter: EF-specific types and query translation stay here.
public sealed class EfBoardStore(BoardDbContext db) : IBoardStore
{
    public Task<WorkItem?> FindTaskAsync(int id, CancellationToken ct) => db.WorkItems.SingleOrDefaultAsync(t => t.Id == id, ct);
    public Task<bool> IsMemberAsync(int projectId, int userId, CancellationToken ct) => db.ProjectMembers.AnyAsync(m => m.ProjectId == projectId && m.UserId == userId, ct);
    public Task<bool> ProjectExistsAsync(int projectId, CancellationToken ct) => db.Projects.AnyAsync(p => p.Id == projectId, ct);
    public Task<bool> UserExistsAsync(int id, CancellationToken ct) => db.Users.AnyAsync(u => u.Id == id, ct);
    public Task<bool> SharesProjectAsync(int actor, int id, CancellationToken ct) => db.ProjectMembers.AnyAsync(m => m.UserId == id && db.ProjectMembers.Any(a => a.ProjectId == m.ProjectId && a.UserId == actor), ct);
    public Task<UserDto?> FindUserAsync(int id, CancellationToken ct) => db.Users.Where(u => u.Id == id).Select(u => new UserDto(u.Id, u.Name)).SingleOrDefaultAsync(ct);
    public Task<List<ProjectDto>> ListProjectsAsync(int actor, CancellationToken ct) => db.Projects.Where(p => db.ProjectMembers.Any(m => m.ProjectId == p.Id && m.UserId == actor)).OrderBy(p => p.Id).Select(p => new ProjectDto(p.Id, p.Name, p.WorkItems.Count)).Take(100).ToListAsync(ct);
    public Task<ProjectDto?> FindProjectAsync(int id, CancellationToken ct) => db.Projects.Where(p => p.Id == id).Select(p => new ProjectDto(p.Id, p.Name, p.WorkItems.Count)).SingleOrDefaultAsync(ct);
    public Task<List<TaskDto>> ListTasksAsync(int id, int take, CancellationToken ct) => db.WorkItems.Where(t => t.ProjectId == id).OrderBy(t => t.Id).Take(take).Select(t => new TaskDto(t.Id, t.Title, t.Done, t.ProjectId, t.AssigneeId)).ToListAsync(ct);
    public Task<List<CommentDto>> ListCommentsAsync(int taskId, CancellationToken ct) => db.Comments.Where(c => c.WorkItemId == taskId).OrderBy(c => c.Id).Take(100).Select(c => new CommentDto(c.Id, c.AuthorId, c.Text)).ToListAsync(ct);
    public Task<CommentDto?> FindCommentAsync(int taskId, int id, CancellationToken ct) => db.Comments.Where(c => c.Id == id && c.WorkItemId == taskId).Select(c => new CommentDto(c.Id, c.AuthorId, c.Text)).SingleOrDefaultAsync(ct);
    public void AddTask(WorkItem task) => db.WorkItems.Add(task);
    public void AddProject(Project project, int ownerId)
    {
        db.Projects.Add(project);
        db.ProjectMembers.Add(new ProjectMember { Project = project, UserId = ownerId });
    }
    public void AddComment(Comment comment) => db.Comments.Add(comment);
    public async Task CommitAsync(CancellationToken ct)
    {
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException { SqlState: "23503" }
            or Microsoft.Data.Sqlite.SqliteException { SqliteExtendedErrorCode: 787 })
        { throw new MembershipConflictException(ex); }
    }
}
