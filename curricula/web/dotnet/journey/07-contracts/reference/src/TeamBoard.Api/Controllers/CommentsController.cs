using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using TeamBoard.Domain;
using TeamBoard.Application;
namespace TeamBoard.Api.Controllers;

[Route("tasks/{taskId:int}/comments")]
public sealed class CommentsController(BoardService board) : ApiController
{
    [HttpGet]
    public async Task<ActionResult<List<CommentDto>>> List(int taskId, CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await board.CommentsAsync(taskId, actor, ct);
        return result.Result == ChangeResult.Success ? Ok(result.Value) : Failure(result.Result);
    }
    [HttpPost]
    public async Task<ActionResult<CommentDto>> Create(int taskId, CreateCommentRequest request, CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await board.AddCommentAsync(taskId, request.Text, actor, ct);
        return result.Result == ChangeResult.Success
            ? Created($"/tasks/{taskId}/comments/{result.Value!.Id}", result.Value) : Failure(result.Result);
    }
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CommentDto>> GetById(int taskId, int id, CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await board.CommentAsync(taskId, id, actor, ct);
        return result.Result == ChangeResult.Success ? Ok(result.Value) : Failure(result.Result);
    }
}
public record CreateCommentRequest([Required, StringLength(1000, MinimumLength = 1)] string Text);
