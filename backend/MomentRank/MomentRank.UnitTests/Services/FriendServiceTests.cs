using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.Enums;
using MomentRank.Models;
using MomentRank.Services;
using Xunit;

namespace MomentRank.UnitTests.Services
{
    public class FriendServiceTests
    {
        private readonly ApplicationDbContext _context;
        private readonly FriendService _service;

        public FriendServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new ApplicationDbContext(options);
            _service = new FriendService(_context);
        }

        [Fact]
        public async Task SendFriendRequestAsync_ShouldCreateRequest_WhenValid()
        {
            var sender = new User { Id = 1, Username = "Sender", Name = "Sender Name", Email = "sender@test.com", PasswordHash = "hash" };
            var receiver = new User { Id = 2, Username = "Receiver", Name = "Receiver Name", Email = "receiver@test.com", PasswordHash = "hash" };
            
            _context.Users.AddRange(sender, receiver);
            await _context.SaveChangesAsync();

            var result = await _service.SendFriendRequestAsync(sender, receiver.Id);

            result.Should().NotBeNull();
            result!.Status.Should().Be(FriendRequestStatus.Pending);
            
            var requestInDb = await _context.FriendRequests.FirstOrDefaultAsync();
            requestInDb.Should().NotBeNull();
            requestInDb!.SenderId.Should().Be(sender.Id);
            requestInDb.ReceiverId.Should().Be(receiver.Id);
        }

        [Fact]
        public async Task SendFriendRequestAsync_ShouldReturnNull_WhenReceiverDoesNotExist()
        {
            var sender = new User { Id = 1, Username = "Sender", Email = "sender@test.com", PasswordHash = "hash" };
            _context.Users.Add(sender);
            await _context.SaveChangesAsync();

            var result = await _service.SendFriendRequestAsync(sender, 999);

            result.Should().BeNull();
        }

        [Fact]
        public async Task RespondToFriendRequestAsync_ShouldAcceptRequest_WhenValid()
        {
            var sender = new User { Id = 1, Username = "Sender", Email = "sender@test.com", PasswordHash = "hash" };
            var receiver = new User { Id = 2, Username = "Receiver", Email = "receiver@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(sender, receiver);

            var request = new FriendRequest
            {
                SenderId = sender.Id,
                ReceiverId = receiver.Id,
                Status = FriendRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _context.FriendRequests.Add(request);
            await _context.SaveChangesAsync();

            var result = await _service.RespondToFriendRequestAsync(receiver, request.Id, true);

            result.Should().NotBeNull();
            result!.Status.Should().Be(FriendRequestStatus.Accepted);
            
            var requestInDb = await _context.FriendRequests.FindAsync(request.Id);
            requestInDb!.Status.Should().Be(FriendRequestStatus.Accepted);
        }

        [Fact]
        public async Task GetFriendsAsync_ShouldReturnFriendsList()
        {
            var user = new User { Id = 1, Username = "User", Email = "user@test.com", PasswordHash = "hash" };
            var friend = new User { Id = 2, Username = "Friend", Email = "friend@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(user, friend);

            var friendship = new FriendRequest
            {
                SenderId = user.Id,
                ReceiverId = friend.Id,
                Status = FriendRequestStatus.Accepted,
                CreatedAt = DateTime.UtcNow
            };
            _context.FriendRequests.Add(friendship);
            await _context.SaveChangesAsync();

            var result = await _service.GetFriendsAsync(user);

            result.Should().HaveCount(1);
            result[0].UserId.Should().Be(friend.Id);
        }

        [Fact]
        public async Task CancelFriendRequestAsync_ShouldCancel_WhenPending()
        {
            var sender = new User { Id = 1, Username = "Sender", Email = "s@test.com", PasswordHash = "hash" };
            var receiver = new User { Id = 2, Username = "Receiver", Email = "r@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(sender, receiver);

            var request = new FriendRequest
            {
                SenderId = sender.Id,
                ReceiverId = receiver.Id,
                Status = FriendRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _context.FriendRequests.Add(request);
            await _context.SaveChangesAsync();

            var result = await _service.CancelFriendRequestAsync(sender, request.Id);

            result.Should().BeTrue();
            var requestInDb = await _context.FriendRequests.FindAsync(request.Id);
            requestInDb!.Status.Should().Be(FriendRequestStatus.Cancelled);
        }

        [Fact]
        public async Task RemoveFriendAsync_ShouldRemove_WhenFriends()
        {
            var user1 = new User { Id = 1, Username = "User1", Email = "u1@test.com", PasswordHash = "hash" };
            var user2 = new User { Id = 2, Username = "User2", Email = "u2@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(user1, user2);

            var friendship = new FriendRequest
            {
                SenderId = user1.Id,
                ReceiverId = user2.Id,
                Status = FriendRequestStatus.Accepted,
                CreatedAt = DateTime.UtcNow
            };
            _context.FriendRequests.Add(friendship);
            await _context.SaveChangesAsync();

            var result = await _service.RemoveFriendAsync(user1, user2.Id);

            result.Should().BeTrue();
            var friendshipInDb = await _context.FriendRequests.FindAsync(friendship.Id);
            friendshipInDb.Should().BeNull();
        }

        [Fact]
        public async Task GetPendingReceivedRequestsAsync_ShouldReturnRequests()
        {
            var sender = new User { Id = 1, Username = "Sender", Email = "s@test.com", PasswordHash = "hash" };
            var receiver = new User { Id = 2, Username = "Receiver", Email = "r@test.com", PasswordHash = "hash" };
            _context.Users.AddRange(sender, receiver);

            var request = new FriendRequest
            {
                SenderId = sender.Id,
                ReceiverId = receiver.Id,
                Status = FriendRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            _context.FriendRequests.Add(request);
            await _context.SaveChangesAsync();

            var result = await _service.GetPendingReceivedRequestsAsync(receiver);

            result.Should().HaveCount(1);
            result[0].SenderId.Should().Be(sender.Id);
        }
    }
}
