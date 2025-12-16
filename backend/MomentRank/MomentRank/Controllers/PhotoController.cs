using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Services;
using MomentRank.Utils;

namespace MomentRank.Controllers
{
    [ApiController]
    [Route("photo")]
    [Authorize]
    public class PhotoController : ControllerBase
    {
        private readonly IPhotoService _photoService;
        private readonly ApplicationDbContext _context;

        public PhotoController(IPhotoService photoService, ApplicationDbContext context)
        {
            _photoService = photoService;
            _context = context;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload([FromBody] GeneralPhotoUploadRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.FileData))
                {
                    return BadRequest("No file data provided");
                }

                var user = await this.GetCurrentUserAsync(_context);
                if (user == null)
                {
                    return Unauthorized();
                }

                var result = await _photoService.UploadPhotoBase64Async(user, request);
                if (result == null)
                {
                    return BadRequest("Failed to upload photo. Check file size and type.");
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Upload failed: {ex.Message}");
            }
        }

        [HttpPost("delete")]
        public async Task<IActionResult> Delete([FromBody] DeletePhotoRequest request)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var deleted = await _photoService.DeletePhotoAsync(user, request.PhotoId);
            if (!deleted)
            {
                return BadRequest("Failed to delete photo. You may not have permission.");
            }

            return Ok(new { message = "Photo deleted successfully" });
        }
    }
}
