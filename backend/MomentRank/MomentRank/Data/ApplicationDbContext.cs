using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MomentRank.Models;

namespace MomentRank.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<Photo> Photos { get; set; }
        public DbSet<FriendRequest> FriendRequests { get; set; }
        public DbSet<EventInvite> EventInvites { get; set; }
        public DbSet<PhotoRating> PhotoRatings { get; set; }
        public DbSet<PhotoComparison> PhotoComparisons { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.Username).IsUnique();
                entity.Property(e => e.Username).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
                entity.Property(e => e.PasswordHash).IsRequired();
            });
            modelBuilder.Entity<Event>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
                entity.Property(e => e.EndsAt).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired();
            });

            // Photo configuration
            modelBuilder.Entity<Photo>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.FileName).HasMaxLength(255).IsRequired();
                entity.Property(p => p.FilePath).HasMaxLength(500).IsRequired();
                entity.Property(p => p.ContentType).HasMaxLength(100).IsRequired();
                entity.Property(p => p.Caption).HasMaxLength(500);
                entity.Property(p => p.UploadedAt).IsRequired();

                // Configure optional relationship with Event (nullable EventId for profile/cover photos)
                entity.HasOne(p => p.Event)
                      .WithMany()
                      .HasForeignKey(p => p.EventId)
                      .IsRequired(false)
                      .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with User (UploadedBy)
                entity.HasOne(p => p.UploadedBy)
                      .WithMany()
                      .HasForeignKey(p => p.UploadedById)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // FriendRequest configuration
            modelBuilder.Entity<FriendRequest>(entity =>
            {
                entity.HasKey(fr => fr.Id);
                entity.Property(fr => fr.Status).IsRequired();
                entity.Property(fr => fr.CreatedAt).IsRequired();

                // Configure relationship with Sender
                entity.HasOne(fr => fr.Sender)
                      .WithMany()
                      .HasForeignKey(fr => fr.SenderId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Configure relationship with Receiver
                entity.HasOne(fr => fr.Receiver)
                      .WithMany()
                      .HasForeignKey(fr => fr.ReceiverId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Create index to prevent duplicate requests
                entity.HasIndex(fr => new { fr.SenderId, fr.ReceiverId, fr.Status });
            });

            // EventInvite configuration
            modelBuilder.Entity<EventInvite>(entity =>
            {
                entity.HasKey(ei => ei.Id);
                entity.Property(ei => ei.Status).IsRequired();
                entity.Property(ei => ei.CreatedAt).IsRequired();

                // Configure relationship with Event
                entity.HasOne(ei => ei.Event)
                      .WithMany()
                      .HasForeignKey(ei => ei.EventId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with Sender
                entity.HasOne(ei => ei.Sender)
                      .WithMany()
                      .HasForeignKey(ei => ei.SenderId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Configure relationship with Invitee
                entity.HasOne(ei => ei.Invitee)
                      .WithMany()
                      .HasForeignKey(ei => ei.InviteeId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Create index to prevent duplicate invites
                entity.HasIndex(ei => new { ei.EventId, ei.InviteeId, ei.Status });
            });

            // PhotoRating configuration
            modelBuilder.Entity<PhotoRating>(entity =>
            {
                entity.HasKey(pr => pr.Id);
                entity.Property(pr => pr.EloScore).IsRequired();
                entity.Property(pr => pr.Uncertainty).IsRequired();
                entity.Property(pr => pr.KFactor).IsRequired();
                entity.Property(pr => pr.Category).IsRequired();
                entity.Property(pr => pr.CreatedAt).IsRequired();
                entity.Property(pr => pr.UpdatedAt).IsRequired();

                // Configure relationship with Photo
                entity.HasOne(pr => pr.Photo)
                      .WithMany()
                      .HasForeignKey(pr => pr.PhotoId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with Event
                entity.HasOne(pr => pr.Event)
                      .WithMany()
                      .HasForeignKey(pr => pr.EventId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Unique constraint: one rating per photo per category per event
                entity.HasIndex(pr => new { pr.PhotoId, pr.EventId, pr.Category }).IsUnique();

                // Index for efficient querying by event and category (for leaderboards)
                entity.HasIndex(pr => new { pr.EventId, pr.Category, pr.EloScore });

                // Index for finding high-uncertainty photos (for matchup selection)
                entity.HasIndex(pr => new { pr.EventId, pr.Category, pr.Uncertainty });
            });

            // PhotoComparison configuration
            modelBuilder.Entity<PhotoComparison>(entity =>
            {
                entity.HasKey(pc => pc.Id);
                entity.Property(pc => pc.Category).IsRequired();
                entity.Property(pc => pc.CreatedAt).IsRequired();

                // Configure relationship with Event
                entity.HasOne(pc => pc.Event)
                      .WithMany()
                      .HasForeignKey(pc => pc.EventId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with PhotoA
                entity.HasOne(pc => pc.PhotoA)
                      .WithMany()
                      .HasForeignKey(pc => pc.PhotoAId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Configure relationship with PhotoB
                entity.HasOne(pc => pc.PhotoB)
                      .WithMany()
                      .HasForeignKey(pc => pc.PhotoBId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Configure optional relationship with WinnerPhoto
                entity.HasOne(pc => pc.WinnerPhoto)
                      .WithMany()
                      .HasForeignKey(pc => pc.WinnerPhotoId)
                      .IsRequired(false)
                      .OnDelete(DeleteBehavior.Restrict);

                // Configure relationship with Voter
                entity.HasOne(pc => pc.Voter)
                      .WithMany()
                      .HasForeignKey(pc => pc.VoterId)
                      .OnDelete(DeleteBehavior.Restrict);

                // Index for finding comparisons by voter and event (for history)
                entity.HasIndex(pc => new { pc.VoterId, pc.EventId, pc.CreatedAt });

                // Index for finding comparisons by photo pair (to avoid duplicates)
                entity.HasIndex(pc => new { pc.EventId, pc.Category, pc.PhotoAId, pc.PhotoBId });

                // Index for aggregations by event and category
                entity.HasIndex(pc => new { pc.EventId, pc.Category });
            });
        }
    }
}
