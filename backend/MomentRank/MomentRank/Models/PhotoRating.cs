using MomentRank.Enums;

namespace MomentRank.Models
{
    public class PhotoRating
    {
        public int Id { get; set; }
        public int PhotoId { get; set; }
        public int EventId { get; set; }
        public RankingCategory Category { get; set; }
        public double EloScore { get; set; } = 1500.0;
        public double Uncertainty { get; set; } = 350.0;
        public double KFactor { get; set; } = 40.0;
        public int ComparisonCount { get; set; } = 0;
        public int WinCount { get; set; } = 0;
        public bool IsBootstrapped { get; set; } = false;
        public bool IsStable { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Photo Photo { get; set; } = null!;
        public Event Event { get; set; } = null!;
    }
}
