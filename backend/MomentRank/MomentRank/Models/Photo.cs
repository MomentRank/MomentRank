namespace MomentRank.Models
{
    public class Photo
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int UploadedById { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string? Caption { get; set; }
        
        // Navigation properties
        public Event Event { get; set; } = null!;
        public User UploadedBy { get; set; } = null!;
    }
}
