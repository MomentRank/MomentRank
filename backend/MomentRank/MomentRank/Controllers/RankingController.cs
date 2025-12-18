using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Services;
using MomentRank.Utils;

namespace MomentRank.Controllers
{
    [ApiController]
    [Route("ranking")]
    [Authorize]
    public class RankingController : ControllerBase
    {
        private readonly IRankingService _rankingService;
        private readonly ApplicationDbContext _context;

        public RankingController(IRankingService rankingService, ApplicationDbContext context)
        {
            _rankingService = rankingService;
            _context = context;
        }

        [HttpPost("matchup/next")]
        public async Task<IActionResult> GetNextMatchup([FromBody] GetNextMatchupRequest request)
        {
            if (request.EventId <= 0)
            {
                return BadRequest("Invalid event ID");
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var eventEntity = await _context.Events.FindAsync(request.EventId);
            if (eventEntity == null)
            {
                return NotFound("Event not found");
            }

            if (eventEntity.Status != Enums.EventStatus.Ranking)
            {
                return Ok(new NoMatchupAvailableResponse
                {
                    Message = "Ranking not available",
                    Reason = "EventNotInRankingPhase",
                    SuggestedAction = $"Ranking will be available when the event ends. Current status: {eventEntity.Status}"
                });
            }

            var matchup = await _rankingService.GetNextMatchupAsync(user, request);
            if (matchup == null)
            {
                return Ok(new NoMatchupAvailableResponse
                {
                    Message = "No matchups available",
                    Reason = "NoEligiblePhotos",
                    SuggestedAction = "Check back later when more photos are uploaded"
                });
            }

            return Ok(matchup);
        }

        [HttpPost("compare")]
        public async Task<IActionResult> SubmitComparison([FromBody] SubmitComparisonRequest request)
        {
            if (request.EventId <= 0)
            {
                return BadRequest("Invalid event ID");
            }

            if (request.PhotoAId <= 0 || request.PhotoBId <= 0)
            {
                return BadRequest("Invalid photo IDs");
            }

            if (request.PhotoAId == request.PhotoBId)
            {
                return BadRequest("Cannot compare a photo to itself");
            }

            if (request.WinnerPhotoId.HasValue &&
                request.WinnerPhotoId != request.PhotoAId &&
                request.WinnerPhotoId != request.PhotoBId)
            {
                return BadRequest("Winner must be one of the compared photos");
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var eventEntity = await _context.Events.FindAsync(request.EventId);
            if (eventEntity == null || eventEntity.Status != Enums.EventStatus.Ranking)
            {
                return BadRequest("Ranking is only available when the event is in ranking phase");
            }

            var result = await _rankingService.SubmitComparisonAsync(user, request);
            if (result == null)
            {
                return BadRequest("Unable to record comparison");
            }

            return Ok(result);
        }

        [HttpPost("skip")]
        public async Task<IActionResult> SkipComparison([FromBody] SkipComparisonRequest request)
        {
            if (request.EventId <= 0)
            {
                return BadRequest("Invalid event ID");
            }

            if (request.PhotoAId <= 0 || request.PhotoBId <= 0)
            {
                return BadRequest("Invalid photo IDs");
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var eventEntity = await _context.Events.FindAsync(request.EventId);
            if (eventEntity == null || eventEntity.Status != Enums.EventStatus.Ranking)
            {
                return BadRequest("Ranking is only available when the event is in ranking phase");
            }

            var result = await _rankingService.SkipComparisonAsync(user, request);
            if (result == null)
            {
                return BadRequest("Unable to skip comparison");
            }

            return Ok(result);
        }

        [HttpPost("leaderboard")]
        public async Task<IActionResult> GetRankings([FromBody] GetRankingsRequest request)
        {
            if (request.EventId <= 0)
            {
                return BadRequest("Invalid event ID");
            }

            if (request.TopN <= 0 || request.TopN > 100)
            {
                return BadRequest("TopN must be between 1 and 100");
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var rankings = await _rankingService.GetRankingsAsync(user, request);
            if (rankings == null)
            {
                return NotFound("Rankings not available for this event");
            }

            return Ok(rankings);
        }

        [HttpPost("photo/stats")]
        public async Task<IActionResult> GetPhotoStats([FromBody] GetPhotoRankingStatsRequest request)
        {
            if (request.PhotoId <= 0 || request.EventId <= 0)
            {
                return BadRequest("Invalid photo or event ID");
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var stats = await _rankingService.GetPhotoRankingStatsAsync(user, request);
            if (stats == null)
            {
                return NotFound("Photo stats not found");
            }

            return Ok(stats);
        }

        [HttpPost("history")]
        public async Task<IActionResult> GetComparisonHistory([FromBody] GetComparisonHistoryRequest request)
        {
            if (request.EventId <= 0)
            {
                return BadRequest("Invalid event ID");
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var history = await _rankingService.GetComparisonHistoryAsync(user, request);
            if (history == null)
            {
                return NotFound("Comparison history not available");
            }

            return Ok(history);
        }

        [HttpPost("session/remaining")]
        public async Task<IActionResult> GetRemainingInSession([FromBody] GetNextMatchupRequest request)
        {
            if (request.EventId <= 0)
            {
                return BadRequest("Invalid event ID");
            }

            var user = await this.GetCurrentUserAsync(_context);
            if (user == null)
            {
                return Unauthorized();
            }

            var remaining = await _rankingService.GetRemainingComparisonsInSessionAsync(
                user,
                request.EventId);

            return Ok(new { remainingComparisons = remaining });
        }
    }
}
