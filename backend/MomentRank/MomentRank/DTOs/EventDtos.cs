namespace MomentRank.DTOs
{
    public record CreateEventRequest
    {
        public required string Name { get; init; }
        public bool Public { get; init; }
        public DateTime CreatedAt { get; init; }
        public DateTime EndsAt { get; init; }
    }

    public record DeleteEventRequest
    {
        public required string Id { get; init; }
    }

    public record ReadEventRequest
    {
        public required string Id { get; init; }
    }

    public record JoinEventRequest
    {
        public required string Id { get; init; }
    }
    public record ListEventsRequest
    {
        public required bool includePublic { get; init; }
    }
}
