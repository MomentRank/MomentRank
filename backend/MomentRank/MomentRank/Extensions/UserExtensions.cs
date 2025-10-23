using Microsoft.AspNetCore.Mvc;
using MomentRank.Data;
using MomentRank.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace MomentRank.Utils
{
    public static class UserExtensions
    {
        public static async Task<User?> GetCurrentUserAsync(
            this ControllerBase controller,
            ApplicationDbContext context)
        {
            var userId = controller.GetCurrentUserId();
            if (userId == null)
                return null;

            return await context.Users.FindAsync(userId.Value);
        }

        public static int? GetCurrentUserId(this ControllerBase controller)
        {
            var userIdClaim = controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return null;

            return userId;
        }
    }
}