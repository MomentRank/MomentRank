using Microsoft.AspNetCore.Http;
using MomentRank.Data;
using MomentRank.Models;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;

namespace MomentRank.Utils
{
    public static class JwtUtils
    {
        public static string? GetUserToken(HttpRequest request)
        {
            var authHeader = request.Headers["Authorization"].ToString();

            if (string.IsNullOrEmpty(authHeader))
                return null;

            return authHeader.Replace("Bearer ", "").Trim();
        }

        public static int? GetUserIdFromToken(string token)
        {
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

        public static async Task<User?> GetUserFromRequestAsync(HttpRequest request, ApplicationDbContext context)
        {
            var token = GetUserToken(request);
            if (token == null)
                return null;

            var userId = GetUserIdFromToken(token);
            if (userId == null)
                return null;

            var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            return user;
        }
    }
}
