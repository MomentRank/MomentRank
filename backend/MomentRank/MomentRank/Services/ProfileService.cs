using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public class ProfileService : IProfileService
    {
        private readonly ApplicationDbContext _context;

        public ProfileService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProfileResponse?> CreateProfileAsync(User user, CreateProfileRequest request)
        {
            try
            {
                // Update profile fields
                user.Name = request.Name.Trim();
                user.Bio = request.Bio.Trim();

                await _context.SaveChangesAsync();

                return new ProfileResponse
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Name = user.Name,
                    Bio = user.Bio,
                    CreatedAt = user.CreatedAt
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<ProfileResponse?> UpdateProfileAsync(User user, UpdateProfileRequest request)
        {
            try
            {
                // Update or delete fields based on request
                if (request.Name != null)
                {
                    user.Name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name.Trim();
                }

                if (request.Bio != null)
                {
                    user.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
                }

                await _context.SaveChangesAsync();

                return new ProfileResponse
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Name = user.Name,
                    Bio = user.Bio,
                    CreatedAt = user.CreatedAt
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<ProfileResponse?> GetProfileAsync(User user)
        {
            try
            {
                return new ProfileResponse
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Name = user.Name,
                    Bio = user.Bio,
                    CreatedAt = user.CreatedAt
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<ProfileResponse?> GetProfileByUsernameAsync(User user, string name)
        {
            try
            {
                var targetUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == name);

                if (targetUser == null)
                {
                    return null;
                }

                return new ProfileResponse
                {
                    Id = targetUser.Id,
                    Username = targetUser.Username,
                    Email = targetUser.Email,
                    Name = targetUser.Name,
                    Bio = targetUser.Bio,
                    CreatedAt = targetUser.CreatedAt
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<ProfileResponse?> GetProfileByIdAsync(User user, int userId)
        {
            try
            {
                var targetUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (targetUser == null)
                {
                    return null;
                }

                return new ProfileResponse
                {
                    Id = targetUser.Id,
                    Username = targetUser.Username,
                    Email = targetUser.Email,
                    Name = targetUser.Name,
                    Bio = targetUser.Bio,
                    CreatedAt = targetUser.CreatedAt
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<ProfileSearchResult>> SearchProfilesAsync(string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return new List<ProfileSearchResult>();
                }

                var searchTerm = query.Trim().ToLower();

                var users = await _context.Users
                    .Where(u => u.Username.ToLower().Contains(searchTerm) || 
                               (u.Name != null && u.Name.ToLower().Contains(searchTerm)))
                    .Select(u => new ProfileSearchResult
                    {
                        Id = u.Id,
                        Username = u.Username,
                        Name = u.Name
                    })
                    .Take(10) // Limit results to 10
                    .ToListAsync();

                return users;
            }
            catch (Exception)
            {
                return new List<ProfileSearchResult>();
            }
        }
    }
}
