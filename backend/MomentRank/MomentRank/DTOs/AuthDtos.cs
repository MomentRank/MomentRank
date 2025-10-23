namespace MomentRank.DTOs
{
    public record RegisterRequest
    {
        public required string Username { get; init; }
        public required string Email { get; init; }
        public required string Password { get; init; }
    }

    public record LoginRequest
    {
        public required string Email { get; init; }
        public required string Password { get; init; }
    }

    public record LoginResponse
    {
        public required string Access_token { get; init; }
        public bool First_time_login { get; init; }
    }
}
