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
        public async Task GetProfileAsync_ShouldReturnProfile()
        {
            var user = new User { Id = 1, Username = "User", Name = "Name", Bio = "Bio", Email = "user@test.com", PasswordHash = "hash" };
            
            var result = await _service.GetProfileAsync(user);

            result.Should().NotBeNull();
            result!.Username.Should().Be(user.Username);
            result.Name.Should().Be(user.Name);
        }

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
    }
}
