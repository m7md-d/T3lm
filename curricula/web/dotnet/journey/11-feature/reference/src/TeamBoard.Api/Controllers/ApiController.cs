using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TeamBoard.Domain;
namespace TeamBoard.Api.Controllers;

[ApiController, Authorize]
public abstract class ApiController : ControllerBase
{
    protected int? ActorId => int.TryParse(User.FindFirstValue("sub"), out var id) && id > 0 ? id : null;
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
