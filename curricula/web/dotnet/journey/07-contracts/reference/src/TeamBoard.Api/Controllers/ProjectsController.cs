using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using TeamBoard.Domain;
using TeamBoard.Application;
namespace TeamBoard.Api.Controllers;

[Route("projects")]
public sealed class ProjectsController(BoardService board) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<List<ProjectDto>>> List(CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        return await board.ProjectsAsync(actor, ct);
    }
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProjectDto>> GetById(int id, CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await board.ProjectAsync(id, actor, ct);
        return result.Result == ChangeResult.Success ? Ok(result.Value) : Failure(result.Result);
    }
    [HttpPost]
    public async Task<ActionResult<ProjectDto>> Create(CreateProjectRequest request, CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await board.CreateProjectAsync(request.Name, actor, ct);
        return result.Result == ChangeResult.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value) : Failure(result.Result);
    }
    [HttpGet("{id:int}/tasks")]
    public async Task<ActionResult<List<TaskDto>>> Tasks(int id, CancellationToken ct, [FromQuery, Range(1,100)] int take = 20)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await board.TasksAsync(id, take, actor, ct);
        return result.Result == ChangeResult.Success ? Ok(result.Value) : Failure(result.Result);
    }
}
public record CreateProjectRequest([Required, StringLength(120, MinimumLength = 1)] string Name);
