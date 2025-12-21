using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Enums;
using MomentRank.Models;

namespace MomentRank.Services
{
    public class RankingService : IRankingService
    {
        private readonly ApplicationDbContext _context;
        private readonly Random _random = new();

        private const int BootstrapComparisonCount = 5;
        private const int MaxComparisonCount = 12;
        private const double UncertaintyThreshold = 100.0;
        private const double InitialElo = 1500.0;
        private const double InitialUncertainty = 350.0;
        private const double InitialKFactor = 40.0;
        private const double MinKFactor = 16.0;

        // Hybrid budget-based matching constants
        private const int TargetComparisonsPerPhoto = 4;
        private const int MaxComparisonsPerUserPerCategory = 15;
        private const double ConfidenceMultiplier = 2.0;
        private const double MinOverlapForMatchup = 50.0;

        private static readonly Dictionary<RankingCategory, string> CategoryPrompts = new()
        {
            { RankingCategory.BestMoment, "Which photo better captures the best moment?" },
            { RankingCategory.Funniest, "Which photo is funnier?" },
            { RankingCategory.MostBeautiful, "Which photo is more beautiful?" },
            { RankingCategory.MostCreative, "Which photo is more creative?" },
            { RankingCategory.MostEmotional, "Which photo is more emotional?" }
        };

        public RankingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<MatchupResponse?> GetNextMatchupAsync(User user, GetNextMatchupRequest request)
        {
            var eventEntity = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == request.EventId);

            if (eventEntity == null || !eventEntity.MemberIds.Contains(user.Id))
                return null;

            if (eventEntity.Status != Enums.EventStatus.Ranking)
                return null;

            var category = await SelectBestCategoryAsync(user, request.EventId);
            if (category == null)
                return null;

            var matchup = await FindBestMatchupAsync(user, request.EventId, category.Value);
            if (matchup == null)
                return null;

            var (photoA, photoB) = matchup.Value;

            var remaining = await GetRemainingComparisonsInSessionAsync(user, request.EventId);

            return new MatchupResponse
            {
                PhotoA = await MapToPhotoForComparisonDto(photoA),
                PhotoB = await MapToPhotoForComparisonDto(photoB),
                Category = category.Value,
                Prompt = CategoryPrompts.GetValueOrDefault(category.Value, "Which photo do you prefer?"),
                RemainingInSession = remaining
            };
        }

        public async Task<int> GetRemainingComparisonsInSessionAsync(User user, int eventId)
        {
            var eligiblePhotos = await GetEligiblePhotosForMatchupAsync(user, eventId);

            if (eligiblePhotos.Count < 2)
                return 0;

            // Budget-based: each user gets limited comparisons per category
            var targetPerCategory = Math.Min(eligiblePhotos.Count * TargetComparisonsPerPhoto / 2, MaxComparisonsPerUserPerCategory);
            var categoryCount = Enum.GetValues<RankingCategory>().Length;
            var totalBudget = targetPerCategory * categoryCount;

            var completedByUser = await _context.PhotoComparisons
                .CountAsync(pc => pc.VoterId == user.Id && pc.EventId == eventId);

            return Math.Max(0, totalBudget - completedByUser);
        }

        public async Task<ComparisonResultResponse?> SubmitComparisonAsync(User user, SubmitComparisonRequest request)
        {
            var eventEntity = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == request.EventId);

            if (eventEntity == null || eventEntity.Status != Enums.EventStatus.Ranking)
                return null;

            if (!await IsValidMatchupAsync(user, request.EventId, request.PhotoAId, request.PhotoBId))
                return null;

            var ratingA = await GetOrCreatePhotoRatingAsync(request.PhotoAId, request.EventId, request.Category);
            var ratingB = await GetOrCreatePhotoRatingAsync(request.PhotoBId, request.EventId, request.Category);

            var eloBefore = (ratingA.EloScore, ratingB.EloScore);

            if (request.WinnerPhotoId.HasValue)
            {
                UpdateEloScores(ratingA, ratingB, request.WinnerPhotoId.Value);
            }

