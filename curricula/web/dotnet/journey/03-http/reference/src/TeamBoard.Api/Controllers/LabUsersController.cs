using Microsoft.AspNetCore.Mvc;
using TeamBoard.Domain;
namespace TeamBoard.Api.Controllers;
[ApiController, Route("users")]
public sealed class LabUsersController : ControllerBase
{
    [HttpGet("{id:int}")]
    public ActionResult<UserDto> Get(int id)
    {
        if (id != 42) return NotFound();
        return Ok(new UserDto(id, "Nora"));
    }
}
