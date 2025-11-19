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
        Task<PagedResult<Event>?> ListEventsAsync(User user, ListEventsRequest request);
        Task<Event?> JoinEventAsync(User user, JoinEventRequest request);
    }
}