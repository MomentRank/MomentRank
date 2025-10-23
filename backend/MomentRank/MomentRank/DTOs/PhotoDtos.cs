namespace MomentRank.DTOs
{
    public record DeletePhotoRequest
    {
        public int PhotoId { get; init; }
    }

    public record ListPhotosRequest
    {
        public int EventId { get; init; }
    }

    public record PhotoResponse
    {
        public int Id { get; init; }
        public int EventId { get; init; }
        public int UploadedById { get; init; }
        public required string FileName { get; init; }
        public required string FilePath { get; init; }
        public required string ContentType { get; init; }
        public long FileSizeBytes { get; init; }
        public DateTime UploadedAt { get; init; }
        public string? Caption { get; init; }
        public required string UploadedByUsername { get; init; }
    }

    public record Base64UploadRequest
    {
        public int EventId { get; init; }
        public required string FileData { get; init; } // Base64 encoded file data
        public required string FileName { get; init; }
        public required string ContentType { get; init; }
        public string? Caption { get; init; }
    }
}