            var comparison = new PhotoComparison
            {
                EventId = request.EventId,
                Category = request.Category,
                PhotoAId = request.PhotoAId,
                PhotoBId = request.PhotoBId,
                WinnerPhotoId = request.WinnerPhotoId,
                VoterId = user.Id,
                PhotoAEloBefore = eloBefore.Item1,
                PhotoBEloBefore = eloBefore.Item2,
                PhotoAEloAfter = ratingA.EloScore,
                PhotoBEloAfter = ratingB.EloScore,
                WasSkipped = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PhotoComparisons.Add(comparison);
            await _context.SaveChangesAsync();

            var remaining = await GetRemainingComparisonsInSessionAsync(user, request.EventId);
            var moreAvailable = await HasMoreMatchupsAvailableAsync(user, request.EventId, request.Category);

            return new ComparisonResultResponse
            {
                ComparisonId = comparison.Id,
                Recorded = true,
                RemainingInSession = remaining,
                MoreMatchupsAvailable = moreAvailable
            };
        }

        public async Task<ComparisonResultResponse?> SkipComparisonAsync(User user, SkipComparisonRequest request)
        {
            var eventEntity = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == request.EventId);

            if (eventEntity == null || eventEntity.Status != Enums.EventStatus.Ranking)
                return null;

            if (!await IsValidMatchupAsync(user, request.EventId, request.PhotoAId, request.PhotoBId))
                return null;

            var ratingA = await GetOrCreatePhotoRatingAsync(request.PhotoAId, request.EventId, request.Category);
            var ratingB = await GetOrCreatePhotoRatingAsync(request.PhotoBId, request.EventId, request.Category);

            var comparison = new PhotoComparison
            {
                EventId = request.EventId,
                Category = request.Category,
                PhotoAId = request.PhotoAId,
                PhotoBId = request.PhotoBId,
                WinnerPhotoId = null,
                VoterId = user.Id,
                PhotoAEloBefore = ratingA.EloScore,
                PhotoBEloBefore = ratingB.EloScore,
                PhotoAEloAfter = ratingA.EloScore,
                PhotoBEloAfter = ratingB.EloScore,
                WasSkipped = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.PhotoComparisons.Add(comparison);
            await _context.SaveChangesAsync();

            var remaining = await GetRemainingComparisonsInSessionAsync(user, request.EventId);
            var moreAvailable = await HasMoreMatchupsAvailableAsync(user, request.EventId, request.Category);

            return new ComparisonResultResponse
            {
                ComparisonId = comparison.Id,
                Recorded = true,
                RemainingInSession = remaining,
                MoreMatchupsAvailable = moreAvailable
            };
        }

        public async Task<RankingsResponse?> GetRankingsAsync(User user, GetRankingsRequest request)
        {
            var eventEntity = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == request.EventId);

            if (eventEntity == null || !eventEntity.MemberIds.Contains(user.Id))
                return null;

            var ratings = await _context.PhotoRatings
                .Include(pr => pr.Photo)
                    .ThenInclude(p => p.UploadedBy)
                .Where(pr => pr.EventId == request.EventId && pr.Category == request.Category)
                .OrderByDescending(pr => pr.EloScore)
                .Take(request.TopN)
                .ToListAsync();

            var totalPhotos = await _context.PhotoRatings
                .CountAsync(pr => pr.EventId == request.EventId && pr.Category == request.Category);

            var totalComparisons = await GetTotalComparisonsAsync(request.EventId, request.Category);

            var rankedPhotos = ratings.Select((r, index) => new RankedPhotoDto
            {
                Rank = index + 1,
                PhotoId = r.PhotoId,
                FilePath = r.Photo.FilePath,
                Caption = r.Photo.Caption,
                EloScore = r.EloScore,
                ComparisonCount = r.ComparisonCount,
                WinCount = r.WinCount,
                WinRate = r.ComparisonCount > 0 ? (double)r.WinCount / r.ComparisonCount : 0,
                UploadedById = r.Photo.UploadedById,
                UploaderUsername = r.Photo.UploadedBy.Username
            }).ToList();

