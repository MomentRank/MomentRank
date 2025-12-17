using MomentRank.DTOs;
using MomentRank.Enums;
using MomentRank.Models;

namespace MomentRank.Services
{
    public interface IRankingService
    {
        // Matchup Selection
        Task<MatchupResponse?> GetNextMatchupAsync(User user, GetNextMatchupRequest request);
        Task<int> GetRemainingComparisonsInSessionAsync(User user, int eventId, RankingCategory category);

        // Voting/Comparison Submission
        Task<ComparisonResultResponse?> SubmitComparisonAsync(User user, SubmitComparisonRequest request);
        Task<ComparisonResultResponse?> SkipComparisonAsync(User user, SkipComparisonRequest request);

        // Rankings
        Task<RankingsResponse?> GetRankingsAsync(User user, GetRankingsRequest request);
        Task<PhotoRankingStatsResponse?> GetPhotoRankingStatsAsync(User user, GetPhotoRankingStatsRequest request);

        // Analytics
        Task<PagedResult<ComparisonHistoryEntryDto>?> GetComparisonHistoryAsync(User user, GetComparisonHistoryRequest request);
        Task<int> GetTotalComparisonsAsync(int eventId, RankingCategory category);
        Task<int> GetRatedPhotosCountAsync(int eventId, RankingCategory category);

        // Photo Rating Management
        Task<List<PhotoRating>> InitializePhotoRatingsAsync(int photoId, int eventId);
        Task<PhotoRating?> GetPhotoRatingAsync(int photoId, int eventId, RankingCategory category);
        Task<bool> IsPhotoBootstrappedAsync(int photoId, int eventId, RankingCategory category);
        Task<bool> IsPhotoStableAsync(int photoId, int eventId, RankingCategory category);

        // Validation
        Task<bool> CanUserVoteInEventAsync(User user, int eventId);
        Task<bool> CanUserViewRankingsAsync(User user, int eventId);
        Task<bool> IsValidMatchupAsync(User user, int eventId, int photoAId, int photoBId);
    }
}
