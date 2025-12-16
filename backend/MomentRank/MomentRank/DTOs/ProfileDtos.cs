namespace MomentRank.DTOs
{
    public record CreateProfileRequest
    {
        public required string Name { get; init; }
        public required string Bio { get; init; }
    }

    public record UpdateProfileRequest
    {
        public string? Name { get; init; } // null or empty = delete
        public string? Bio { get; init; }   // null or empty = delete
    }

    public record UpdateProfilePictureRequest
    {
        public required string FilePath { get; init; }
    }

    public record ProfileResponse
    {
        public int Id { get; init; }
        public required string Username { get; init; }
        public required string Email { get; init; }
        public string? Name { get; init; }
        public string? Bio { get; init; }
        public string? ProfilePicture { get; init; }
        public DateTime CreatedAt { get; init; }
    }

    public record ProfileSearchResult
    {
        public int Id { get; init; }
        public required string Username { get; init; }
        public string? Name { get; init; }
    }
}
