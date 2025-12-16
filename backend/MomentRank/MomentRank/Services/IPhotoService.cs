using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public interface IPhotoService
    {
        Task<PhotoResponse?> UploadEventPhotoBase64Async(User user, Base64UploadRequest request);
        Task<PhotoResponse?> UploadPhotoBase64Async(User user, GeneralPhotoUploadRequest request);
        Task<List<PhotoResponse>?> ListPhotosAsync(int eventId);
        Task<bool> DeletePhotoAsync(User user, int photoId);
        Task<bool> IsUserEventMemberAsync(User user, int eventId);
        Task<bool> CanUserViewEventPhotosAsync(User user, int eventId);
    }
}
