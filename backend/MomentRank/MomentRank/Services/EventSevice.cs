using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public class EventService : IEventService
    {
        private readonly ApplicationDbContext _context;

        public EventService(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<Event?> CreateEventAsync(CreateEventRequest request)
        {
            try
            {
                // Check if event already exists
                var existingUser = await _context.Events
                    .FirstOrDefaultAsync(u => u.Name == request.Name ||
                                            u.Id == request.OwnerId);

                if (existingUser != null)
                {
                    return null; // Event already exists for this user
                }
                

                // TODO: Add verification by token, currently any user can create Events for other users


                Event Event = new Event
                {
                    Name = request.Name.Trim(),
                    OwnerId = request.OwnerId,
                    EndsAt = request.EndsAt,
                    CreatedAt = request.CreatedAt,
                    Public = request.Public,
                };

                _context.Events.Add(Event);
                await _context.SaveChangesAsync();

                return Event;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

    }
}
