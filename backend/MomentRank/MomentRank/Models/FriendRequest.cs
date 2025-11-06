using MomentRank.Enums;

namespace MomentRank.Models
{
    public class FriendRequest
    {
        public int Id { get; set; }
        
        // The user who sent the request
        public int SenderId { get; set; }
        public User Sender { get; set; } = null!;
        
        // The user who receives the request
        public int ReceiverId { get; set; }
        public User Receiver { get; set; } = null!;
        
        public FriendRequestStatus Status { get; set; } = FriendRequestStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RespondedAt { get; set; }
    }
}
