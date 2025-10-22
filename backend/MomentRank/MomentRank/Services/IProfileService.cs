using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public interface IProfileService
    {
        Task<ProfileResponse?> CreateProfileAsync(User user, CreateProfileRequest request);
        Task<ProfileResponse?> UpdateProfileAsync(User user, UpdateProfileRequest request);
        Task<ProfileResponse?> GetProfileAsync(User user);
    }
}
