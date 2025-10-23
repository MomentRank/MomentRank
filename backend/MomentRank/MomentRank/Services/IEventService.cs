using MomentRank.DTOs;
using MomentRank.Enums;
using MomentRank.Models;

namespace MomentRank.Services
{
    public interface IEventService
    {
        Task<Event?> CreateEventAsync(User user, CreateEventRequest request);
        Task<Event?> DeleteEventAsync(User user, DeleteEventRequest request);
        Task<Event?> ReadEventAsync(User user, ReadEventRequest request);
        Task<List<Event>?> ListEventsAsync(User user, bool includeOwned = false, EventStatus? filterByStatus = null);
        Task<Event?> JoinEventAsync(User user, JoinEventRequest request);
    }
}