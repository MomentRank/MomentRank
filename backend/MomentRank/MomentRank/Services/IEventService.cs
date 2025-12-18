using MomentRank.DTOs;
using MomentRank.Enums;
using MomentRank.Models;
using System.ComponentModel;

namespace MomentRank.Services
{
    public interface IEventService
    {
        Task<Event?> CreateEventAsync(User user, CreateEventRequest request);
        Task<Event?> DeleteEventAsync(User user, DeleteEventRequest request);
        Task<Event?> ReadEventAsync(User user, ReadEventRequest request);
        Task<Event?> UpdateEventCoverPhotoAsync(User user, UpdateEventCoverPhotoRequest request);
        Task<PagedResult<Event>?> ListEventsAsync(User user, ListEventsRequest request);
        Task<Event?> JoinEventAsync(User user, JoinEventRequest request);

        // Event Invite methods
        Task<EventInvite?> InviteToEventAsync(User user, InviteToEventRequest request);
        Task<EventInvite?> RespondToEventInviteAsync(User user, RespondToEventInviteRequest request);
        Task<PagedResult<EventInvite>?> ListEventInvitesAsync(User user, ListEventInvitesRequest request);
        Task<EventInvite?> CancelEventInviteAsync(User user, CancelEventInviteRequest request);
        Task<bool> HasPendingInviteAsync(int userId, int eventId);

        // Invite link methods
        Task<GenerateInviteLinkResponse?> GenerateInviteLinkAsync(User user, GenerateInviteLinkRequest request);
        Task<Event?> JoinEventViaInviteCodeAsync(User user, string inviteCode);
    }
}