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
            if (request.Id <= 0)
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
            if (request.Id <= 0)
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
        public async Task<IActionResult> List([FromBody] ListEventsRequest request)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            // Demonstrating named parameters - explicitly naming the arguments for clarity
            var events = await _eventService.ListEventsAsync(
                user: user,
                request: request);
                //filterByStatus: statusFilter.HasValue ? (Enums.EventStatus)statusFilter.Value : null);
            
            if (events == null)
            {
                return StatusCode(500, "Failed to retrieve events");
            }

            return Ok(events);
        }

        [HttpPost("join")]
        public async Task<IActionResult> Join([FromBody] JoinEventRequest request)
        {
            if (request.Id <= 0)
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

            // Check if user can view photos for this event (different rules for public vs private)
            if (!await _photoService.CanUserViewEventPhotosAsync(user, request.EventId))
            {
                return Forbid("You don't have access to view photos for this event");
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

            var result = await _photoService.DeletePhotoAsync(user, request.PhotoId);
            if (!result)
            {
                return Forbid("You can only delete your own photos or photos from events you own");
            }

            return Ok(new { message = "Photo deleted successfully" });
        }

        [HttpPost("invite")]
        public async Task<IActionResult> InviteToEvent([FromBody] InviteToEventRequest request)
        {
            if (request.EventId <= 0 || request.InviteeId <= 0)
            {
                return BadRequest();
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var invite = await _eventService.InviteToEventAsync(user, request);
            if (invite == null)
            {
                return Conflict("Cannot invite user - event doesn't exist, you're not authorized, user is already a member, or invite already exists");
            }

            return Ok(invite);
        }

        [HttpPost("invite/respond")]
        public async Task<IActionResult> RespondToEventInvite([FromBody] RespondToEventInviteRequest request)
        {
            if (request.InviteId <= 0)
            {
                return BadRequest();
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var invite = await _eventService.RespondToEventInviteAsync(user, request);
            if (invite == null)
            {
                return NotFound("Invite not found or you're not the invitee");
            }

            return Ok(invite);
        }

        [HttpPost("invite/list")]
        public async Task<IActionResult> ListEventInvites([FromBody] ListEventInvitesRequest request)
        {
            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var invites = await _eventService.ListEventInvitesAsync(user, request);
            if (invites == null)
            {
                return StatusCode(500, "Failed to retrieve invites");
            }

            return Ok(invites);
        }

        [HttpPost("invite/cancel")]
        public async Task<IActionResult> CancelEventInvite([FromBody] CancelEventInviteRequest request)
        {
            if (request.InviteId <= 0)
            {
                return BadRequest();
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var invite = await _eventService.CancelEventInviteAsync(user, request);
            if (invite == null)
            {
                return NotFound("Invite not found or you're not the sender");
            }

            return Ok(invite);
        }

    }
}