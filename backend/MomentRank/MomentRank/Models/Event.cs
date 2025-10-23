using MomentRank.Enums;
using MomentRank.ValueTypes;

namespace MomentRank.Models
{
    public class Event
    {
        public int Id { get; set; }
        public List<string> MemberIds { get; set; } = new List<string>();
        public int OwnerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool Public { get; set; } = false;
        public DateTime EndsAt { get; set; } = DateTime.UtcNow.AddHours(1); //Default length: 1 hour
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public EventStatus Status { get; set; } = EventStatus.Active;

        public DateTimeRange GetTimeRange()
        {
            return new DateTimeRange(CreatedAt, EndsAt);
        }

        public EventStatus GetCurrentStatus()
        {
            if (Status == EventStatus.Cancelled || Status == EventStatus.Archived)
            {
                return Status;
            }

            var now = DateTime.UtcNow;
            var timeRange = GetTimeRange();

            if (timeRange.HasEnded(now))
            {
                return EventStatus.Ended;
            }
            else if (timeRange.IsUpcoming(now))
            {
                return EventStatus.Scheduled;
            }
            else
            {
                return EventStatus.Active;
            }
        }

        public bool IsActive()
        {
            return GetCurrentStatus() == EventStatus.Active;
        }
    }
}