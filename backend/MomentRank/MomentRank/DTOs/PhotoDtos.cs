namespace MomentRank.DTOs
{
    public class DeletePhotoRequest
    {
        public int PhotoId { get; set; }
    }

    public class ListPhotosRequest
    {
        public int EventId { get; set; }
    }

    public class PhotoResponse
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public int UploadedById { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public DateTime UploadedAt { get; set; }
        public string? Caption { get; set; }
        public string UploadedByUsername { get; set; } = string.Empty;
    }

    public class Base64UploadRequest
    {
        public int EventId { get; set; }
        public string FileData { get; set; } = string.Empty; // Base64 encoded file data
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public string? Caption { get; set; }
    }
}
