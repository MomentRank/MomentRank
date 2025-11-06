using MomentRank.Enums;

namespace MomentRank.DTOs
{
    public record SendFriendRequestRequest
    {
        public required int ReceiverId { get; init; }
    }

    public record RespondToFriendRequestRequest
    {
        public required int RequestId { get; init; }
        public required bool Accept { get; init; }
    }

    public record FriendRequestResponse
    {
        public int Id { get; init; }
        public int SenderId { get; init; }
        public required string SenderUsername { get; init; }
        public string? SenderName { get; init; }
        public int ReceiverId { get; init; }
        public required string ReceiverUsername { get; init; }
        public string? ReceiverName { get; init; }
        public FriendRequestStatus Status { get; init; }
        public DateTime CreatedAt { get; init; }
        public DateTime? RespondedAt { get; init; }
    }

    public record FriendResponse
    {
        public int UserId { get; init; }
        public required string Username { get; init; }
        public string? Name { get; init; }
        public DateTime FriendsSince { get; init; }
    }
}
