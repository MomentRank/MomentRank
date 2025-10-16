namespace MomentRank.DTOs
{
    public class CreateEventRequest
    {
        public string Name { get; set; } = string.Empty;
        public bool Public { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime EndsAt { get; set; }
    }

    public class DeleteEventRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    public class ReadEventRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    public class JoinEventRequest
    {
        public string Name { get; set; } = string.Empty;
    }
}
