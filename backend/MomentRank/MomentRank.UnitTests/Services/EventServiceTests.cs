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

        #region CreateEventAsync Tests

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
            result.MemberIds.Should().Contain(user.Id);

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
        public async Task CreateEventAsync_ShouldReturnNull_WhenEndsAtInPast()
        {
            var user = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var request = new CreateEventRequest
            {
                Name = "Past Event",
                EndsAt = DateTime.UtcNow.AddHours(-1), // In the past
                Public = true
            };

            var result = await _service.CreateEventAsync(user, request);

            result.Should().BeNull();
        }

        #endregion

        #region JoinEventAsync Tests

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
        public async Task JoinEventAsync_ShouldReturnNull_WhenAlreadyMember()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var user = new User { Id = 2, Username = "Member", Email = "member@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, user);

            var eventObj = new Event
            {
                Name = "Test Event",
                OwnerId = owner.Id,
                MemberIds = new List<int> { user.Id },
                EndsAt = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow,
                Public = true
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new JoinEventRequest { Id = eventObj.Id };

            var result = await _service.JoinEventAsync(user, request);

            result.Should().BeNull();
        }

        #endregion

        #region ListEventsAsync Tests

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

        #endregion

        #region DeleteEventAsync Tests

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
        public async Task DeleteEventAsync_ShouldReturnNull_WhenNotOwner()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var user = new User { Id = 2, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, user);

            var eventObj = new Event
            {
                Name = "Event",
                OwnerId = owner.Id,
                CreatedAt = DateTime.UtcNow,
                Public = true
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new DeleteEventRequest { Id = eventObj.Id };

            var result = await _service.DeleteEventAsync(user, request);

            result.Should().BeNull();
        }

        #endregion

        #region ReadEventAsync Tests

        [Fact]
        public async Task ReadEventAsync_ShouldReturnEvent_WhenMember()
        {
            var user = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);

            var eventObj = new Event
            {
                Name = "To Read",
                OwnerId = user.Id,
                MemberIds = new List<int> { user.Id },
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

        [Fact]
        public async Task ReadEventAsync_ShouldReturnNull_WhenNotMember()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var user = new User { Id = 2, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, user);

            var eventObj = new Event
            {
                Name = "Private",
                OwnerId = owner.Id,
                MemberIds = new List<int> { owner.Id },
                CreatedAt = DateTime.UtcNow,
                Public = false
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new ReadEventRequest { Id = eventObj.Id };

            var result = await _service.ReadEventAsync(user, request);

            result.Should().BeNull();
        }

        #endregion

        #region InviteToEventAsync Tests

        [Fact]
        public async Task InviteToEventAsync_ShouldCreateInvite_WhenValid()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var invitee = new User { Id = 2, Username = "Invitee", Email = "invitee@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, invitee);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = owner.Id,
                MemberIds = new List<int> { owner.Id },
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new InviteToEventRequest { EventId = eventObj.Id, InviteeId = invitee.Id };

            var result = await _service.InviteToEventAsync(owner, request);

            result.Should().NotBeNull();
            result!.Status.Should().Be(EventInviteStatus.Pending);
            result.InviteeId.Should().Be(invitee.Id);
        }

        [Fact]
        public async Task InviteToEventAsync_ShouldReturnNull_WhenNotMember()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var invitee = new User { Id = 2, Username = "Invitee", Email = "invitee@test.com", PasswordHash = "hash" };
            var stranger = new User { Id = 3, Username = "Stranger", Email = "stranger@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, invitee, stranger);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = owner.Id,
                MemberIds = new List<int> { owner.Id },
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new InviteToEventRequest { EventId = eventObj.Id, InviteeId = invitee.Id };

            var result = await _service.InviteToEventAsync(stranger, request);

            result.Should().BeNull();
        }

        [Fact]
        public async Task InviteToEventAsync_ShouldReturnNull_WhenInviteeSelf()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(owner);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = owner.Id,
                MemberIds = new List<int> { owner.Id },
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new InviteToEventRequest { EventId = eventObj.Id, InviteeId = owner.Id };

            var result = await _service.InviteToEventAsync(owner, request);

            result.Should().BeNull();
        }

        #endregion

        #region RespondToEventInviteAsync Tests

        [Fact]
        public async Task RespondToEventInviteAsync_ShouldAccept_WhenValid()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var invitee = new User { Id = 2, Username = "Invitee", Email = "invitee@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, invitee);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = owner.Id,
                MemberIds = new List<int> { owner.Id },
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);

            var invite = new EventInvite
            {
                Id = 1,
                EventId = eventObj.Id,
                SenderId = owner.Id,
                InviteeId = invitee.Id,
                Status = EventInviteStatus.Pending,
                Event = eventObj
            };
            _context.EventInvites.Add(invite);
            await _context.SaveChangesAsync();

            var request = new RespondToEventInviteRequest { InviteId = invite.Id, Accept = true };

            var result = await _service.RespondToEventInviteAsync(invitee, request);

            result.Should().NotBeNull();
            result!.Status.Should().Be(EventInviteStatus.Accepted);
        }

        [Fact]
        public async Task RespondToEventInviteAsync_ShouldDecline_WhenValid()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var invitee = new User { Id = 2, Username = "Invitee", Email = "invitee@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, invitee);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = owner.Id,
                MemberIds = new List<int> { owner.Id },
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);

            var invite = new EventInvite
            {
                Id = 1,
                EventId = eventObj.Id,
                SenderId = owner.Id,
                InviteeId = invitee.Id,
                Status = EventInviteStatus.Pending,
                Event = eventObj
            };
            _context.EventInvites.Add(invite);
            await _context.SaveChangesAsync();

            var request = new RespondToEventInviteRequest { InviteId = invite.Id, Accept = false };

            var result = await _service.RespondToEventInviteAsync(invitee, request);

            result.Should().NotBeNull();
            result!.Status.Should().Be(EventInviteStatus.Declined);
        }

        #endregion

        #region CancelEventInviteAsync Tests

        [Fact]
        public async Task CancelEventInviteAsync_ShouldCancel_WhenSender()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var invitee = new User { Id = 2, Username = "Invitee", Email = "invitee@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, invitee);

            var eventObj = new Event { Id = 1, Name = "Event", OwnerId = owner.Id, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);

            var invite = new EventInvite
            {
                Id = 1,
                EventId = eventObj.Id,
                SenderId = owner.Id,
                InviteeId = invitee.Id,
                Status = EventInviteStatus.Pending
            };
            _context.EventInvites.Add(invite);
            await _context.SaveChangesAsync();

            var request = new CancelEventInviteRequest { InviteId = invite.Id };

            var result = await _service.CancelEventInviteAsync(owner, request);

            result.Should().NotBeNull();
            result!.Status.Should().Be(EventInviteStatus.Cancelled);
        }

        [Fact]
        public async Task CancelEventInviteAsync_ShouldReturnNull_WhenNotSender()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var invitee = new User { Id = 2, Username = "Invitee", Email = "invitee@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, invitee);

            var eventObj = new Event { Id = 1, Name = "Event", OwnerId = owner.Id, CreatedAt = DateTime.UtcNow };
            _context.Events.Add(eventObj);

            var invite = new EventInvite
            {
                Id = 1,
                EventId = eventObj.Id,
                SenderId = owner.Id,
                InviteeId = invitee.Id,
                Status = EventInviteStatus.Pending
            };
            _context.EventInvites.Add(invite);
            await _context.SaveChangesAsync();

            var request = new CancelEventInviteRequest { InviteId = invite.Id };

            var result = await _service.CancelEventInviteAsync(invitee, request); // Invitee tries to cancel

            result.Should().BeNull();
        }

        #endregion

        #region UpdateEventAsync Tests

        [Fact]
        public async Task UpdateEventAsync_ShouldUpdateName_WhenOwner()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(owner);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Original Name",
                OwnerId = owner.Id,
                EndsAt = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new UpdateEventRequest { Id = eventObj.Id, Name = "Updated Name" };

            var result = await _service.UpdateEventAsync(owner, request);

            result.Should().NotBeNull();
            result!.Name.Should().Be("Updated Name");
        }

        [Fact]
        public async Task UpdateEventAsync_ShouldReturnNull_WhenNotOwner()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var user = new User { Id = 2, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = owner.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new UpdateEventRequest { Id = eventObj.Id, Name = "Hacked" };

            var result = await _service.UpdateEventAsync(user, request);

            result.Should().BeNull();
        }

        [Fact]
        public async Task UpdateEventAsync_ShouldArchive_WhenRequested()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(owner);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = owner.Id,
                EndsAt = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new UpdateEventRequest { Id = eventObj.Id, IsArchived = true };

            var result = await _service.UpdateEventAsync(owner, request);

            result.Should().NotBeNull();
            result!.Status.Should().Be(EventStatus.Archived);
        }

        #endregion

        #region JoinEventViaInviteCodeAsync Tests

        [Fact]
        public async Task JoinEventViaInviteCodeAsync_ShouldAddMember_WhenValid()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var user = new User { Id = 2, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = owner.Id,
                MemberIds = new List<int> { owner.Id },
                InviteCode = "ABC12345",
                EndsAt = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var result = await _service.JoinEventViaInviteCodeAsync(user, "ABC12345");

            result.Should().NotBeNull();
            result!.MemberIds.Should().Contain(user.Id);
        }

        [Fact]
        public async Task JoinEventViaInviteCodeAsync_ShouldReturnNull_WhenCodeInvalid()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = await _service.JoinEventViaInviteCodeAsync(user, "INVALID");

            result.Should().BeNull();
        }

        [Fact]
        public async Task JoinEventViaInviteCodeAsync_ShouldReturnNull_WhenEventEnded()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var user = new User { Id = 2, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Ended Event",
                OwnerId = owner.Id,
                MemberIds = new List<int> { owner.Id },
                InviteCode = "ABC12345",
                EndsAt = DateTime.UtcNow.AddHours(-1), // Already ended
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var result = await _service.JoinEventViaInviteCodeAsync(user, "ABC12345");

            result.Should().BeNull();
        }

        #endregion

        #region UpdateEventCoverPhotoAsync Tests

        [Fact]
        public async Task UpdateEventCoverPhotoAsync_ShouldUpdate_WhenOwner()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            _context.Users.Add(owner);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = owner.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new UpdateEventCoverPhotoRequest { EventId = eventObj.Id, FilePath = "/uploads/cover.jpg" };

            var result = await _service.UpdateEventCoverPhotoAsync(owner, request);

            result.Should().NotBeNull();
            result!.CoverPhoto.Should().Be("/uploads/cover.jpg");
        }

        [Fact]
        public async Task UpdateEventCoverPhotoAsync_ShouldReturnNull_WhenNotOwner()
        {
            var owner = new User { Id = 1, Username = "Owner", Email = "owner@test.com", PasswordHash = "hash" };
            var user = new User { Id = 2, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(owner, user);

            var eventObj = new Event
            {
                Id = 1,
                Name = "Event",
                OwnerId = owner.Id,
                CreatedAt = DateTime.UtcNow
            };
            _context.Events.Add(eventObj);
            await _context.SaveChangesAsync();

            var request = new UpdateEventCoverPhotoRequest { EventId = eventObj.Id, FilePath = "/uploads/hacked.jpg" };

            var result = await _service.UpdateEventCoverPhotoAsync(user, request);

            result.Should().BeNull();
        }

        #endregion
    }
}
