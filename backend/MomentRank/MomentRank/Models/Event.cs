using MomentRank.Enums;
using MomentRank.ValueTypes;

namespace MomentRank.Models
{
    public class Event
    {
        public int Id { get; set; }
        public List<int> MemberIds { get; set; } = new List<int>();
        public int OwnerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool Public { get; set; } = false;
        public string? CoverPhoto { get; set; }
        public DateTime EndsAt { get; set; } = DateTime.UtcNow.AddHours(1);
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? InviteCode { get; set; }

        // Only stored for user-triggered terminal states
        public bool IsCancelled { get; private set; } = false;
        public bool IsArchived { get; private set; } = false;
        public bool IsEnded { get; private set; } = false;

        public DateTimeRange TimeRange => new DateTimeRange(CreatedAt, EndsAt);

        public EventStatus Status
        {
            get
            {
                // Terminal states take priority (user actions)
                if (IsCancelled) return EventStatus.Cancelled;
                if (IsArchived) return EventStatus.Archived;
                if (IsEnded) return EventStatus.Ended;

                // Time-based states (computed)
                var now = DateTime.UtcNow;
                if (TimeRange.HasEnded(now)) return EventStatus.Ranking;
                if (TimeRange.IsUpcoming(now)) return EventStatus.Scheduled;
                return EventStatus.Active;
            }
        }

        public bool IsActive => Status == EventStatus.Active;

        // Explicit methods for user actions (clear intent)
        public void Cancel() => IsCancelled = true;
        public void Archive() => IsArchived = true;
        public void End() => IsEnded = true;
    }
}