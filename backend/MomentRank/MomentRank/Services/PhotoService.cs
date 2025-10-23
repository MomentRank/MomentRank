using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using MomentRank.Data;
using MomentRank.DTOs;
using MomentRank.Models;

namespace MomentRank.Services
{
    public class PhotoService : IPhotoService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;

        public PhotoService(ApplicationDbContext context, IWebHostEnvironment environment, IConfiguration configuration)
        {
            _context = context;
            _environment = environment;
            _configuration = configuration;
        }

        public async Task<PhotoResponse?> UploadPhotoBase64Async(User user, Base64UploadRequest request)
        {
            try
            {
                // Check if user has access to the event
                if (!await IsUserEventMemberAsync(user, request.EventId))
                {
                    return null;
                }

                // Validate file data
                if (string.IsNullOrEmpty(request.FileData))
                {
                    return null;
                }

                // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
                string base64Data = request.FileData;
                if (base64Data.Contains(","))
                {
                    base64Data = base64Data.Split(',')[1];
                }

                // Convert base64 to bytes
                byte[] fileBytes;
                try
                {
                    fileBytes = Convert.FromBase64String(base64Data);
                }
                catch (Exception ex)
                {
                    return null;
                }

                // Validate file size (5MB limit)
                const long maxFileSize = 5 * 1024 * 1024; // 5MB
                if (fileBytes.Length > maxFileSize)
                {
                    return null;
                }

                // Validate content type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
                if (!allowedTypes.Contains(request.ContentType.ToLower()))
                {
                    return null;
                }

                // Generate unique filename
                var fileExtension = Path.GetExtension(request.FileName);
                if (string.IsNullOrEmpty(fileExtension))
                {
                    fileExtension = request.ContentType.ToLower().Contains("png") ? ".png" : ".jpg";
                }
                
                var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
                var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "photos");
                
                // Ensure directory exists
                Directory.CreateDirectory(uploadsPath);
                
                var filePath = Path.Combine(uploadsPath, uniqueFileName);
                var relativePath = Path.Combine("uploads", "photos", uniqueFileName);

                // Save file
                await File.WriteAllBytesAsync(filePath, fileBytes);

                // Create photo record
                var photo = new Photo
                {
                    EventId = request.EventId,
                    UploadedById = user.Id,
                    FileName = request.FileName,
                    FilePath = relativePath.Replace("\\", "/"), // Use forward slashes for web
                    ContentType = request.ContentType,
                    FileSizeBytes = fileBytes.Length,
                    Caption = request.Caption,
                    UploadedAt = DateTime.UtcNow
                };

                _context.Photos.Add(photo);
                await _context.SaveChangesAsync();

                return new PhotoResponse
                {
                    Id = photo.Id,
                    EventId = photo.EventId,
                    UploadedById = photo.UploadedById,
                    UploadedByUsername = user.Username,
                    FileName = photo.FileName,
                    FilePath = photo.FilePath,
                    ContentType = photo.ContentType,
                    FileSizeBytes = photo.FileSizeBytes,
                    Caption = photo.Caption,
                    UploadedAt = photo.UploadedAt
                };
            }
            catch (Exception ex)
            {
                return null;
            }
        }


        public async Task<List<PhotoResponse>?> ListPhotosAsync(int eventId)
        {
            try
            {
                var photos = await _context.Photos
                    .Where(p => p.EventId == eventId)
                    .Include(p => p.UploadedBy)
                    .OrderByDescending(p => p.UploadedAt)
                    .ToListAsync();

                return photos.Select(p => new PhotoResponse
                {
                    Id = p.Id,
                    EventId = p.EventId,
                    UploadedById = p.UploadedById,
                    FileName = p.FileName,
                    FilePath = p.FilePath,
                    ContentType = p.ContentType,
                    FileSizeBytes = p.FileSizeBytes,
                    UploadedAt = p.UploadedAt,
                    Caption = p.Caption,
                    UploadedByUsername = p.UploadedBy.Username
                }).ToList();
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<bool> DeletePhotoAsync(User user, int photoId)
        {
            try
            {
                var photo = await _context.Photos
                    .FirstOrDefaultAsync(p => p.Id == photoId);

                if (photo == null)
                    return false;

                // Get the event separately to avoid schema issues
                var eventEntity = await _context.Events
                    .FirstOrDefaultAsync(e => e.Id == photo.EventId);

                if (eventEntity == null)
                    return false;

                // Check if user is the uploader or event owner
                if (photo.UploadedById != user.Id && eventEntity.OwnerId != user.Id)
                    return false;

                // Delete physical file
                var fullPath = Path.Combine(_environment.WebRootPath, photo.FilePath);
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }

                // Delete database record
                _context.Photos.Remove(photo);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> IsUserEventMemberAsync(User user, int eventId)
        {
            try
            {
                // Query only the columns we need to avoid schema issues
                var eventOwnerId = await _context.Events
                    .Where(e => e.Id == eventId)
                    .Select(e => e.OwnerId)
                    .FirstOrDefaultAsync();

                if (eventOwnerId == 0)
                    return false;

                // For now, allow photo uploads for event owners only
                // TODO: Implement proper member checking when EventMember table is used
                return eventOwnerId == user.Id;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}
