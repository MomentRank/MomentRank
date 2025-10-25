using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Enums;
using MomentRank.Models;

namespace MomentRank.Services
{
    public class FriendService : IFriendService
    {
        private readonly ApplicationDbContext _context;

        public FriendService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<FriendRequestResponse?> SendFriendRequestAsync(User sender, int receiverId)
        {
            try
            {
                if (sender.Id == receiverId)
                {
                    return null;
                }

                // Check if receiver exists
                var receiver = await _context.Users.FindAsync(receiverId);
                if (receiver == null)
                {
                    return null;
                }

                var existingFriendship = await _context.FriendRequests
                    .Where(fr => fr.Status == FriendRequestStatus.Accepted &&
                                ((fr.SenderId == sender.Id && fr.ReceiverId == receiverId) ||
                                 (fr.SenderId == receiverId && fr.ReceiverId == sender.Id)))
                    .FirstOrDefaultAsync();

                if (existingFriendship != null)
                {
                    return null; // Already friends
                }

                var existingRequest = await _context.FriendRequests
                    .Where(fr => fr.Status == FriendRequestStatus.Pending &&
                                ((fr.SenderId == sender.Id && fr.ReceiverId == receiverId) ||
                                 (fr.SenderId == receiverId && fr.ReceiverId == sender.Id)))
                    .FirstOrDefaultAsync();

                if (existingRequest != null)
                {
                    return null;
                }

                var friendRequest = new FriendRequest
                {
                    SenderId = sender.Id,
                    ReceiverId = receiverId,
                    Status = FriendRequestStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                _context.FriendRequests.Add(friendRequest);
                await _context.SaveChangesAsync();

                return new FriendRequestResponse
                {
                    Id = friendRequest.Id,
                    SenderId = sender.Id,
                    SenderUsername = sender.Username,
                    SenderName = sender.Name,
                    ReceiverId = receiver.Id,
                    ReceiverUsername = receiver.Username,
                    ReceiverName = receiver.Name,
                    Status = friendRequest.Status,
                    CreatedAt = friendRequest.CreatedAt,
                    RespondedAt = friendRequest.RespondedAt
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<FriendRequestResponse?> RespondToFriendRequestAsync(User user, int requestId, bool accept)
        {
            try
            {
                var friendRequest = await _context.FriendRequests
                    .Include(fr => fr.Sender)
                    .Include(fr => fr.Receiver)
                    .FirstOrDefaultAsync(fr => fr.Id == requestId);

                if (friendRequest == null)
                {
                    return null;
                }

                if (friendRequest.ReceiverId != user.Id)
                {
                    return null;
                }

                if (friendRequest.Status != FriendRequestStatus.Pending)
                {
                    return null;
                }

                friendRequest.Status = accept ? FriendRequestStatus.Accepted : FriendRequestStatus.Rejected;
                friendRequest.RespondedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return new FriendRequestResponse
                {
                    Id = friendRequest.Id,
                    SenderId = friendRequest.SenderId,
                    SenderUsername = friendRequest.Sender.Username,
                    SenderName = friendRequest.Sender.Name,
                    ReceiverId = friendRequest.ReceiverId,
                    ReceiverUsername = friendRequest.Receiver.Username,
                    ReceiverName = friendRequest.Receiver.Name,
                    Status = friendRequest.Status,
                    CreatedAt = friendRequest.CreatedAt,
                    RespondedAt = friendRequest.RespondedAt
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<bool> CancelFriendRequestAsync(User user, int requestId)
        {
            try
            {
                var friendRequest = await _context.FriendRequests
                    .FirstOrDefaultAsync(fr => fr.Id == requestId);

                if (friendRequest == null)
                {
                    return false;
                }

                if (friendRequest.SenderId != user.Id)
                {
                    return false;
                }

                if (friendRequest.Status != FriendRequestStatus.Pending)
                {
                    return false;
                }

                friendRequest.Status = FriendRequestStatus.Cancelled;
                friendRequest.RespondedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> RemoveFriendAsync(User user, int friendId)
        {
            try
            {
                var friendship = await _context.FriendRequests
                    .Where(fr => fr.Status == FriendRequestStatus.Accepted &&
                                ((fr.SenderId == user.Id && fr.ReceiverId == friendId) ||
                                 (fr.SenderId == friendId && fr.ReceiverId == user.Id)))
                    .FirstOrDefaultAsync();

                if (friendship == null)
                {
                    return false;
                }

                _context.FriendRequests.Remove(friendship);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<List<FriendRequestResponse>> GetPendingReceivedRequestsAsync(User user)
        {
            try
            {
                var requests = await _context.FriendRequests
                    .Include(fr => fr.Sender)
                    .Include(fr => fr.Receiver)
                    .Where(fr => fr.ReceiverId == user.Id && fr.Status == FriendRequestStatus.Pending)
                    .OrderByDescending(fr => fr.CreatedAt)
                    .Select(fr => new FriendRequestResponse
                    {
                        Id = fr.Id,
                        SenderId = fr.SenderId,
                        SenderUsername = fr.Sender.Username,
                        SenderName = fr.Sender.Name,
                        ReceiverId = fr.ReceiverId,
                        ReceiverUsername = fr.Receiver.Username,
                        ReceiverName = fr.Receiver.Name,
                        Status = fr.Status,
                        CreatedAt = fr.CreatedAt,
                        RespondedAt = fr.RespondedAt
                    })
                    .ToListAsync();

                return requests;
            }
            catch (Exception)
            {
                return new List<FriendRequestResponse>();
            }
        }

        public async Task<List<FriendRequestResponse>> GetPendingSentRequestsAsync(User user)
        {
            try
            {
                var requests = await _context.FriendRequests
                    .Include(fr => fr.Sender)
                    .Include(fr => fr.Receiver)
                    .Where(fr => fr.SenderId == user.Id && fr.Status == FriendRequestStatus.Pending)
                    .OrderByDescending(fr => fr.CreatedAt)
                    .Select(fr => new FriendRequestResponse
                    {
                        Id = fr.Id,
                        SenderId = fr.SenderId,
                        SenderUsername = fr.Sender.Username,
                        SenderName = fr.Sender.Name,
                        ReceiverId = fr.ReceiverId,
                        ReceiverUsername = fr.Receiver.Username,
                        ReceiverName = fr.Receiver.Name,
                        Status = fr.Status,
                        CreatedAt = fr.CreatedAt,
                        RespondedAt = fr.RespondedAt
                    })
                    .ToListAsync();

                return requests;
            }
            catch (Exception)
            {
                return new List<FriendRequestResponse>();
            }
        }

        public async Task<List<FriendResponse>> GetFriendsAsync(User user)
        {
            try
            {
                var friendships = await _context.FriendRequests
                    .Include(fr => fr.Sender)
                    .Include(fr => fr.Receiver)
                    .Where(fr => fr.Status == FriendRequestStatus.Accepted &&
                                (fr.SenderId == user.Id || fr.ReceiverId == user.Id))
                    .ToListAsync();

                var friends = friendships.Select(fr =>
                {
                    var friend = fr.SenderId == user.Id ? fr.Receiver : fr.Sender;
                    return new FriendResponse
                    {
                        UserId = friend.Id,
                        Username = friend.Username,
                        Name = friend.Name,
                        FriendsSince = fr.RespondedAt ?? fr.CreatedAt
                    };
                })
                .OrderBy(f => f.Username)
                .ToList();

                return friends;
            }
            catch (Exception)
            {
                return new List<FriendResponse>();
            }
        }

        public async Task<bool> AreFriendsAsync(int userId1, int userId2)
        {
            try
            {
                var friendship = await _context.FriendRequests
                    .Where(fr => fr.Status == FriendRequestStatus.Accepted &&
                                ((fr.SenderId == userId1 && fr.ReceiverId == userId2) ||
                                 (fr.SenderId == userId2 && fr.ReceiverId == userId1)))
                    .FirstOrDefaultAsync();

                return friendship != null;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<FriendRequestResponse?> GetFriendRequestStatusAsync(User user, int otherUserId)
        {
            try
            {
                var request = await _context.FriendRequests
                    .Include(fr => fr.Sender)
                    .Include(fr => fr.Receiver)
                    .Where(fr => (fr.SenderId == user.Id && fr.ReceiverId == otherUserId) ||
                                (fr.SenderId == otherUserId && fr.ReceiverId == user.Id))
                    .OrderByDescending(fr => fr.CreatedAt)
                    .FirstOrDefaultAsync();

                if (request == null)
                {
                    return null;
                }

                return new FriendRequestResponse
                {
                    Id = request.Id,
                    SenderId = request.SenderId,
                    SenderUsername = request.Sender.Username,
                    SenderName = request.Sender.Name,
                    ReceiverId = request.ReceiverId,
                    ReceiverUsername = request.Receiver.Username,
                    ReceiverName = request.Receiver.Name,
                    Status = request.Status,
                    CreatedAt = request.CreatedAt,
                    RespondedAt = request.RespondedAt
                };
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
