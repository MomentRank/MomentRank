using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public interface IEventService
    {
        Task<Event?> CreateEventAsync(CreateEventRequest request);
        Task<Event?> DeleteEventAsync(DeleteEventRequest request);
        //Task<Event?> ReadEventAsync(int userId);
    }
}