namespace MomentRank.DTOs
{
    public class CreateEventRequest
    {
        public string OwnerToken {  get; set; } = string.Empty;
        public int OwnerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool Public { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime EndsAt { get; set; }
    }

    public class DeleteEventRequest
    {
        public string Access_token { get; set; } = string.Empty;
        public int OwnerId { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class ReadEventRequest
    {
        public string Access_token { get; set; } = string.Empty;
        public int Id { get; set; }

    }
}
