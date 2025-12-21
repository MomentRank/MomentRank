using MomentRank.Enums;

namespace MomentRank.DTOs
{
    public record EventMemberInfo(int Id, string Username);

    public record EventResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = string.Empty;
        public int OwnerId { get; init; }
        public bool Public { get; init; }
        public string? CoverPhoto { get; init; }
        public DateTime EndsAt { get; init; }
        public DateTime CreatedAt { get; init; }
        public EventStatus Status { get; init; }
        public List<EventMemberInfo> Members { get; init; } = new();
    }

    public record CreateEventRequest
    {
        public required string Name { get; init; }
        public bool Public { get; init; }
        public string? CoverPhoto { get; init; }
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

    public record GenerateInviteLinkRequest
    {
        public required int EventId { get; init; }
    }

    public record GenerateInviteLinkResponse
    {
        public required string InviteCode { get; init; }
        public required string InviteLink { get; init; }
        public required string QrCodePath { get; init; }
        public required int EventId { get; init; }
        public required string EventName { get; init; }
    }

    public record JoinViaInviteCodeRequest
    {
        public required string InviteCode { get; init; }
    }

    public record UpdateEventRequest
    {
        public required int Id { get; init; }
        public string? Name { get; init; }
        public DateTime? EndsAt { get; init; }
        public bool? Public { get; init; }
        public bool? IsArchived { get; init; }
        public bool? IsCancelled { get; init; }
    }
}
