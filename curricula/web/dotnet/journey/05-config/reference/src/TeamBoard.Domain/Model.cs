namespace TeamBoard.Domain;

public sealed class User
{
    public int Id { get; set; }
    public required string Name { get; set; }
}
public sealed class Project
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public List<WorkItem> WorkItems { get; set; } = [];
}
public sealed class ProjectMember
{
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}
public sealed class WorkItem
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public bool Done { get; set; }
    public int ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public int? AssigneeId { get; set; }
    public ProjectMember? AssigneeMembership { get; set; }
    public List<Comment> Comments { get; set; } = [];
}
public sealed class Comment
{
    public int Id { get; set; }
    public int WorkItemId { get; set; }
    public WorkItem WorkItem { get; set; } = null!;
    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public required string Text { get; set; }
}
public record UserDto(int Id, string Name);
public record TaskDto(int Id, string Title, bool Done, int ProjectId, int? AssigneeId);
public record CommentDto(int Id, int AuthorId, string Text);
public record ProjectDto(int Id, string Name, int TaskCount);
public enum ChangeResult { Success, NotFound, Forbidden, InvalidAssignee, InvalidInput, Conflict }
public record Operation<T>(ChangeResult Result, T? Value = default);
public static class TitleRules
{
    public static bool IsValid(string? title) =>
        !string.IsNullOrWhiteSpace(title) && title.Trim().Length <= 120;
}
