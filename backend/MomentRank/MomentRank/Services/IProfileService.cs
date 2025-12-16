using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public interface IProfileService
    {
        Task<ProfileResponse?> CreateProfileAsync(User user, CreateProfileRequest request);
        Task<ProfileResponse?> UpdateProfileAsync(User user, UpdateProfileRequest request);
        Task<ProfileResponse?> UpdateProfilePictureAsync(User user, UpdateProfilePictureRequest request);
        Task<ProfileResponse?> GetProfileAsync(User user);
        Task<ProfileResponse?> GetProfileByUsernameAsync(User user, string name);
        Task<ProfileResponse?> GetProfileByIdAsync(User user, int userId);
        Task<List<ProfileSearchResult>> SearchProfilesAsync(string query);
    }
}
