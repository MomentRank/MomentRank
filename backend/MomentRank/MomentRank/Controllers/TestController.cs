using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MomentRank.DTOs;
using MomentRank.Models;
using MomentRank.Services;
using System.Security.Claims;

namespace MomentRank.Controllers
{
    [ApiController]
    [Route("test")]
    public class TestController : ControllerBase
    {
        IAuthService _authService;
        public TestController(IAuthService authService) {
            _authService = authService;
        }

        [HttpPost("get_username")]
        [Authorize]
        public async Task<IActionResult> GetUsername()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Invalid user token");
            }
            
            User? user = await _authService.GetUserByIdAsync(userId);

            return Ok(new {Username = user?.Username});
        }
    }
}