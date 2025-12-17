using MomentRank.Enums;

namespace MomentRank.Models
{
    public class PhotoComparison
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public RankingCategory Category { get; set; }
        public int PhotoAId { get; set; }
        public int PhotoBId { get; set; }
        public int? WinnerPhotoId { get; set; }
        public int VoterId { get; set; }
        public double PhotoAEloBefore { get; set; }
        public double PhotoBEloBefore { get; set; }
        public double PhotoAEloAfter { get; set; }
        public double PhotoBEloAfter { get; set; }
        public bool WasSkipped { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Event Event { get; set; } = null!;
        public Photo PhotoA { get; set; } = null!;
        public Photo PhotoB { get; set; } = null!;
        public Photo? WinnerPhoto { get; set; }
        public User Voter { get; set; } = null!;
    }
}
