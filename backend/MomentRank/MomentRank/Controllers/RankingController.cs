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

            return Ok(new MatchupResponse
            {
                PhotoA = new PhotoForComparisonDto
                {
                    Id = 1,
                    FilePath = "/photos/sample1.jpg",
                    Caption = "Sample photo A",
                    UploadedById = 1,
                    UploaderUsername = "user1"
                },
                PhotoB = new PhotoForComparisonDto
                {
                    Id = 2,
                    FilePath = "/photos/sample2.jpg",
                    Caption = "Sample photo B",
                    UploadedById = 2,
                    UploaderUsername = "user2"
                },
                Category = request.Category,
                Prompt = "Which photo do you prefer?",
                RemainingInSession = 10
            });
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

            return Ok(new ComparisonResultResponse
            {
                ComparisonId = 1,
                Recorded = true,
                RemainingInSession = 9,
                MoreMatchupsAvailable = true
            });
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

            return Ok(new ComparisonResultResponse
            {
                ComparisonId = 1,
                Recorded = true,
                RemainingInSession = 9,
                MoreMatchupsAvailable = true
            });
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

            return Ok(new RankingsResponse
            {
                Category = request.Category,
                EventId = request.EventId,
                TotalPhotos = 5,
                TotalComparisons = 20,
                Rankings = new List<RankedPhotoDto>
                {
                    new RankedPhotoDto
                    {
                        Rank = 1,
                        PhotoId = 1,
                        FilePath = "/photos/sample1.jpg",
                        Caption = "Top ranked photo",
                        EloScore = 1650.0,
                        ComparisonCount = 10,
                        WinCount = 8,
                        WinRate = 0.8,
                        UploadedById = 1,
                        UploaderUsername = "user1"
                    },
                    new RankedPhotoDto
                    {
                        Rank = 2,
                        PhotoId = 2,
                        FilePath = "/photos/sample2.jpg",
                        Caption = "Second ranked photo",
                        EloScore = 1550.0,
                        ComparisonCount = 10,
                        WinCount = 6,
                        WinRate = 0.6,
                        UploadedById = 2,
                        UploaderUsername = "user2"
                    }
                }
            });
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

            return Ok(new PhotoRankingStatsResponse
            {
                PhotoId = request.PhotoId,
                FilePath = "/photos/sample.jpg",
                CategoryStats = new List<CategoryRankingStats>
                {
                    new CategoryRankingStats
                    {
                        Category = Enums.RankingCategory.BestMoment,
                        EloScore = 1500.0,
                        Rank = 3,
                        TotalInCategory = 10,
                        ComparisonCount = 5,
                        WinCount = 3,
                        WinRate = 0.6,
                        Uncertainty = 0.25,
                        IsStable = false
                    }
                }
            });
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

            return Ok(new List<ComparisonHistoryEntryDto>
            {
                new ComparisonHistoryEntryDto
                {
                    Id = 1,
                    Category = Enums.RankingCategory.BestMoment,
                    PhotoAId = 1,
                    PhotoAPath = "/photos/sample1.jpg",
                    PhotoBId = 2,
                    PhotoBPath = "/photos/sample2.jpg",
                    WinnerPhotoId = 1,
                    WasSkipped = false,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-5)
                },
                new ComparisonHistoryEntryDto
                {
                    Id = 2,
                    Category = Enums.RankingCategory.BestMoment,
                    PhotoAId = 3,
                    PhotoAPath = "/photos/sample3.jpg",
                    PhotoBId = 4,
                    PhotoBPath = "/photos/sample4.jpg",
                    WinnerPhotoId = null,
                    WasSkipped = true,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-3)
                }
            });
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

            return Ok(new { remainingComparisons = 15 });
        }
    }
}
