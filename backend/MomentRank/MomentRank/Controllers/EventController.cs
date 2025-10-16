using Microsoft.AspNetCore.Mvc;
using MomentRank.DTOs;
using MomentRank.Services;

namespace MomentRank.Controllers
{
    [ApiController]
    [Route ("event")]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;
        public EventController(IEventService eventService)
        {
            _eventService = eventService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateEventRequest request)
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                return BadRequest();
            }

            var created = await _eventService.CreateEventAsync(request);
            if (created == null)
            {
                return Unauthorized();
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

            var deleted = await _eventService.DeleteEventAsync(request);
            if (deleted == null)
            {
                return Unauthorized();
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

            var read = await _eventService.ReadEventAsync(request);
            if (read == null)
            {
                return Unauthorized();
            }

            return Ok(read);
        }

        [HttpPost("list")]
        public async Task<IActionResult> List()
        {
            var events = await _eventService.ListEventsAsync();
            if (events == null)
            {
                return Unauthorized();
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

            var joined = await _eventService.JoinEventAsync(request);
            if (joined == null)
            {
                return Unauthorized();
            }

            return Ok(joined);
        }
    }
}