using MomentRank.Enums;

namespace MomentRank.DTOs
{
    public record GetNextMatchupRequest
    {
        public required int EventId { get; init; }
    }

    public record SubmitComparisonRequest
    {
        public required int EventId { get; init; }
        public required RankingCategory Category { get; init; }
        public required int PhotoAId { get; init; }
        public required int PhotoBId { get; init; }
        public int? WinnerPhotoId { get; init; }
    }

    public record SkipComparisonRequest
    {
        public required int EventId { get; init; }
        public required RankingCategory Category { get; init; }
        public required int PhotoAId { get; init; }
        public required int PhotoBId { get; init; }
    }

    public record GetRankingsRequest
    {
        public required int EventId { get; init; }
        public required RankingCategory Category { get; init; }
        public int TopN { get; init; } = 10;
    }

    public record GetComparisonHistoryRequest
    {
        public required int EventId { get; init; }
        public RankingCategory? Category { get; init; }
        public int PageNumber { get; init; } = 1;
        public int PageSize { get; init; } = 20;
    }

    public record GetPhotoRankingStatsRequest
    {
        public required int PhotoId { get; init; }
        public required int EventId { get; init; }
    }

    public record MatchupResponse
    {
        public required PhotoForComparisonDto PhotoA { get; init; }
        public required PhotoForComparisonDto PhotoB { get; init; }
        public required RankingCategory Category { get; init; }
        public required string Prompt { get; init; }
        // public int RemainingInSession { get; init; }
    }

    public record PhotoForComparisonDto
    {
        public required int Id { get; init; }
        public required string FilePath { get; init; }
        public string? Caption { get; init; }
        public required int UploadedById { get; init; }
        public required string UploaderUsername { get; init; }
    }

    public record ComparisonResultResponse
    {
        public required int ComparisonId { get; init; }
        public required bool Recorded { get; init; }
        // public int RemainingInSession { get; init; }
        public bool MoreMatchupsAvailable { get; init; }
    }

    public record RankedPhotoDto
    {
        public required int Rank { get; init; }
        public required int PhotoId { get; init; }
        public required string FilePath { get; init; }
        public string? Caption { get; init; }
        public required double EloScore { get; init; }
        public required int ComparisonCount { get; init; }
        public required int WinCount { get; init; }
        public required double WinRate { get; init; }
        public required int UploadedById { get; init; }
        public required string UploaderUsername { get; init; }
    }

    public record RankingsResponse
    {
        public required RankingCategory Category { get; init; }
        public required int EventId { get; init; }
        public required int TotalPhotos { get; init; }
        public required int TotalComparisons { get; init; }
        public required List<RankedPhotoDto> Rankings { get; init; }
    }

    public class ComparisonHistoryEntryDto
    {
        public int Id { get; set; }
        public RankingCategory Category { get; set; }
        public int PhotoAId { get; set; }
        public string PhotoAPath { get; set; } = string.Empty;
        public int PhotoBId { get; set; }
        public string PhotoBPath { get; set; } = string.Empty;
        public int? WinnerPhotoId { get; set; }
        public bool WasSkipped { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public record PhotoRankingStatsResponse
    {
        public required int PhotoId { get; init; }
        public required string FilePath { get; init; }
        public required List<CategoryRankingStats> CategoryStats { get; init; }
    }

    public record CategoryRankingStats
    {
        public required RankingCategory Category { get; init; }
        public required double EloScore { get; init; }
        public required int Rank { get; init; }
        public required int TotalInCategory { get; init; }
        public required int ComparisonCount { get; init; }
        public required int WinCount { get; init; }
        public required double WinRate { get; init; }
        public required double Uncertainty { get; init; }
        public required bool IsStable { get; init; }
    }

    public record NoMatchupAvailableResponse
    {
        public required string Message { get; init; }
        public required string Reason { get; init; }
        public string? SuggestedAction { get; init; }
    }
}
