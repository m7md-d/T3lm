using Microsoft.AspNetCore.Mvc;
using TeamBoard.Domain;
using TeamBoard.Application;
namespace TeamBoard.Api.Controllers;

[Route("users")]
public sealed class UsersController(BoardService board) : ApiController
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> GetById(int id, CancellationToken ct)
    {
        if (ActorId is not int actor) return Unauthorized();
        var result = await board.UserAsync(id, actor, ct);
        return result.Result == ChangeResult.Success ? Ok(result.Value) : Failure(result.Result);
    }
}
