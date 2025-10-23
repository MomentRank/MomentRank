using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Services;
using MomentRank.Utils;

namespace MomentRank.Controllers
{
    [ApiController]
    [Route("event")]
    [Authorize]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly IPhotoService _photoService;
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public EventController(IEventService eventService, IPhotoService photoService, ApplicationDbContext context, IWebHostEnvironment environment)
        {
            _eventService = eventService;
            _photoService = photoService;
            _context = context;
            _environment = environment;
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateEventRequest request)
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest();
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var created = await _eventService.CreateEventAsync(user, request);
            if (created == null)
            {
                return Conflict("Event already exists or failed to create");
            }

            return Ok(created);
        }

        [HttpPost("delete")]
        public async Task<IActionResult> Delete([FromBody] DeleteEventRequest request)
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest();
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var deleted = await _eventService.DeleteEventAsync(user, request);
            if (deleted == null)
            {
                return NotFound("Event not found or user is not the owner");
            }

            return Ok(deleted);
        }

        [HttpPost("read")]
        public async Task<IActionResult> Read([FromBody] ReadEventRequest request)
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest();
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var read = await _eventService.ReadEventAsync(user, request);
            if (read == null)
            {
                return NotFound("Event not found or user is not the owner");
            }

            return Ok(read);
        }

        [HttpPost("list")]
        public async Task<IActionResult> List()
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var events = await _eventService.ListEventsAsync(user);
            if (events == null)
            {
                return StatusCode(500, "Failed to retrieve events");
            }

            return Ok(events);
        }

        [HttpPost("join")]
        public async Task<IActionResult> Join([FromBody] JoinEventRequest request)
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest();
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var joined = await _eventService.JoinEventAsync(user, request);
            if (joined == null)
            {
                return Conflict("Cannot join event - either it doesn't exist, you're the owner, or you're already a member");
            }

            return Ok(joined);
        }

        [HttpPost("photos/upload-base64")]
        public async Task<IActionResult> UploadPhotoBase64([FromBody] Base64UploadRequest request)
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

        [HttpPost("photos/list")]
        public async Task<IActionResult> ListPhotos([FromBody] ListPhotosRequest request)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            // Check if user has access to the event
            if (!await _photoService.IsUserEventMemberAsync(user, request.EventId))
            {
                return Forbid("You don't have access to this event");
            }

            var photos = await _photoService.ListPhotosAsync(request.EventId);
            if (photos == null)
            {
                return StatusCode(500, "Failed to retrieve photos");
            }

            return Ok(photos);
        }

        [HttpPost("photos/delete")]
        public async Task<IActionResult> DeletePhoto([FromBody] DeletePhotoRequest request)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            try
            {
                var photo = await _context.Photos
                    .FirstOrDefaultAsync(p => p.Id == request.PhotoId);

                if (photo == null)
                {
                    return NotFound($"Photo with ID {request.PhotoId} not found");
                }

                // Get the event separately to avoid schema issues
                var eventEntity = await _context.Events
                    .FirstOrDefaultAsync(e => e.Id == photo.EventId);

                if (eventEntity == null)
                {
                    return NotFound($"Event with ID {photo.EventId} not found");
                }

                // Check if user is the uploader or event owner
                if (photo.UploadedById != user.Id && eventEntity.OwnerId != user.Id)
                {
                    return Forbid($"User {user.Id} is not uploader ({photo.UploadedById}) or event owner ({eventEntity.OwnerId})");
                }

                // Delete physical file
                var fullPath = Path.Combine(_environment.WebRootPath, photo.FilePath);
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }

                // Delete database record
                _context.Photos.Remove(photo);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Photo deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest($"Delete failed: {ex.Message}");
            }
        }

    }
}