            return new RankingsResponse
            {
                Category = request.Category,
                EventId = request.EventId,
                TotalPhotos = totalPhotos,
                TotalComparisons = totalComparisons,
                Rankings = rankedPhotos
            };
        }

        public async Task<PhotoRankingStatsResponse?> GetPhotoRankingStatsAsync(User user, GetPhotoRankingStatsRequest request)
        {
            var photo = await _context.Photos
                .Include(p => p.UploadedBy)
                .FirstOrDefaultAsync(p => p.Id == request.PhotoId && p.EventId == request.EventId);

            if (photo == null)
                return null;

            var eventEntity = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == request.EventId);

            if (eventEntity == null || !eventEntity.MemberIds.Contains(user.Id))
                return null;

            var ratings = await _context.PhotoRatings
                .Where(pr => pr.PhotoId == request.PhotoId && pr.EventId == request.EventId)
                .ToListAsync();

            var categoryStats = new List<CategoryRankingStats>();

            foreach (var rating in ratings)
            {
                var rank = await _context.PhotoRatings
                    .CountAsync(pr => pr.EventId == request.EventId
                        && pr.Category == rating.Category
                        && pr.EloScore > rating.EloScore) + 1;

                var total = await _context.PhotoRatings
                    .CountAsync(pr => pr.EventId == request.EventId && pr.Category == rating.Category);

                categoryStats.Add(new CategoryRankingStats
                {
                    Category = rating.Category,
                    EloScore = rating.EloScore,
                    Rank = rank,
                    TotalInCategory = total,
                    ComparisonCount = rating.ComparisonCount,
                    WinCount = rating.WinCount,
                    WinRate = rating.ComparisonCount > 0 ? (double)rating.WinCount / rating.ComparisonCount : 0,
                    Uncertainty = rating.Uncertainty,
                    IsStable = rating.IsStable
                });
            }

            return new PhotoRankingStatsResponse
            {
                PhotoId = photo.Id,
                FilePath = photo.FilePath,
                CategoryStats = categoryStats
            };
        }

        public async Task<PagedResult<ComparisonHistoryEntryDto>?> GetComparisonHistoryAsync(User user, GetComparisonHistoryRequest request)
        {
            var eventEntity = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == request.EventId);

            if (eventEntity == null || !eventEntity.MemberIds.Contains(user.Id))
                return null;

            var query = _context.PhotoComparisons
                .Include(pc => pc.PhotoA)
                .Include(pc => pc.PhotoB)
                .Where(pc => pc.EventId == request.EventId && pc.VoterId == user.Id);

            if (request.Category.HasValue)
            {
                query = query.Where(pc => pc.Category == request.Category.Value);
            }

            var totalCount = await query.CountAsync();

            var comparisons = await query
                .OrderByDescending(pc => pc.CreatedAt)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(pc => new ComparisonHistoryEntryDto
                {
                    Id = pc.Id,
                    Category = pc.Category,
                    PhotoAId = pc.PhotoAId,
                    PhotoAPath = pc.PhotoA.FilePath,
                    PhotoBId = pc.PhotoBId,
                    PhotoBPath = pc.PhotoB.FilePath,
                    WinnerPhotoId = pc.WinnerPhotoId,
                    WasSkipped = pc.WasSkipped,
                    CreatedAt = pc.CreatedAt
                })
                .ToListAsync();

            return new PagedResult<ComparisonHistoryEntryDto>(
                comparisons,
                totalCount,
                request.PageNumber,
                request.PageSize);
        }

        public async Task<int> GetTotalComparisonsAsync(int eventId, RankingCategory category)
        {
            return await _context.PhotoComparisons
                .CountAsync(pc => pc.EventId == eventId && pc.Category == category && !pc.WasSkipped);
        }

        public async Task<int> GetRatedPhotosCountAsync(int eventId, RankingCategory category)
        {
            return await _context.PhotoRatings
                .CountAsync(pr => pr.EventId == eventId && pr.Category == category);
        }

        public async Task<List<PhotoRating>> InitializePhotoRatingsAsync(int photoId, int eventId)
        {
            var existingRatings = await _context.PhotoRatings
                .Where(pr => pr.PhotoId == photoId && pr.EventId == eventId)
                .ToListAsync();

            if (existingRatings.Any())
                return existingRatings;

            var ratings = new List<PhotoRating>();
            foreach (RankingCategory category in Enum.GetValues<RankingCategory>())
            {
                var rating = new PhotoRating
                {
                    PhotoId = photoId,
                    EventId = eventId,
                    Category = category,
                    EloScore = InitialElo,
                    Uncertainty = InitialUncertainty,
                    KFactor = InitialKFactor,
                    ComparisonCount = 0,
                    WinCount = 0,
                    IsBootstrapped = false,
                    IsStable = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                ratings.Add(rating);
                _context.PhotoRatings.Add(rating);
            }

            await _context.SaveChangesAsync();
            return ratings;
        }

        public async Task<PhotoRating?> GetPhotoRatingAsync(int photoId, int eventId, RankingCategory category)
        {
            return await _context.PhotoRatings
                .FirstOrDefaultAsync(pr => pr.PhotoId == photoId
                    && pr.EventId == eventId
                    && pr.Category == category);
        }

        public async Task<bool> CanUserVoteInEventAsync(User user, int eventId)
        {
            var eventEntity = await _context.Events
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (eventEntity == null)
                return false;

            return eventEntity.MemberIds.Contains(user.Id);
        }

        public async Task<bool> CanUserViewRankingsAsync(User user, int eventId)
        {
            return await CanUserVoteInEventAsync(user, eventId);
        }

        public async Task<bool> IsValidMatchupAsync(User user, int eventId, int photoAId, int photoBId)
        {
            if (photoAId == photoBId)
                return false;

            var photos = await _context.Photos
                .Where(p => (p.Id == photoAId || p.Id == photoBId) && p.EventId == eventId)
                .ToListAsync();

            if (photos.Count != 2)
                return false;

            if (photos.Any(p => p.UploadedById == user.Id))
                return false;

            // Allow matchups between photos from the same person
            // if (photos[0].UploadedById == photos[1].UploadedById)
            //     return false;

            return true;
        }

        private async Task<RankingCategory?> SelectBestCategoryAsync(User user, int eventId)
        {
            var categoryScores = new Dictionary<RankingCategory, double>();

            foreach (RankingCategory category in Enum.GetValues<RankingCategory>())
            {
                var score = await CalculateCategoryPriorityAsync(user, eventId, category);
                if (score > 0)
                {
                    categoryScores[category] = score;
                }
            }

            if (!categoryScores.Any())
                return null;

            var totalScore = categoryScores.Values.Sum();
            var randomValue = _random.NextDouble() * totalScore;
            var cumulative = 0.0;

            foreach (var (category, score) in categoryScores)
            {
                cumulative += score;
                if (randomValue <= cumulative)
                    return category;
            }

            return categoryScores.Keys.First();
        }

        private async Task<double> CalculateCategoryPriorityAsync(User user, int eventId, RankingCategory category)
        {

            var highUncertaintyCount = await _context.PhotoRatings
                .CountAsync(pr => pr.EventId == eventId
                    && pr.Category == category
                    && pr.Uncertainty > UncertaintyThreshold);

            var newPhotosCount = await _context.PhotoRatings
                .CountAsync(pr => pr.EventId == eventId
                    && pr.Category == category
                    && !pr.IsBootstrapped);

            var availableMatchups = await CountAvailableMatchupsAsync(user, eventId, category);
            if (availableMatchups == 0)
                return 0;

            return 1.0 + (newPhotosCount * 2.0) + (highUncertaintyCount * 0.5);
        }

        private async Task<int> CountAvailableMatchupsAsync(User user, int eventId, RankingCategory category)
        {
            var eligiblePhotos = await GetEligiblePhotosForMatchupAsync(user, eventId);

            if (eligiblePhotos.Count < 2)
                return 0;

            return eligiblePhotos.Count * (eligiblePhotos.Count - 1) / 2;
        }

        private async Task<(Photo, Photo)?> FindBestMatchupAsync(User user, int eventId, RankingCategory category)
        {
            var eligiblePhotos = await GetEligiblePhotosForMatchupAsync(user, eventId);

            if (eligiblePhotos.Count < 2)
                return null;

            // Ensure all photos have ratings initialized
            var ratings = await _context.PhotoRatings
                .Where(pr => pr.EventId == eventId
                    && pr.Category == category
                    && eligiblePhotos.Select(p => p.Id).Contains(pr.PhotoId))
                .ToDictionaryAsync(pr => pr.PhotoId);

            foreach (var photo in eligiblePhotos)
            {
                if (!ratings.ContainsKey(photo.Id))
                {
                    await InitializePhotoRatingsAsync(photo.Id, eventId);
                    var rating = await GetPhotoRatingAsync(photo.Id, eventId, category);
                    if (rating != null)
                        ratings[photo.Id] = rating;
                }
            }

            // Check if user has exhausted their budget
            var remaining = await GetRemainingComparisonsInSessionAsync(user, eventId);
            if (remaining <= 0)
                return null;

            // Try information-gain based selection
            return await SelectMostInformativeMatchupAsync(user, eventId, category, eligiblePhotos, ratings);
        }

        private async Task<List<Photo>> GetEligiblePhotosForMatchupAsync(User user, int eventId)
        {
            var photos = await _context.Photos
                .Where(p => p.EventId == eventId && p.UploadedById != user.Id)
                .ToListAsync();

            Console.WriteLine($"[RankingService] GetEligiblePhotos: User {user.Id}, Event {eventId}, Found {photos.Count} eligible photos");

            return photos;
        }

        private async Task<(Photo, Photo)?> SelectMostInformativeMatchupAsync(
            User user,
            int eventId,
            RankingCategory category,
            List<Photo> eligiblePhotos,
            Dictionary<int, PhotoRating> ratings)
        {
            // Get pairs with overlapping confidence bounds (uncertain rankings)
            var overlappingPairs = GetPairsWithOverlappingBounds(ratings.Values.ToList());
            if (!overlappingPairs.Any())
            {
                // All rankings are stable, no more matchups needed
                return null;
            }

            var userComparedPairs = await GetUserComparedPairsAsync(user, eventId, category);
            var globalVoteCounts = await GetGlobalVoteCountsAsync(eventId, category);

            // Score each pair by: uncertainty × (1 / (globalVotes + 1))
            // This prioritizes uncertain pairs that haven't been voted on much globally
            var scoredPairs = overlappingPairs
                .Where(p => !userComparedPairs.Contains(NormalizePair(p.Item1.PhotoId, p.Item2.PhotoId)))
                .Where(p => eligiblePhotos.Any(ph => ph.Id == p.Item1.PhotoId) &&
                           eligiblePhotos.Any(ph => ph.Id == p.Item2.PhotoId))
                .Select(p => new
                {
                    Pair = p,
                    Score = (p.Item1.Uncertainty + p.Item2.Uncertainty) /
                            (1 + globalVoteCounts.GetValueOrDefault(NormalizePair(p.Item1.PhotoId, p.Item2.PhotoId), 0))
                })
                .OrderByDescending(x => x.Score)
                .Take(5)
                .ToList();

            if (!scoredPairs.Any())
            {
                // Fallback: find any pair user hasn't compared
                return await SelectFallbackMatchupAsync(user, eventId, category, eligiblePhotos, ratings);
            }

            // Pick randomly from top 5 for variety
            var selected = scoredPairs[_random.Next(scoredPairs.Count)].Pair;
            var photoA = eligiblePhotos.FirstOrDefault(p => p.Id == selected.Item1.PhotoId);
            var photoB = eligiblePhotos.FirstOrDefault(p => p.Id == selected.Item2.PhotoId);

            if (photoA == null || photoB == null)
                return null;

            return (photoA, photoB);
        }

        private List<(PhotoRating, PhotoRating)> GetPairsWithOverlappingBounds(List<PhotoRating> ratings)
        {
            var overlappingPairs = new List<(PhotoRating, PhotoRating)>();

            for (int i = 0; i < ratings.Count; i++)
            {
                for (int j = i + 1; j < ratings.Count; j++)
                {
                    var ratingA = ratings[i];
                    var ratingB = ratings[j];

                    // Check if confidence bounds overlap
                    var upperA = ratingA.EloScore + (ConfidenceMultiplier * ratingA.Uncertainty);
                    var lowerA = ratingA.EloScore - (ConfidenceMultiplier * ratingA.Uncertainty);
                    var upperB = ratingB.EloScore + (ConfidenceMultiplier * ratingB.Uncertainty);
                    var lowerB = ratingB.EloScore - (ConfidenceMultiplier * ratingB.Uncertainty);

                    // Overlap exists if one's lower bound is below the other's upper bound
                    var overlap = Math.Min(upperA, upperB) - Math.Max(lowerA, lowerB);
                    if (overlap > MinOverlapForMatchup)
                    {
                        overlappingPairs.Add((ratingA, ratingB));
                    }
                }
            }

            return overlappingPairs;
        }

        private async Task<Dictionary<(int, int), int>> GetGlobalVoteCountsAsync(int eventId, RankingCategory category)
        {
            var comparisons = await _context.PhotoComparisons
                .Where(pc => pc.EventId == eventId && pc.Category == category && !pc.WasSkipped)
                .Select(pc => new { pc.PhotoAId, pc.PhotoBId })
                .ToListAsync();

            return comparisons
                .GroupBy(c => NormalizePair(c.PhotoAId, c.PhotoBId))
                .ToDictionary(g => g.Key, g => g.Count());
        }

        private async Task<HashSet<(int, int)>> GetUserComparedPairsAsync(User user, int eventId, RankingCategory category)
        {
            var pairs = await _context.PhotoComparisons
                .Where(pc => pc.EventId == eventId && pc.Category == category && pc.VoterId == user.Id)
                .Select(pc => new { pc.PhotoAId, pc.PhotoBId })
                .ToListAsync();

            return pairs.Select(p => NormalizePair(p.PhotoAId, p.PhotoBId)).ToHashSet();
        }

        private async Task<(Photo, Photo)?> SelectFallbackMatchupAsync(
            User user,
            int eventId,
            RankingCategory category,
            List<Photo> eligiblePhotos,
            Dictionary<int, PhotoRating> ratings)
        {
            var userComparedPairs = await GetUserComparedPairsAsync(user, eventId, category);

            // Find any pair user hasn't compared, prioritizing high uncertainty photos
            var sortedPhotos = eligiblePhotos
                .Where(p => ratings.ContainsKey(p.Id))
                .OrderByDescending(p => ratings[p.Id].Uncertainty)
                .ToList();

            foreach (var photoA in sortedPhotos)
            {
                foreach (var photoB in sortedPhotos.Where(p => p.Id != photoA.Id))
                {
                    if (!userComparedPairs.Contains(NormalizePair(photoA.Id, photoB.Id)))
                    {
                        return (photoA, photoB);
                    }
                }
            }

            return null;
        }

        private static (int, int) NormalizePair(int a, int b) => (Math.Min(a, b), Math.Max(a, b));

        private async Task<bool> HasMoreMatchupsAvailableAsync(User user, int eventId, RankingCategory category)
        {
            var eligiblePhotos = await GetEligiblePhotosForMatchupAsync(user, eventId);
            if (eligiblePhotos.Count < 2)
                return false;

            var remaining = await GetRemainingComparisonsInSessionAsync(user, eventId);
            return remaining > 0;
        }

        private async Task<PhotoRating> GetOrCreatePhotoRatingAsync(int photoId, int eventId, RankingCategory category)
        {
            var rating = await GetPhotoRatingAsync(photoId, eventId, category);

            if (rating == null)
            {
                await InitializePhotoRatingsAsync(photoId, eventId);
                rating = await GetPhotoRatingAsync(photoId, eventId, category);
            }

            return rating!;
        }

        private void UpdateEloScores(PhotoRating ratingA, PhotoRating ratingB, int winnerPhotoId)
        {
            var expectedA = 1.0 / (1.0 + Math.Pow(10, (ratingB.EloScore - ratingA.EloScore) / 400.0));
            var expectedB = 1.0 - expectedA;

            var scoreA = winnerPhotoId == ratingA.PhotoId ? 1.0 : 0.0;
            var scoreB = winnerPhotoId == ratingB.PhotoId ? 1.0 : 0.0;

            ratingA.EloScore += ratingA.KFactor * (scoreA - expectedA);
            ratingB.EloScore += ratingB.KFactor * (scoreB - expectedB);

            ratingA.ComparisonCount++;
            ratingB.ComparisonCount++;

            if (scoreA > 0) ratingA.WinCount++;
            if (scoreB > 0) ratingB.WinCount++;

            UpdateRatingMetadata(ratingA);
            UpdateRatingMetadata(ratingB);
        }

        private void UpdateRatingMetadata(PhotoRating rating)
        {
            rating.Uncertainty = Math.Max(50, rating.Uncertainty * 0.9);

            var kDecay = Math.Max(0, (rating.ComparisonCount - BootstrapComparisonCount)) * 2;
            rating.KFactor = Math.Max(MinKFactor, InitialKFactor - kDecay);

            if (rating.ComparisonCount >= BootstrapComparisonCount)
            {
                rating.IsBootstrapped = true;
            }

            if (rating.Uncertainty <= UncertaintyThreshold || rating.ComparisonCount >= MaxComparisonCount)
            {
                rating.IsStable = true;
            }

            rating.UpdatedAt = DateTime.UtcNow;
        }

        private async Task<PhotoForComparisonDto> MapToPhotoForComparisonDto(Photo photo)
        {
            var uploader = await _context.Users.FindAsync(photo.UploadedById);

            return new PhotoForComparisonDto
            {
                Id = photo.Id,
                FilePath = photo.FilePath,
                Caption = photo.Caption,
                UploadedById = photo.UploadedById,
                UploaderUsername = uploader?.Username ?? "Unknown"
            };
        }
    }
}
