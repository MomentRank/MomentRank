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
    }
}
