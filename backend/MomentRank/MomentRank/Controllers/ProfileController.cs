using Microsoft.AspNetCore.Mvc;
using MomentRank.DTOs;
using MomentRank.Services;

namespace MomentRank.Controllers
{
    [ApiController]
    [Route("profile")]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateProfileRequest request)
        {
            if (string.IsNullOrEmpty(request.Name) && string.IsNullOrEmpty(request.Bio))
            {
                return BadRequest();
            }

            var created = await _profileService.CreateProfileAsync(request);
            if (created == null)
            {
                return Unauthorized();
            }

            return Ok(created);
        }

        [HttpPost("update")]
        public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
        {
            var updated = await _profileService.UpdateProfileAsync(request);
            if (updated == null)
            {
                return Unauthorized();
            }

            return Ok(updated);
        }

        [HttpPost("get")]
        public async Task<IActionResult> Get()
        {
            var profile = await _profileService.GetProfileAsync();
            if (profile == null)
            {
                return Unauthorized();
            }

            return Ok(profile);
        }
    }
}
