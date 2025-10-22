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

        public async Task<Event?> CreateEventAsync(User user, CreateEventRequest request)
        {
            try
            {
                // Check if event already exists
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(u => u.Name == request.Name &&
                                            u.OwnerId == user.Id);

                if (existingEvent != null)
                {
                    return null; // Event already exists for this user
                }

                Event Event = new Event
                {
                    Name = request.Name.Trim(),
                    OwnerId = user.Id,
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

        public async Task<Event?> DeleteEventAsync(User user, DeleteEventRequest request)
        {
            try
            {
                // Check if event exists, and if the user is the owner
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(u => u.Name == request.Name &&
                                            u.OwnerId == user.Id);

                if (existingEvent == null)
                {
                    return null; // Event doesnt exist
                }

                _context.Events.Remove(existingEvent);
                await _context.SaveChangesAsync();

                return existingEvent;
            }
            catch(Exception ex) {
                return null;
            }
        }

        public async Task<Event?> ReadEventAsync(User user, ReadEventRequest request)
        {
            try
            {
                // Check if event exists, and if the user is the owner
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(u => u.Name == request.Name &&
                                            u.OwnerId == user.Id);

                if (existingEvent == null)
                {
                    return null; // Event doesnt exist
                }
                return existingEvent;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<List<Event>?> ListEventsAsync(User user)
        {
            try
            {
                // Get all public events
                var events = await _context.Events
                    .Where(e => e.Public == true)
                    .ToListAsync();

                return events;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<Event?> JoinEventAsync(User user, JoinEventRequest request)
        {
            try
            {
                // Find the event by name
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(e => e.Name == request.Name);

                if (existingEvent == null)
                {
                    return null; // Event doesn't exist
                }

                // Check if user is already the owner
                if (existingEvent.OwnerId == user.Id)
                {
                    return null; // Can't join your own event
                }

                // Check if user is already a member
                var userIdString = user.Id.ToString();
                if (existingEvent.MemberIds.Contains(userIdString))
                {
                    return null; // Already a member
                }

                // Add user to members list
                existingEvent.MemberIds.Add(userIdString);
                await _context.SaveChangesAsync();

                return existingEvent;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}
