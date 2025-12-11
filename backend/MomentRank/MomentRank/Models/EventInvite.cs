using MomentRank.Enums;

namespace MomentRank.Models
{
    public class EventInvite
    {
        public int Id { get; set; }
        
        // The event being invited to
        public int EventId { get; set; }
        public Event Event { get; set; } = null!;
        
        // The user who sent the invite (must be event owner or member)
        public int SenderId { get; set; }
        public User Sender { get; set; } = null!;
        
        // The user who receives the invite
        public int InviteeId { get; set; }
        public User Invitee { get; set; } = null!;
        
        public EventInviteStatus Status { get; set; } = EventInviteStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RespondedAt { get; set; }
    }
}
