using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Enums;
using MomentRank.Models;
using System.Numerics;
using System.Collections.Concurrent;

namespace MomentRank.Services
{
    public class EventService : IEventService
    {
        private static readonly ConcurrentDictionary<int, int> _eventViews = new();
        private readonly ApplicationDbContext _context;

        public EventService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Event?> CreateEventAsync(User user, CreateEventRequest request)
        {
            try
            {
                // Validate that EndsAt is in the future
                if (request.EndsAt <= DateTime.UtcNow)
                {
                    return null;
                }

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
                    MemberIds = new List<int> { user.Id },
                    EndsAt = request.EndsAt,
                    CreatedAt = DateTime.UtcNow,
                    Public = request.Public,
                    CoverPhoto = request.CoverPhoto,
                };

                _context.Events.Add(Event);
                await _context.SaveChangesAsync();

                return Event;
            }
            catch (Exception)
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
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<Event?> ReadEventAsync(User user, ReadEventRequest request)
        {
            try
            {
                // Check if event exists, and if the user is the owner
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(e => e.Id == request.Id && e.MemberIds.Contains(user.Id));

                if (existingEvent == null)
                {
                    return null; // Event doesnt exist
                }

                // Track event views in memory using concurrent collection
                _eventViews.AddOrUpdate(request.Id, 1, (key, count) => count + 1);


                return existingEvent;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<Event?> UpdateEventCoverPhotoAsync(User user, UpdateEventCoverPhotoRequest request)
        {
            try
            {
                // Check if event exists and if the user is the owner
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(e => e.Id == request.EventId &&
                                            e.OwnerId == user.Id);

                if (existingEvent == null)
                {
                    return null; // Event doesn't exist or user is not the owner
                }

                existingEvent.CoverPhoto = request.FilePath;
                await _context.SaveChangesAsync();

                return existingEvent;
            }
            catch (Exception)
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

                // Sort by private first, then public events
                query = query.OrderBy(e => e.Public);

                var totalCount = await query.CountAsync();

                var events = await query
                    .Skip((request.PageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();


                return new PagedResult<Event>(events, totalCount, request.PageNumber, pageSize);
            }
            catch (Exception)
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

                // For private events, check if user has a pending invitation
                if (!existingEvent.Public)
                {
                    var hasInvite = await HasPendingInviteAsync(user.Id, request.Id);
                    if (!hasInvite)
                    {
                        return null; // No invitation for private event
                    }

                    // Mark the invitation as accepted
                    var invite = await _context.EventInvites
                        .FirstOrDefaultAsync(ei => ei.EventId == request.Id &&
                                                   ei.InviteeId == user.Id &&
                                                   ei.Status == Enums.EventInviteStatus.Pending);
                    if (invite != null)
                    {
                        invite.Status = Enums.EventInviteStatus.Accepted;
                        invite.RespondedAt = DateTime.UtcNow;
                    }
                }

                // Add user to members list
                existingEvent.MemberIds.Add(user.Id);
                await _context.SaveChangesAsync();

                return existingEvent;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<bool> HasPendingInviteAsync(int userId, int eventId)
        {
            return await _context.EventInvites
                .AnyAsync(ei => ei.EventId == eventId &&
                               ei.InviteeId == userId &&
                               ei.Status == Enums.EventInviteStatus.Pending);
        }

        public async Task<EventInvite?> InviteToEventAsync(User user, InviteToEventRequest request)
        {
            try
            {
                // Find the event
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(e => e.Id == request.EventId);

                if (existingEvent == null)
                {
                    return null; // Event doesn't exist
                }

                // Check if user is a member of the event (owner is included in MemberIds)
                if (!existingEvent.MemberIds.Contains(user.Id))
                {
                    return null; // User is not authorized to invite
                }

                // Check if invitee exists
                var invitee = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == request.InviteeId);

                if (invitee == null)
                {
                    return null; // Invitee doesn't exist
                }

                // Can't invite yourself
                if (request.InviteeId == user.Id)
                {
                    return null;
                }

                // Can't invite the owner
                if (request.InviteeId == existingEvent.OwnerId)
                {
                    return null;
                }

                // Check if invitee is already a member
                if (existingEvent.MemberIds.Contains(request.InviteeId))
                {
                    return null; // Already a member
                }

                // Check if there's already a pending invite
                var existingInvite = await _context.EventInvites
                    .FirstOrDefaultAsync(ei => ei.EventId == request.EventId &&
                                               ei.InviteeId == request.InviteeId &&
                                               ei.Status == Enums.EventInviteStatus.Pending);

                if (existingInvite != null)
                {
                    return null; // Already has a pending invite
                }

                var invite = new EventInvite
                {
                    EventId = request.EventId,
                    SenderId = user.Id,
                    InviteeId = request.InviteeId,
                    Status = Enums.EventInviteStatus.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                _context.EventInvites.Add(invite);
                await _context.SaveChangesAsync();

                return invite;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<EventInvite?> RespondToEventInviteAsync(User user, RespondToEventInviteRequest request)
        {
            try
            {
                // Find the invite
                var invite = await _context.EventInvites
                    .Include(ei => ei.Event)
                    .FirstOrDefaultAsync(ei => ei.Id == request.InviteId &&
                                               ei.InviteeId == user.Id &&
                                               ei.Status == Enums.EventInviteStatus.Pending);

                if (invite == null)
                {
                    return null; // Invite doesn't exist or user is not the invitee
                }

                if (request.Accept)
                {
                    invite.Status = Enums.EventInviteStatus.Accepted;

                    // Add user to event members
                    if (!invite.Event.MemberIds.Contains(user.Id))
                    {
                        invite.Event.MemberIds.Add(user.Id);
                    }
                }
                else
                {
                    invite.Status = Enums.EventInviteStatus.Declined;
                }

                invite.RespondedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return invite;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<PagedResult<EventInvite>?> ListEventInvitesAsync(User user, ListEventInvitesRequest request)
        {
            try
            {
                var pageSize = Math.Min(request.PageSize, 32);

                var query = _context.EventInvites
                    .Include(ei => ei.Event)
                    .Include(ei => ei.Sender)
                    .Where(ei => ei.InviteeId == user.Id && ei.Status == Enums.EventInviteStatus.Pending);

                var totalCount = await query.CountAsync();

                var invites = await query
                    .OrderByDescending(ei => ei.CreatedAt)
                    .Skip((request.PageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return new PagedResult<EventInvite>(invites, totalCount, request.PageNumber, pageSize);
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<EventInvite?> CancelEventInviteAsync(User user, CancelEventInviteRequest request)
        {
            try
            {
                // Find the invite - only the sender can cancel
                var invite = await _context.EventInvites
                    .FirstOrDefaultAsync(ei => ei.Id == request.InviteId &&
                                               ei.SenderId == user.Id &&
                                               ei.Status == Enums.EventInviteStatus.Pending);

                if (invite == null)
                {
                    return null; // Invite doesn't exist or user is not the sender
                }

                invite.Status = Enums.EventInviteStatus.Cancelled;
                invite.RespondedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return invite;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<GenerateInviteLinkResponse?> GenerateInviteLinkAsync(User user, GenerateInviteLinkRequest request)
        {
            try
            {
                // Find the event
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(e => e.Id == request.EventId);

                if (existingEvent == null)
                {
                    return null;
                }

                // Check if user is a member of the event (owner is included in MemberIds)
                if (!existingEvent.MemberIds.Contains(user.Id))
                {
                    return null;
                }

                // Check if event has ended
                if (existingEvent.EndsAt <= DateTime.UtcNow)
                {
                    return null;
                }

                // Generate invite code if not exists
                if (string.IsNullOrEmpty(existingEvent.InviteCode))
                {
                    existingEvent.InviteCode = Guid.NewGuid().ToString("N")[..8].ToUpper();
                    await _context.SaveChangesAsync();
                }

                // Generate deep link
                var inviteLink = $"momentrank://join/{existingEvent.InviteCode}";

                // Generate QR code
                var qrCodePath = await GenerateQrCodeAsync(inviteLink, existingEvent.InviteCode);

                return new GenerateInviteLinkResponse
                {
                    InviteCode = existingEvent.InviteCode,
                    InviteLink = inviteLink,
                    QrCodePath = qrCodePath,
                    EventId = existingEvent.Id,
                    EventName = existingEvent.Name
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<Event?> JoinEventViaInviteCodeAsync(User user, string inviteCode)
        {
            try
            {
                // Find the event by invite code
                var existingEvent = await _context.Events
                    .FirstOrDefaultAsync(e => e.InviteCode == inviteCode);

                if (existingEvent == null)
                {
                    return null;
                }

                // Check if invite code is still valid (event hasn't ended)
                if (existingEvent.EndsAt <= DateTime.UtcNow)
                {
                    return null;
                }

                // Check if user is the owner
                if (existingEvent.OwnerId == user.Id)
                {
                    return null;
                }

                // Check if user is already a member
                if (existingEvent.MemberIds.Contains(user.Id))
                {
                    return null;
                }

                // Add user to members list
                existingEvent.MemberIds.Add(user.Id);
                await _context.SaveChangesAsync();

                return existingEvent;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private async Task<string> GenerateQrCodeAsync(string content, string inviteCode)
        {
            using var qrGenerator = new QRCoder.QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(content, QRCoder.QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new QRCoder.PngByteQRCode(qrCodeData);
            var qrCodeBytes = qrCode.GetGraphic(20);

            // Save to wwwroot/uploads/qrcodes
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "qrcodes");
            Directory.CreateDirectory(uploadsPath);

            var fileName = $"{inviteCode}.png";
            var filePath = Path.Combine(uploadsPath, fileName);

            await File.WriteAllBytesAsync(filePath, qrCodeBytes);

            var relativePath = $"uploads/qrcodes/{fileName}";
            return relativePath;
        }
    }
}
