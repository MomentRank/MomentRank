using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using System.IdentityModel.Tokens.Jwt;

namespace MomentRank.Services
{
    public class EventService : IEventService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EventService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private string? GetUserToken()
        {
            var authHeader = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].ToString();

            if (string.IsNullOrEmpty(authHeader))
                return null;

            return authHeader.Replace("Bearer ", "").Trim();
        }

        private int? GetUserIdFromToken()
        {
            var token = GetUserToken();
            if (string.IsNullOrEmpty(token))
                return null;

            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);

            var idClaim = jwt.Claims
                .FirstOrDefault(c =>
                    string.Equals(c.Type, "sub", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(c.Type, "id", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(c.Type, "userId", StringComparison.OrdinalIgnoreCase))
                ?.Value;

            if (string.IsNullOrEmpty(idClaim))
                return null;

            if (int.TryParse(idClaim, out var userId))
                return userId;

            return null;
        }

        public async Task<Event?> CreateEventAsync(CreateEventRequest request)
        {
            try
            {
                //Get Id from token
                var parsedId = GetUserIdFromToken();
                if (parsedId == null) return null;

                // Check if event already exists
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(u => u.Name == request.Name ||
                                            u.OwnerId == parsedId.Value);

                if (existingEvent != null)
                {
                    return null; // Event already exists for this user
                }

                Event Event = new Event
                {
                    Name = request.Name.Trim(),
                    OwnerId = parsedId.Value,
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
        public async Task<Event?> DeleteEventAsync(DeleteEventRequest request)
        {
            try
            {
                //Get Id from token
                var parsedId = GetUserIdFromToken();
                if (parsedId == null) return null;

                // Check if event exists, and if the user is the owner
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(u => u.Name == request.Name ||
                                            u.OwnerId == parsedId.Value);

                if (existingEvent == null)
                {
                    return null; // Event doesnt exist
                }

                _context.Events.Remove(existingEvent);

                return existingEvent;
            }
            catch(Exception ex) {
                return null;
            }
        }

        public async Task<Event?> ReadEventAsync(ReadEventRequest request)
        {
            try
            {
                //Get Id from token
                var parsedId = GetUserIdFromToken();
                if (parsedId == null) return null;

                // Check if event exists, and if the user is the owner
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(u => u.Name == request.Name ||
                                            u.OwnerId == parsedId.Value);

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
    }
}
