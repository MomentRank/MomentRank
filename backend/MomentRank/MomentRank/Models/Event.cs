namespace MomentRank.Models
{
    public class Event
    {
        public int Id { get; set; }
        public List<string> MemberIds { get; set; } = new List<string>();
        public int OwnerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool Public { get; set; } = false;
        public DateTime EndsAt { get; set; } = DateTime.UtcNow.AddHours(1); //Default lenght: 1 hour
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}