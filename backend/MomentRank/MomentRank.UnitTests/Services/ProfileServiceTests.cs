using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using MomentRank.Services;
using Xunit;

namespace MomentRank.UnitTests.Services
{
    public class ProfileServiceTests
    {
        private readonly ApplicationDbContext _context;
        private readonly ProfileService _service;

        public ProfileServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _service = new ProfileService(_context);
        }

        #region CreateProfileAsync Tests

        [Fact]
        public async Task CreateProfileAsync_ShouldUpdateUser_WhenValid()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash", CreatedAt = DateTime.UtcNow };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new CreateProfileRequest
            {
                Name = "New Name",
                Bio = "New Bio"
            };

            var result = await _service.CreateProfileAsync(user, request);

            result.Should().NotBeNull();
            result!.Name.Should().Be(request.Name);
            result.Bio.Should().Be(request.Bio);

            var userInDb = await _context.Users.FindAsync(user.Id);
            userInDb!.Name.Should().Be(request.Name);
            userInDb.Bio.Should().Be(request.Bio);
        }

        [Fact]
        public async Task CreateProfileAsync_ShouldHandleEmptyBio()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new CreateProfileRequest
            {
                Name = "Name Only",
                Bio = "" // Empty string instead of null
            };

            var result = await _service.CreateProfileAsync(user, request);

            result.Should().NotBeNull();
            result!.Name.Should().Be("Name Only");
        }

        #endregion

        #region UpdateProfileAsync Tests

        [Fact]
        public async Task UpdateProfileAsync_ShouldUpdateFields_WhenProvided()
        {
            var user = new User { Id = 1, Username = "User", Name = "Old Name", Bio = "Old Bio", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new UpdateProfileRequest
            {
                Name = "Updated Name",
                Bio = null // Should not update
            };

            var result = await _service.UpdateProfileAsync(user, request);

            result.Should().NotBeNull();
            result!.Name.Should().Be("Updated Name");
            result.Bio.Should().Be("Old Bio");

            var userInDb = await _context.Users.FindAsync(user.Id);
            userInDb!.Name.Should().Be("Updated Name");
            userInDb.Bio.Should().Be("Old Bio");
        }

        [Fact]
        public async Task UpdateProfileAsync_ShouldUpdateBoth_WhenBothProvided()
        {
            var user = new User { Id = 1, Username = "User", Name = "Old Name", Bio = "Old Bio", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new UpdateProfileRequest
            {
                Name = "New Name",
                Bio = "New Bio"
            };

            var result = await _service.UpdateProfileAsync(user, request);

            result.Should().NotBeNull();
            result!.Name.Should().Be("New Name");
            result.Bio.Should().Be("New Bio");
        }

        #endregion

        #region GetProfileAsync Tests

        [Fact]
        public async Task GetProfileAsync_ShouldReturnProfile()
        {
            var user = new User { Id = 1, Username = "User", Name = "Name", Bio = "Bio", Email = "user@test.com", PasswordHash = "hash" };

            var result = await _service.GetProfileAsync(user);

            result.Should().NotBeNull();
            result!.Username.Should().Be(user.Username);
            result.Name.Should().Be(user.Name);
        }

        #endregion

        #region GetProfileByUsernameAsync Tests

        [Fact]
        public async Task GetProfileByUsernameAsync_ShouldReturnProfile_WhenUserExists()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            var target = new User { Id = 2, Username = "Target", Name = "Target Name", Email = "target@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(user, target);
            await _context.SaveChangesAsync();

            var result = await _service.GetProfileByUsernameAsync(user, "Target");

            result.Should().NotBeNull();
            result!.Username.Should().Be(target.Username);
        }

        [Fact]
        public async Task GetProfileByUsernameAsync_ShouldReturnNull_WhenUserDoesNotExist()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = await _service.GetProfileByUsernameAsync(user, "NonExistent");

            result.Should().BeNull();
        }

        [Fact]
        public async Task GetProfileByUsernameAsync_ShouldHandleExactMatch()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            var target = new User { Id = 2, Username = "TargetUser", Name = "Target", Email = "target@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(user, target);
            await _context.SaveChangesAsync();

            var result = await _service.GetProfileByUsernameAsync(user, "TargetUser"); // exact match

            result.Should().NotBeNull();
            result!.Username.Should().Be("TargetUser");
        }

        #endregion

        #region GetProfileByIdAsync Tests

        [Fact]
        public async Task GetProfileByIdAsync_ShouldReturnProfile_WhenExists()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            var target = new User { Id = 2, Username = "Target", Name = "Target Name", Email = "target@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(user, target);
            await _context.SaveChangesAsync();

            var result = await _service.GetProfileByIdAsync(user, target.Id);

            result.Should().NotBeNull();
            result!.Id.Should().Be(target.Id);
            result.Username.Should().Be(target.Username);
        }

        [Fact]
        public async Task GetProfileByIdAsync_ShouldReturnNull_WhenNotExists()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = await _service.GetProfileByIdAsync(user, 999);

            result.Should().BeNull();
        }

        #endregion

        #region SearchProfilesAsync Tests

        [Fact]
        public async Task SearchProfilesAsync_ShouldReturnMatches()
        {
            var user1 = new User { Id = 1, Username = "Alpha", Name = "Alpha User", Email = "a@test.com", PasswordHash = "hash" };
            var user2 = new User { Id = 2, Username = "Beta", Name = "Beta User", Email = "b@test.com", PasswordHash = "hash" };
            var user3 = new User { Id = 3, Username = "Alpaca", Name = "Alpaca User", Email = "c@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(user1, user2, user3);
            await _context.SaveChangesAsync();

            var result = await _service.SearchProfilesAsync("alp");

            result.Should().HaveCount(2); // Alpha and Alpaca
            result.Should().Contain(u => u.Username == "Alpha");
            result.Should().Contain(u => u.Username == "Alpaca");
        }

        [Fact]
        public async Task SearchProfilesAsync_ShouldReturnEmpty_WhenNoMatches()
        {
            var user1 = new User { Id = 1, Username = "Alpha", Email = "a@test.com", PasswordHash = "hash" };
            _context.Users.Add(user1);
            await _context.SaveChangesAsync();

            var result = await _service.SearchProfilesAsync("xyz");

            result.Should().BeEmpty();
        }

        [Fact]
        public async Task SearchProfilesAsync_ShouldReturnResults_WhenQueryShort()
        {
            var user1 = new User { Id = 1, Username = "Alpha", Email = "a@test.com", PasswordHash = "hash" };
            _context.Users.Add(user1);
            await _context.SaveChangesAsync();

            var result = await _service.SearchProfilesAsync("al"); // 2 character query

            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task SearchProfilesAsync_ShouldSearchByNameToo()
        {
            var user1 = new User { Id = 1, Username = "User1", Name = "John Smith", Email = "a@test.com", PasswordHash = "hash" };
            var user2 = new User { Id = 2, Username = "User2", Name = "Jane Doe", Email = "b@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(user1, user2);
            await _context.SaveChangesAsync();

            var result = await _service.SearchProfilesAsync("john");

            result.Should().HaveCount(1);
            result[0].Username.Should().Be("User1");
        }

        #endregion
    }
}
