using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using MomentRank.Services;
using Moq;
using Xunit;

namespace MomentRank.UnitTests.Services
{
    public class PhotoServiceTests
    {
        private readonly ApplicationDbContext _context;
        private readonly Mock<IWebHostEnvironment> _mockEnvironment;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly PhotoService _service;
        private readonly string _tempPath;

        public PhotoServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _mockEnvironment = new Mock<IWebHostEnvironment>();
            _mockConfiguration = new Mock<IConfiguration>();

            // Setup temp directory for file uploads
            _tempPath = Path.Combine(Path.GetTempPath(), "MomentRankTests_" + Guid.NewGuid());
            Directory.CreateDirectory(_tempPath);
            _mockEnvironment.Setup(m => m.WebRootPath).Returns(_tempPath);

            _service = new PhotoService(_context, _mockEnvironment.Object, _mockConfiguration.Object);
        }

        [Fact]
        public async Task UploadPhotoBase64Async_ShouldUploadPhoto_WhenValid()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = user.Id,
                Public = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            // Small 1x1 white pixel JPEG base64
            var base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
            
            var request = new Base64UploadRequest
            {
                EventId = eventObj.Id,
                FileData = base64,
                FileName = "test.png",
                ContentType = "image/png",
                Caption = "Test Caption"
            };

            var result = await _service.UploadEventPhotoBase64Async(user, request);

            result.Should().NotBeNull();
            result!.FileName.Should().Be("test.png");
            result.Caption.Should().Be("Test Caption");
            
            var photoInDb = await _context.Photos.FirstOrDefaultAsync();
            photoInDb.Should().NotBeNull();
            
            // Verify file exists
            var filePath = Path.Combine(_tempPath, photoInDb!.FilePath.Replace("/", "\\"));
            File.Exists(filePath).Should().BeTrue();
        }

        [Fact]
        public async Task UploadPhotoBase64Async_ShouldReturnNull_WhenUserNotMember()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var user = new User { Id = 2, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Private Event",
                OwnerId = owner.Id,
                Public = false,
                MemberIds = new List<int>(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new Base64UploadRequest
            {
                EventId = eventObj.Id,
                FileData = "base64data",
                FileName = "test.png",
                ContentType = "image/png"
            };

            var result = await _service.UploadEventPhotoBase64Async(user, request);

            result.Should().BeNull();
        }

        [Fact]
        public async Task DeletePhotoAsync_ShouldDeletePhoto_WhenOwner()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event { Id = 1, Name = "Event", OwnerId = user.Id, Public = true, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);

            var photo = new Photo
            {
                Id = 1,
                EventId = eventObj.Id,
                UploadedById = user.Id,
                FileName = "test.png",
                FilePath = "uploads/photos/test.png",
                ContentType = "image/png",
                UploadedAt = DateTime.UtcNow
            };
            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();

            // Create dummy file
            var fullPath = Path.Combine(_tempPath, "uploads", "photos");
            Directory.CreateDirectory(fullPath);
            File.WriteAllText(Path.Combine(fullPath, "test.png"), "dummy content");

            var result = await _service.DeletePhotoAsync(user, photo.Id);

            result.Should().BeTrue();
            var photoInDb = await _context.Photos.FindAsync(photo.Id);
            photoInDb.Should().BeNull();
        }

        [Fact]
        public async Task ListPhotosAsync_ShouldReturnPhotos()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event { Id = 1, Name = "Event", OwnerId = user.Id, Public = true, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);

            var photo = new Photo
            {
                EventId = eventObj.Id,
                UploadedById = user.Id,
                FileName = "test.png",
                FilePath = "path",
                ContentType = "image/png",
                UploadedAt = DateTime.UtcNow
            };
            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();

            var result = await _service.ListPhotosAsync(eventObj.Id);

            result.Should().NotBeNull();
            result.Should().HaveCount(1);
        }
    }
}
