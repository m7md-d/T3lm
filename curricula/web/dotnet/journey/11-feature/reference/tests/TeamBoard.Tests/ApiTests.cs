using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TeamBoard.Domain;
using TeamBoard.Application;
using TeamBoard.Infrastructure;

namespace TeamBoard.Tests;
public class ApiTests
{
    [Fact]
    public async Task Health_is_public()
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs(null);
        using var response = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
    [Theory]
    [InlineData(null, HttpStatusCode.Unauthorized)]
    [InlineData("bad-subject", HttpStatusCode.Unauthorized)]
    [InlineData("3", HttpStatusCode.Forbidden)]
    public async Task Unauthenticated_or_nonmember_cannot_assign(string? actor, HttpStatusCode expected)
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs(actor);
        using var response = await client.PatchAsJsonAsync("/tasks/1/assignee", new { userId = 2 });
        Assert.Equal(expected, response.StatusCode);
        Assert.Null(await app.ReadAssigneeAsync());
        Assert.Empty(app.Notifications.Notices);
    }
    [Fact]
    public async Task Assignee_must_be_member_of_same_project()
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs("1");
        using var response = await client.PatchAsJsonAsync("/tasks/1/assignee", new { userId = 3 });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null(await app.ReadAssigneeAsync());
        Assert.Empty(app.Notifications.Notices);
    }
    [Fact]
    public async Task Valid_assignment_is_persisted_and_notified()
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs("1");
        using var response = await client.PatchAsJsonAsync("/tasks/1/assignee", new { userId = 2 });
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("", await response.Content.ReadAsStringAsync());
        Assert.Equal(2, await app.ReadAssigneeAsync());
        Assert.Equal(new AssignmentNotice(1, 1, 2), Assert.Single(app.Notifications.Notices));
    }
    [Fact]
    public async Task Missing_task_returns_not_found()
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs("1");
        using var response = await client.PatchAsJsonAsync("/tasks/999/assignee", new { userId = 2 });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Blank_title_is_rejected(string title)
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs("1");
        using var response = await client.PostAsJsonAsync("/projects/1/tasks", new { title });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
    [Fact]
    public async Task Created_task_has_working_location_and_trimmed_title()
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs("1");
        using var response = await client.PostAsJsonAsync("/projects/1/tasks", new { title = "  Review SQL  " });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        var task = await client.GetFromJsonAsync<TaskDto>(response.Headers.Location);
        Assert.Equal("Review SQL", task!.Title);
        Assert.Equal(1, task.ProjectId);
    }
    [Fact]
    public async Task Projects_list_is_scoped_to_membership()
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs("1");
        var projects = await client.GetFromJsonAsync<List<ProjectDto>>("/projects");
        Assert.Equal(1, Assert.Single(projects!).Id);
    }
    [Fact]
    public async Task Comment_author_comes_from_identity_not_body()
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs("1");
        using var response = await client.PostAsJsonAsync("/tasks/1/comments", new { text = "Ready", authorId = 3 });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var comment = await client.GetFromJsonAsync<CommentDto>(response.Headers.Location);
        Assert.Equal(1, comment!.AuthorId);
    }
    [Fact]
    public async Task Nonmember_cannot_read_comments()
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs("3");
        using var response = await client.GetAsync("/tasks/1/comments");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
    [Fact]
    public async Task Composite_foreign_key_prevents_cross_project_assignment()
    {
        using var app = new BoardFactory();
        using var client = app.ClientAs("1"); // Starts and seeds the test host.
        using var scope = app.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IBoardStore>();
        var task = await store.FindTaskAsync(1, default);
        task!.AssigneeId = 3;
        await Assert.ThrowsAsync<MembershipConflictException>(() => store.CommitAsync(default));
        Assert.Null(await app.ReadAssigneeAsync());
    }
}
