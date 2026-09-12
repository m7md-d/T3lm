using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamBoard.Domain;
namespace TeamBoard.Api.Controllers;

[ApiController]
public abstract class ApiController : ControllerBase
{
    // Learning checkpoint only: fixed actor, loopback only. Replaced by JWT in stage 08.
    protected int? ActorId => 1;
    protected ActionResult Failure(ChangeResult result) => result switch
    {
        ChangeResult.NotFound => Problem(statusCode: 404, title: "Resource not found"),
        ChangeResult.Forbidden => Forbid(),
        ChangeResult.InvalidAssignee => Problem(statusCode: 400, title: "Assignee must be a project member"),
        ChangeResult.InvalidInput => Problem(statusCode: 400, title: "Invalid input"),
        ChangeResult.Conflict => Problem(statusCode: 409, title: "Membership changed; reload and retry"),
        _ => Problem(statusCode: 500, title: "Unexpected operation result")
    };
}
