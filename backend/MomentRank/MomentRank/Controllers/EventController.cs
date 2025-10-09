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
            if (created != null)
            {
                return Unauthorized();
            }

            return Ok();
        }
    }
}