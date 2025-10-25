using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public interface IFriendService
    {
        Task<FriendRequestResponse?> SendFriendRequestAsync(User sender, int receiverId);
        Task<FriendRequestResponse?> RespondToFriendRequestAsync(User user, int requestId, bool accept);
        Task<bool> CancelFriendRequestAsync(User user, int requestId);
        Task<bool> RemoveFriendAsync(User user, int friendId);
        Task<List<FriendRequestResponse>> GetPendingReceivedRequestsAsync(User user);
        Task<List<FriendRequestResponse>> GetPendingSentRequestsAsync(User user);
        Task<List<FriendResponse>> GetFriendsAsync(User user);
        Task<bool> AreFriendsAsync(int userId1, int userId2);
        Task<FriendRequestResponse?> GetFriendRequestStatusAsync(User user, int otherUserId);
    }
}
