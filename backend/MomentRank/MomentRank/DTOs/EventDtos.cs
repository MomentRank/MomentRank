namespace MomentRank.DTOs
{
    public record CreateEventRequest
    {
        public required string Name { get; init; }
        public bool Public { get; init; }
        public DateTime EndsAt { get; init; }
    }

    public record DeleteEventRequest
    {
        public required int Id { get; init; }
    }

    public record ReadEventRequest
    {
        public required int Id { get; init; }
    }

    public record JoinEventRequest
    {
        public required int Id { get; init; }
    }
    public record ListEventsRequest
    {
        public required bool includePublic { get; init; }
        public int PageNumber { get; init; } = 1;
        public int PageSize { get; init; } = 10;
    }

    public record InviteToEventRequest
    {
        public required int EventId { get; init; }
        public required int InviteeId { get; init; }
    }

    public record RespondToEventInviteRequest
    {
        public required int InviteId { get; init; }
        public required bool Accept { get; init; }
    }

    public record ListEventInvitesRequest
    {
        public int PageNumber { get; init; } = 1;
        public int PageSize { get; init; } = 10;
    }

    public record CancelEventInviteRequest
    {
        public required int InviteId { get; init; }
    }

    public record UpdateEventCoverPhotoRequest
    {
        public required int EventId { get; init; }
        public required string FilePath { get; init; }
    }
}
