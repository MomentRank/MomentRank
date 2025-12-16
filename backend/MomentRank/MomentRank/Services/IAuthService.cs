using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public interface IAuthService
    {
        Task<User?> RegisterAsync(RegisterRequest request);
        Task<string?> LoginAsync(LoginRequest request);
        Task<(string?, bool?, User?)> GoogleLoginAsync(LoginRequest request);
        Task<User?> GetUserByIdAsync(int userId);
    }
}