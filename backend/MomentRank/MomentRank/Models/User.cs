namespace MomentRank.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Profile fields
        public string? Name { get; set; }
        public string? Bio { get; set; }
        public string? ProfilePicture { get; set; }
    }
}