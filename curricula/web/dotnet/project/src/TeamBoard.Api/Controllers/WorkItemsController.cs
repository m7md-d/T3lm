using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using TeamBoard.Domain;
using TeamBoard.Application;
namespace TeamBoard.Api.Controllers;

[Route("tasks")]
public sealed class WorkItemsController(IWorkItemService service) : ApiController
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskDto>> GetById(int id, CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await service.FindAsync(id, actor, ct);
        return result.Result == ChangeResult.Success ? Ok(result.Value) : Failure(result.Result);
    }
    [HttpPost("/projects/{projectId:int}/tasks")]
    public async Task<ActionResult<TaskDto>> Create(int projectId, CreateTaskRequest request, CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await service.CreateAsync(projectId, request.Title, actor, ct);
        return result.Result == ChangeResult.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value)
            : Failure(result.Result);
    }
    [HttpPatch("{id:int}/assignee")]
    public async Task<ActionResult> Assign(int id, AssignRequest request, CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await service.AssignAsync(id, request.UserId, actor, ct);
        return result == ChangeResult.Success ? NoContent() : Failure(result);
    }
    [HttpPatch("{id:int}/title")]
    public async Task<ActionResult> Rename(int id, CreateTaskRequest request, CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await service.RenameAsync(id, request.Title, actor, ct);
        return result == ChangeResult.Success ? NoContent() : Failure(result);
    }
}
public record CreateTaskRequest([Required, StringLength(120, MinimumLength = 1)] string Title);
public record AssignRequest([Range(1, int.MaxValue)] int UserId);
