using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Enums;
using MomentRank.Models;
using System.Numerics;

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
                    .FirstOrDefaultAsync(e => e.Id == request.Id &&
                                            e.OwnerId == user.Id);

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
                    .FirstOrDefaultAsync(e => e.Id == request.Id &&
                                            e.OwnerId == user.Id);

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

        public async Task<PagedResult<Event>?> ListEventsAsync(User user, ListEventsRequest request)
        {
            try
            {
                // Limit pageSize to maximum of 32
                var pageSize = Math.Min(request.PageSize, 32);
                
                // Start with public events query
                var query = _context.Events.AsQueryable();

                // Apply public filter (always include public events)
                if (request.includePublic)
                {
                    // Include both public events and event that user participates in
                    query = query.Where(e => e.Public == true || e.MemberIds.Contains(user.Id) || (user.Id == e.OwnerId));
                }
                else
                {
                    // Only private events 
                    query = query.Where(e => e.MemberIds.Contains(user.Id) || (user.Id == e.OwnerId));
                }

                // Apply status filter if provided
                //if (filterByStatus.HasValue)
                //{
                //    query = query.Where(e => e.Status == filterByStatus.Value);
                //}

                var totalCount = await query.CountAsync();

                var events = await query
                    .Skip((request.PageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                foreach(var x in events)
                {
                    Console.WriteLine(x);
                }

                return new PagedResult<Event>(events, totalCount, request.PageNumber, pageSize);
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
                    .FirstOrDefaultAsync(e => e.Id == request.Id);

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
                if (existingEvent.MemberIds.Contains(user.Id))
                {
                    return null; // Already a member
                }

                // Add user to members list
                existingEvent.MemberIds.Add(user.Id);
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
