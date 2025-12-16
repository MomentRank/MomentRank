using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using MomentRank.Services;
using Xunit;

namespace MomentRank.UnitTests.Services
{
    public class EventServiceTests
    {
        private readonly ApplicationDbContext _context;
        private readonly EventService _service;

        public EventServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _service = new EventService(_context);
        }

        [Fact]
        public async Task CreateEventAsync_ShouldCreateEvent_WhenValid()
        {
            var user = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new CreateEventRequest
            {
                Name = "Test Event",
                EndsAt = DateTime.UtcNow.AddDays(1),
                Public = true
            };

            var result = await _service.CreateEventAsync(user, request);

            result.Should().NotBeNull();
            result!.Name.Should().Be(request.Name);
            result.OwnerId.Should().Be(user.Id);
            
            var eventInDb = await _context.Events.FirstOrDefaultAsync();
            eventInDb.Should().NotBeNull();
        }

        [Fact]
        public async Task CreateEventAsync_ShouldReturnNull_WhenEventExistsForUser()
        {
            var user = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);
            
            var existingEvent = new Event
            {
                Name = "Test Event",
                OwnerId = user.Id,
                EndsAt = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow,
                Public = true
            };
            _context.Events.Add(existingEvent);
            await _context.SaveChangesAsync();

            var request = new CreateEventRequest
            {
                Name = "Test Event",
                EndsAt = DateTime.UtcNow.AddDays(1),
                Public = true
            };

            var result = await _service.CreateEventAsync(user, request);

            result.Should().BeNull();
        }

        [Fact]
        public async Task JoinEventAsync_ShouldAddMember_WhenValid()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var user = new User { Id = 2, Username = "Joiner", Email = "joiner@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, user);

            var eventObj = new Event
            {
                Name = "Test Event",
                OwnerId = owner.Id,
                EndsAt = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow,
                Public = true,
                MemberIds = new List<int>()
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new JoinEventRequest { Id = eventObj.Id };

            var result = await _service.JoinEventAsync(user, request);

            result.Should().NotBeNull();
            result!.MemberIds.Should().Contain(user.Id);
        }

        [Fact]
        public async Task JoinEventAsync_ShouldReturnNull_WhenUserIsOwner()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(owner);

            var eventObj = new Event
            {
                Name = "Test Event",
                OwnerId = owner.Id,
                EndsAt = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow,
                Public = true,
                MemberIds = new List<int>()
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new JoinEventRequest { Id = eventObj.Id };

            var result = await _service.JoinEventAsync(owner, request);

            result.Should().BeNull();
        }

        [Fact]
        public async Task ListEventsAsync_ShouldReturnPublicEvents()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var publicEvent = new Event
            {
                Name = "Public Event",
                OwnerId = 99,
                Public = true,
                CreatedAt = DateTime.UtcNow
            };
            var privateEvent = new Event
            {
                Name = "Private Event",
                OwnerId = 99,
                Public = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.AddRange(publicEvent, privateEvent);
            await _context.SaveChangesAsync();

            var request = new ListEventsRequest
            {
                PageNumber = 1,
                PageSize = 10,
                includePublic = true
            };

            var result = await _service.ListEventsAsync(user, request);

            result.Should().NotBeNull();
            result!.Items.Should().Contain(e => e.Name == "Public Event");
            result.Items.Should().NotContain(e => e.Name == "Private Event");
        }

        [Fact]
        public async Task DeleteEventAsync_ShouldDelete_WhenOwner()
        {
            var user = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Name = "To Delete",
                OwnerId = user.Id,
                CreatedAt = DateTime.UtcNow,
                Public = true
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new DeleteEventRequest { Id = eventObj.Id };

            var result = await _service.DeleteEventAsync(user, request);

            result.Should().NotBeNull();
            var eventInDb = await _context.Events.FindAsync(eventObj.Id);
            eventInDb.Should().BeNull();
        }

        [Fact]
        public async Task ReadEventAsync_ShouldReturnEvent_WhenExists()
        {
            var user = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Name = "To Read",
                OwnerId = user.Id,
                CreatedAt = DateTime.UtcNow,
                Public = true
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new ReadEventRequest { Id = eventObj.Id };

            var result = await _service.ReadEventAsync(user, request);

            result.Should().NotBeNull();
            result!.Name.Should().Be("To Read");
        }
    }
}
