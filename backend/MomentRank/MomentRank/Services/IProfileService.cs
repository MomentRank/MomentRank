using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public interface IProfileService
    {
        Task<ProfileResponse?> CreateProfileAsync(CreateProfileRequest request);
        Task<ProfileResponse?> UpdateProfileAsync(UpdateProfileRequest request);
        Task<ProfileResponse?> GetProfileAsync();
    }
}
