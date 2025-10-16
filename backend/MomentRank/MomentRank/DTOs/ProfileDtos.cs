namespace MomentRank.DTOs
{
    public class CreateProfileRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
    }

    public class UpdateProfileRequest
    {
        public string? Name { get; set; } // null or empty = delete
        public string? Bio { get; set; } // null or empty = delete
    }

    public class ProfileResponse
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Bio { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
