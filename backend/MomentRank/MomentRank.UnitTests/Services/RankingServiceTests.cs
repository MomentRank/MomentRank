using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Enums;
using MomentRank.Models;
using MomentRank.Services;
using Xunit;

namespace MomentRank.UnitTests.Services
{
    public class RankingServiceTests
    {
        private readonly ApplicationDbContext _context;
        private readonly RankingService _service;

        public RankingServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _service = new RankingService(_context);
        }

        #region InitializePhotoRatingsAsync Tests

        [Fact]
        public async Task InitializePhotoRatingsAsync_ShouldCreateRatingsForAllCategories()
        {
            var user = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test Event",
                OwnerId = user.Id,
                MemberIds = new List<int> { user.Id },
                EndsAt = DateTime.UtcNow.AddHours(-1), // Ended to be in Ranking status
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Public = true
            };
            _context.Events.Add(eventObj);

            var photo = new Photo
            {
                Id = 1,
                EventId = eventObj.Id,
                UploadedById = user.Id,
                FileName = "test.jpg",
                FilePath = "/uploads/test.jpg",
                ContentType = "image/jpeg"
            };
            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();

            var result = await _service.InitializePhotoRatingsAsync(photo.Id, eventObj.Id);

            result.Should().HaveCount(5); // 5 RankingCategories
            result.All(r => r.EloScore == 1500.0).Should().BeTrue();
            result.All(r => r.PhotoId == photo.Id).Should().BeTrue();
        }

        [Fact]
        public async Task InitializePhotoRatingsAsync_ShouldReturnExisting_WhenAlreadyInitialized()
        {
            var user = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event { Id = 1, Name = "Test", OwnerId = user.Id, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);

            var photo = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = user.Id, FileName = "test.jpg", FilePath = "/test", ContentType = "image/jpeg" };
            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();

            // Initialize first time
            await _service.InitializePhotoRatingsAsync(photo.Id, eventObj.Id);

            // Initialize second time
            var result = await _service.InitializePhotoRatingsAsync(photo.Id, eventObj.Id);

            result.Should().HaveCount(5);
            var ratingsInDb = await _context.PhotoRatings.Where(pr => pr.PhotoId == photo.Id).ToListAsync();
            ratingsInDb.Should().HaveCount(5); // Not duplicated
        }

        #endregion

        #region GetPhotoRatingAsync Tests

        [Fact]
        public async Task GetPhotoRatingAsync_ShouldReturnRating_WhenExists()
        {
            var user = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event { Id = 1, Name = "Test", OwnerId = user.Id, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);

            var photo = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = user.Id, FileName = "test.jpg", FilePath = "/test", ContentType = "image/jpeg" };
            _context.Photos.Add(photo);

            var rating = new PhotoRating
            {
                PhotoId = photo.Id,
                EventId = eventObj.Id,
                Category = RankingCategory.BestMoment,
                EloScore = 1600.0
            };
            _context.PhotoRatings.Add(rating);
            await _context.SaveChangesAsync();

            var result = await _service.GetPhotoRatingAsync(photo.Id, eventObj.Id, RankingCategory.BestMoment);

            result.Should().NotBeNull();
            result!.EloScore.Should().Be(1600.0);
        }

        [Fact]
        public async Task GetPhotoRatingAsync_ShouldReturnNull_WhenNotExists()
        {
            var result = await _service.GetPhotoRatingAsync(999, 999, RankingCategory.BestMoment);
            result.Should().BeNull();
        }

        #endregion

        #region CanUserVoteInEventAsync Tests

        [Fact]
        public async Task CanUserVoteInEventAsync_ShouldReturnTrue_WhenUserIsMember()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = 99,
                MemberIds = new List<int> { user.Id },
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var result = await _service.CanUserVoteInEventAsync(user, eventObj.Id);

            result.Should().BeTrue();
        }

        [Fact]
        public async Task CanUserVoteInEventAsync_ShouldReturnFalse_WhenUserIsNotMember()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = 99,
                MemberIds = new List<int>(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var result = await _service.CanUserVoteInEventAsync(user, eventObj.Id);

            result.Should().BeFalse();
        }

        [Fact]
        public async Task CanUserVoteInEventAsync_ShouldReturnFalse_WhenEventNotFound()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };

            var result = await _service.CanUserVoteInEventAsync(user, 999);

            result.Should().BeFalse();
        }

        #endregion

        #region IsValidMatchupAsync Tests

        [Fact]
        public async Task IsValidMatchupAsync_ShouldReturnFalse_WhenPhotosAreSame()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };

            var result = await _service.IsValidMatchupAsync(user, 1, 5, 5);

            result.Should().BeFalse();
        }

        [Fact]
        public async Task IsValidMatchupAsync_ShouldReturnFalse_WhenPhotosBelongToUser()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event { Id = 1, Name = "Test", OwnerId = 99, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);

            var photo1 = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = user.Id, FileName = "a.jpg", FilePath = "/a", ContentType = "image/jpeg" };
            var photo2 = new Photo { Id = 2, EventId = eventObj.Id, UploadedById = 99, FileName = "b.jpg", FilePath = "/b", ContentType = "image/jpeg" };
            _context.Photos.AddRange(photo1, photo2);
            await _context.SaveChangesAsync();

            var result = await _service.IsValidMatchupAsync(user, eventObj.Id, photo1.Id, photo2.Id);

            result.Should().BeFalse(); // User owns photo1
        }

        [Fact]
        public async Task IsValidMatchupAsync_ShouldReturnTrue_WhenValid()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            var uploader1 = new User { Id = 2, Username = "Up1", Email = "up1@test.com", PasswordHash = "hash" };
            var uploader2 = new User { Id = 3, Username = "Up2", Email = "up2@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(user, uploader1, uploader2);

            var eventObj = new Event { Id = 1, Name = "Test", OwnerId = 99, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);

            var photo1 = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = uploader1.Id, FileName = "a.jpg", FilePath = "/a", ContentType = "image/jpeg" };
            var photo2 = new Photo { Id = 2, EventId = eventObj.Id, UploadedById = uploader2.Id, FileName = "b.jpg", FilePath = "/b", ContentType = "image/jpeg" };
            _context.Photos.AddRange(photo1, photo2);
            await _context.SaveChangesAsync();

            var result = await _service.IsValidMatchupAsync(user, eventObj.Id, photo1.Id, photo2.Id);

            result.Should().BeTrue();
        }

        [Fact]
        public async Task IsValidMatchupAsync_ShouldReturnFalse_WhenPhotosNotInEvent()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event { Id = 1, Name = "Test", OwnerId = 99, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var result = await _service.IsValidMatchupAsync(user, eventObj.Id, 999, 998);

            result.Should().BeFalse();
        }

        #endregion

        #region GetTotalComparisonsAsync Tests

        [Fact]
        public async Task GetTotalComparisonsAsync_ShouldReturnCount_ExcludingSkipped()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event { Id = 1, Name = "Test", OwnerId = user.Id, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);

            var comparison1 = new PhotoComparison { EventId = 1, Category = RankingCategory.BestMoment, PhotoAId = 1, PhotoBId = 2, VoterId = user.Id, WasSkipped = false };
            var comparison2 = new PhotoComparison { EventId = 1, Category = RankingCategory.BestMoment, PhotoAId = 1, PhotoBId = 3, VoterId = user.Id, WasSkipped = true };
            var comparison3 = new PhotoComparison { EventId = 1, Category = RankingCategory.BestMoment, PhotoAId = 2, PhotoBId = 3, VoterId = user.Id, WasSkipped = false };
            _context.PhotoComparisons.AddRange(comparison1, comparison2, comparison3);
            await _context.SaveChangesAsync();

            var result = await _service.GetTotalComparisonsAsync(eventObj.Id, RankingCategory.BestMoment);

            result.Should().Be(2); // Only non-skipped
        }

        #endregion

        #region GetRatedPhotosCountAsync Tests

        [Fact]
        public async Task GetRatedPhotosCountAsync_ShouldReturnCorrectCount()
        {
            var eventObj = new Event { Id = 1, Name = "Test", OwnerId = 1, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);

            _context.PhotoRatings.AddRange(
                new PhotoRating { PhotoId = 1, EventId = 1, Category = RankingCategory.BestMoment },
                new PhotoRating { PhotoId = 2, EventId = 1, Category = RankingCategory.BestMoment },
                new PhotoRating { PhotoId = 3, EventId = 1, Category = RankingCategory.Funniest }
            );
            await _context.SaveChangesAsync();

            var result = await _service.GetRatedPhotosCountAsync(1, RankingCategory.BestMoment);

            result.Should().Be(2);
        }

        #endregion

        #region SubmitComparisonAsync Tests

        [Fact]
        public async Task SubmitComparisonAsync_ShouldRecordComparison_WhenValid()
        {
            var voter = new User { Id = 1, Username = "Voter", Email = "voter@test.com", PasswordHash = "hash" };
            var uploader1 = new User { Id = 2, Username = "Up1", Email = "up1@test.com", PasswordHash = "hash" };
            var uploader2 = new User { Id = 3, Username = "Up2", Email = "up2@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(voter, uploader1, uploader2);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = uploader1.Id,
                MemberIds = new List<int> { voter.Id, uploader1.Id, uploader2.Id },
                EndsAt = DateTime.UtcNow.AddHours(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                Public = true
            };
            _context.Events.Add(eventObj);

            var photo1 = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = uploader1.Id, FileName = "a.jpg", FilePath = "/a", ContentType = "image/jpeg" };
            var photo2 = new Photo { Id = 2, EventId = eventObj.Id, UploadedById = uploader2.Id, FileName = "b.jpg", FilePath = "/b", ContentType = "image/jpeg" };
            _context.Photos.AddRange(photo1, photo2);
            await _context.SaveChangesAsync();

            var request = new SubmitComparisonRequest
            {
                EventId = eventObj.Id,
                Category = RankingCategory.BestMoment,
                PhotoAId = photo1.Id,
                PhotoBId = photo2.Id,
                WinnerPhotoId = photo1.Id
            };

            var result = await _service.SubmitComparisonAsync(voter, request);

            result.Should().NotBeNull();
            result!.Recorded.Should().BeTrue();

            var comparison = await _context.PhotoComparisons.FirstOrDefaultAsync();
            comparison.Should().NotBeNull();
            comparison!.WinnerPhotoId.Should().Be(photo1.Id);
        }

        [Fact]
        public async Task SubmitComparisonAsync_ShouldUpdateEloScores()
        {
            var voter = new User { Id = 1, Username = "Voter", Email = "voter@test.com", PasswordHash = "hash" };
            var uploader1 = new User { Id = 2, Username = "Up1", Email = "up1@test.com", PasswordHash = "hash" };
            var uploader2 = new User { Id = 3, Username = "Up2", Email = "up2@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(voter, uploader1, uploader2);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = uploader1.Id,
                MemberIds = new List<int> { voter.Id, uploader1.Id, uploader2.Id },
                EndsAt = DateTime.UtcNow.AddHours(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            _context.Events.Add(eventObj);

            var photo1 = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = uploader1.Id, FileName = "a.jpg", FilePath = "/a", ContentType = "image/jpeg" };
            var photo2 = new Photo { Id = 2, EventId = eventObj.Id, UploadedById = uploader2.Id, FileName = "b.jpg", FilePath = "/b", ContentType = "image/jpeg" };
            _context.Photos.AddRange(photo1, photo2);
            await _context.SaveChangesAsync();

            var request = new SubmitComparisonRequest
            {
                EventId = eventObj.Id,
                Category = RankingCategory.BestMoment,
                PhotoAId = photo1.Id,
                PhotoBId = photo2.Id,
                WinnerPhotoId = photo1.Id
            };

            await _service.SubmitComparisonAsync(voter, request);

            var ratingA = await _service.GetPhotoRatingAsync(photo1.Id, eventObj.Id, RankingCategory.BestMoment);
            var ratingB = await _service.GetPhotoRatingAsync(photo2.Id, eventObj.Id, RankingCategory.BestMoment);

            ratingA!.EloScore.Should().BeGreaterThan(1500); // Winner gains
            ratingB!.EloScore.Should().BeLessThan(1500); // Loser loses
            ratingA.WinCount.Should().Be(1);
            ratingB.WinCount.Should().Be(0);
        }

        [Fact]
        public async Task SubmitComparisonAsync_ShouldReturnNull_WhenEventNotInRankingPhase()
        {
            var voter = new User { Id = 1, Username = "Voter", Email = "voter@test.com", PasswordHash = "hash" };
            _context.Users.Add(voter);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = 99,
                MemberIds = new List<int> { voter.Id },
                EndsAt = DateTime.UtcNow.AddHours(1), // Still active, not in ranking phase
                CreatedAt = DateTime.UtcNow.AddMinutes(-30)
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new SubmitComparisonRequest
            {
                EventId = eventObj.Id,
                Category = RankingCategory.BestMoment,
                PhotoAId = 1,
                PhotoBId = 2,
                WinnerPhotoId = 1
            };

            var result = await _service.SubmitComparisonAsync(voter, request);

            result.Should().BeNull();
        }

        #endregion

        #region SkipComparisonAsync Tests

        [Fact]
        public async Task SkipComparisonAsync_ShouldRecordSkip_WhenValid()
        {
            var voter = new User { Id = 1, Username = "Voter", Email = "voter@test.com", PasswordHash = "hash" };
            var uploader1 = new User { Id = 2, Username = "Up1", Email = "up1@test.com", PasswordHash = "hash" };
            var uploader2 = new User { Id = 3, Username = "Up2", Email = "up2@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(voter, uploader1, uploader2);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = uploader1.Id,
                MemberIds = new List<int> { voter.Id, uploader1.Id, uploader2.Id },
                EndsAt = DateTime.UtcNow.AddHours(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            _context.Events.Add(eventObj);

            var photo1 = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = uploader1.Id, FileName = "a.jpg", FilePath = "/a", ContentType = "image/jpeg" };
            var photo2 = new Photo { Id = 2, EventId = eventObj.Id, UploadedById = uploader2.Id, FileName = "b.jpg", FilePath = "/b", ContentType = "image/jpeg" };
            _context.Photos.AddRange(photo1, photo2);
            await _context.SaveChangesAsync();

            var request = new SkipComparisonRequest
            {
                EventId = eventObj.Id,
                Category = RankingCategory.BestMoment,
                PhotoAId = photo1.Id,
                PhotoBId = photo2.Id
            };

            var result = await _service.SkipComparisonAsync(voter, request);

            result.Should().NotBeNull();
            result!.Recorded.Should().BeTrue();

            var comparison = await _context.PhotoComparisons.FirstOrDefaultAsync();
            comparison.Should().NotBeNull();
            comparison!.WasSkipped.Should().BeTrue();
            comparison.WinnerPhotoId.Should().BeNull();
        }

        [Fact]
        public async Task SkipComparisonAsync_ShouldNotChangeEloScores()
        {
            var voter = new User { Id = 1, Username = "Voter", Email = "voter@test.com", PasswordHash = "hash" };
            var uploader1 = new User { Id = 2, Username = "Up1", Email = "up1@test.com", PasswordHash = "hash" };
            var uploader2 = new User { Id = 3, Username = "Up2", Email = "up2@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(voter, uploader1, uploader2);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = uploader1.Id,
                MemberIds = new List<int> { voter.Id, uploader1.Id, uploader2.Id },
                EndsAt = DateTime.UtcNow.AddHours(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            _context.Events.Add(eventObj);

            var photo1 = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = uploader1.Id, FileName = "a.jpg", FilePath = "/a", ContentType = "image/jpeg" };
            var photo2 = new Photo { Id = 2, EventId = eventObj.Id, UploadedById = uploader2.Id, FileName = "b.jpg", FilePath = "/b", ContentType = "image/jpeg" };
            _context.Photos.AddRange(photo1, photo2);

            // Pre-create ratings
            await _context.SaveChangesAsync();
            await _service.InitializePhotoRatingsAsync(photo1.Id, eventObj.Id);
            await _service.InitializePhotoRatingsAsync(photo2.Id, eventObj.Id);

            var request = new SkipComparisonRequest
            {
                EventId = eventObj.Id,
                Category = RankingCategory.BestMoment,
                PhotoAId = photo1.Id,
                PhotoBId = photo2.Id
            };

            await _service.SkipComparisonAsync(voter, request);

            var ratingA = await _service.GetPhotoRatingAsync(photo1.Id, eventObj.Id, RankingCategory.BestMoment);
            var ratingB = await _service.GetPhotoRatingAsync(photo2.Id, eventObj.Id, RankingCategory.BestMoment);

            ratingA!.EloScore.Should().Be(1500); // Unchanged
            ratingB!.EloScore.Should().Be(1500); // Unchanged
        }

        #endregion

        #region GetRankingsAsync Tests

        [Fact]
        public async Task GetRankingsAsync_ShouldReturnOrderedByElo()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = user.Id,
                MemberIds = new List<int> { user.Id },
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);

            var photo1 = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = user.Id, FileName = "a.jpg", FilePath = "/a", ContentType = "image/jpeg" };
            var photo2 = new Photo { Id = 2, EventId = eventObj.Id, UploadedById = user.Id, FileName = "b.jpg", FilePath = "/b", ContentType = "image/jpeg" };
            var photo3 = new Photo { Id = 3, EventId = eventObj.Id, UploadedById = user.Id, FileName = "c.jpg", FilePath = "/c", ContentType = "image/jpeg" };
            _context.Photos.AddRange(photo1, photo2, photo3);

            _context.PhotoRatings.AddRange(
                new PhotoRating { PhotoId = 1, EventId = 1, Category = RankingCategory.BestMoment, EloScore = 1400, Photo = photo1 },
                new PhotoRating { PhotoId = 2, EventId = 1, Category = RankingCategory.BestMoment, EloScore = 1600, Photo = photo2 },
                new PhotoRating { PhotoId = 3, EventId = 1, Category = RankingCategory.BestMoment, EloScore = 1500, Photo = photo3 }
            );
            await _context.SaveChangesAsync();

            var request = new GetRankingsRequest
            {
                EventId = eventObj.Id,
                Category = RankingCategory.BestMoment,
                TopN = 10
            };

            var result = await _service.GetRankingsAsync(user, request);

            result.Should().NotBeNull();
            result!.Rankings.Should().HaveCount(3);
            result.Rankings[0].PhotoId.Should().Be(2); // Highest Elo
            result.Rankings[1].PhotoId.Should().Be(3);
            result.Rankings[2].PhotoId.Should().Be(1); // Lowest Elo
        }

        [Fact]
        public async Task GetRankingsAsync_ShouldReturnNull_WhenUserNotMember()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = 99,
                MemberIds = new List<int>(), // User not a member
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new GetRankingsRequest { EventId = eventObj.Id, Category = RankingCategory.BestMoment, TopN = 10 };

            var result = await _service.GetRankingsAsync(user, request);

            result.Should().BeNull();
        }

        #endregion

        #region GetNextMatchupAsync Tests

        [Fact]
        public async Task GetNextMatchupAsync_ShouldReturnNull_WhenUserNotMember()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = 99,
                MemberIds = new List<int>(),
                EndsAt = DateTime.UtcNow.AddHours(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new GetNextMatchupRequest { EventId = eventObj.Id };

            var result = await _service.GetNextMatchupAsync(user, request);

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetNextMatchupAsync_ShouldReturnNull_WhenEventNotInRankingPhase()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = user.Id,
                MemberIds = new List<int> { user.Id },
                EndsAt = DateTime.UtcNow.AddHours(1), // Still active
                CreatedAt = DateTime.UtcNow.AddMinutes(-30)
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new GetNextMatchupRequest { EventId = eventObj.Id };

            var result = await _service.GetNextMatchupAsync(user, request);

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetNextMatchupAsync_ShouldReturnMatchup_WhenValid()
        {
            var voter = new User { Id = 1, Username = "Voter", Email = "voter@test.com", PasswordHash = "hash" };
            var uploader1 = new User { Id = 2, Username = "Up1", Email = "up1@test.com", PasswordHash = "hash" };
            var uploader2 = new User { Id = 3, Username = "Up2", Email = "up2@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(voter, uploader1, uploader2);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = uploader1.Id,
                MemberIds = new List<int> { voter.Id, uploader1.Id, uploader2.Id },
                EndsAt = DateTime.UtcNow.AddHours(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            _context.Events.Add(eventObj);

            var photo1 = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = uploader1.Id, FileName = "a.jpg", FilePath = "/a", ContentType = "image/jpeg" };
            var photo2 = new Photo { Id = 2, EventId = eventObj.Id, UploadedById = uploader2.Id, FileName = "b.jpg", FilePath = "/b", ContentType = "image/jpeg" };
            _context.Photos.AddRange(photo1, photo2);
            await _context.SaveChangesAsync();

            var request = new GetNextMatchupRequest { EventId = eventObj.Id };

            var result = await _service.GetNextMatchupAsync(voter, request);

            result.Should().NotBeNull();
            result!.PhotoA.Should().NotBeNull();
            result.PhotoB.Should().NotBeNull();
            result.Prompt.Should().NotBeNullOrEmpty();
        }

        #endregion

        #region GetComparisonHistoryAsync Tests

        [Fact]
        public async Task GetComparisonHistoryAsync_ShouldReturnUserHistory()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            var otherUser = new User { Id = 2, Username = "Other", Email = "other@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(user, otherUser);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = user.Id,
                MemberIds = new List<int> { user.Id, otherUser.Id },
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);

            var photo1 = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = user.Id, FileName = "a.jpg", FilePath = "/a", ContentType = "image/jpeg" };
            var photo2 = new Photo { Id = 2, EventId = eventObj.Id, UploadedById = user.Id, FileName = "b.jpg", FilePath = "/b", ContentType = "image/jpeg" };
            _context.Photos.AddRange(photo1, photo2);

            _context.PhotoComparisons.AddRange(
                new PhotoComparison { EventId = 1, Category = RankingCategory.BestMoment, PhotoAId = 1, PhotoBId = 2, VoterId = user.Id, PhotoA = photo1, PhotoB = photo2 },
                new PhotoComparison { EventId = 1, Category = RankingCategory.BestMoment, PhotoAId = 1, PhotoBId = 2, VoterId = otherUser.Id, PhotoA = photo1, PhotoB = photo2 }
            );
            await _context.SaveChangesAsync();

            var request = new GetComparisonHistoryRequest { EventId = eventObj.Id, PageNumber = 1, PageSize = 10 };

            var result = await _service.GetComparisonHistoryAsync(user, request);

            result.Should().NotBeNull();
            result!.Items.Should().HaveCount(1); // Only user's comparisons
        }

        [Fact]
        public async Task GetComparisonHistoryAsync_ShouldReturnNull_WhenUserNotMember()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = 99,
                MemberIds = new List<int>(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new GetComparisonHistoryRequest { EventId = eventObj.Id, PageNumber = 1, PageSize = 10 };

            var result = await _service.GetComparisonHistoryAsync(user, request);

            result.Should().BeNull();
        }

        #endregion

        #region GetPhotoRankingStatsAsync Tests

        [Fact]
        public async Task GetPhotoRankingStatsAsync_ShouldReturnStats()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Test",
                OwnerId = user.Id,
                MemberIds = new List<int> { user.Id },
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);

            var photo = new Photo { Id = 1, EventId = eventObj.Id, UploadedById = user.Id, FileName = "a.jpg", FilePath = "/a", ContentType = "image/jpeg" };
            _context.Photos.Add(photo);

            _context.PhotoRatings.Add(new PhotoRating
            {
                PhotoId = photo.Id,
                EventId = eventObj.Id,
                Category = RankingCategory.BestMoment,
                EloScore = 1550,
                ComparisonCount = 5,
                WinCount = 3
            });
            await _context.SaveChangesAsync();

            var request = new GetPhotoRankingStatsRequest { PhotoId = photo.Id, EventId = eventObj.Id };

            var result = await _service.GetPhotoRankingStatsAsync(user, request);

            result.Should().NotBeNull();
            result!.PhotoId.Should().Be(photo.Id);
            result.CategoryStats.Should().ContainSingle(s => s.Category == RankingCategory.BestMoment);
        }

        [Fact]
        public async Task GetPhotoRankingStatsAsync_ShouldReturnNull_WhenPhotoNotFound()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event { Id = 1, Name = "Test", OwnerId = user.Id, MemberIds = new List<int> { user.Id }, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new GetPhotoRankingStatsRequest { PhotoId = 999, EventId = eventObj.Id };

            var result = await _service.GetPhotoRankingStatsAsync(user, request);

            result.Should().BeNull();
        }

        #endregion
    }
}
