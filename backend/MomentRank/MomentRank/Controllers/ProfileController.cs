using Microsoft.AspNetCore.Mvc;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Services;
using MomentRank.Utils;

namespace MomentRank.Controllers
{
    [ApiController]
    [Route("profile")]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;
        private readonly ApplicationDbContext _context;

        public ProfileController(IProfileService profileService, ApplicationDbContext context)
        {
            _profileService = profileService;
            _context = context;
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateProfileRequest request)
        {
            if (string.IsNullOrEmpty(request.Name) && string.IsNullOrEmpty(request.Bio))
            {
                return BadRequest("Name or Bio must be provided");
            }

            var user = await JwtUtils.GetUserFromRequestAsync(Request, _context);
            if (user == null)
            {
                return Unauthorized();
            }

            var created = await _profileService.CreateProfileAsync(user, request);
            if (created == null)
            {
                return StatusCode(500, "Failed to create profile");
            }

            return Ok(created);
        }

        [HttpPost("update")]
        public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
        {
            var user = await JwtUtils.GetUserFromRequestAsync(Request, _context);
            if (user == null)
            {
                return Unauthorized();
            }

            var updated = await _profileService.UpdateProfileAsync(user, request);
            if (updated == null)
            {
                return StatusCode(500, "Failed to update profile");
            }

            return Ok(updated);
        }

        [HttpPost("get")]
        public async Task<IActionResult> Get()
        {
            var user = await JwtUtils.GetUserFromRequestAsync(Request, _context);
            if (user == null)
            {
                return Unauthorized();
            }

            var profile = await _profileService.GetProfileAsync(user);
            if (profile == null)
            {
                return StatusCode(500, "Failed to retrieve profile");
            }

            return Ok(profile);
        }
    }
}
