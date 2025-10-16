using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;
using System.IdentityModel.Tokens.Jwt;

namespace MomentRank.Services
{
    public class ProfileService : IProfileService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ProfileService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
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

            try
            {
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
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<ProfileResponse?> CreateProfileAsync(CreateProfileRequest request)
        {
            try
            {
                var parsedId = GetUserIdFromToken();
                if (parsedId == null) return null;

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == parsedId.Value);
                if (user == null) return null;

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
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<ProfileResponse?> UpdateProfileAsync(UpdateProfileRequest request)
        {
            try
            {
                var parsedId = GetUserIdFromToken();
                if (parsedId == null) return null;

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == parsedId.Value);
                if (user == null) return null;

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
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<ProfileResponse?> GetProfileAsync()
        {
            try
            {
                var parsedId = GetUserIdFromToken();
                if (parsedId == null) return null;

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == parsedId.Value);
                if (user == null) return null;

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
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}
