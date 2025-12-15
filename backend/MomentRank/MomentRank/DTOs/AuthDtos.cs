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

    public record GoogleLoginRequest
    {
        public required string Token { get; init; }
        public GoogleUserData? User { get; init; }
    }

    public record GoogleUserData
    {
        public string? Id { get; init; }
        public string? Email { get; init; }
        public string? Name { get; init; }
        public string? GivenName { get; init; }
        public string? FamilyName { get; init; }
        public string? Photo { get; init; }
    }
}
