using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public interface IPhotoService
    {
        Task<PhotoResponse?> UploadPhotoBase64Async(User user, Base64UploadRequest request);
        Task<List<PhotoResponse>?> ListPhotosAsync(int eventId);
        Task<bool> DeletePhotoAsync(User user, int photoId);
        Task<bool> IsUserEventMemberAsync(User user, int eventId);
    }
}
