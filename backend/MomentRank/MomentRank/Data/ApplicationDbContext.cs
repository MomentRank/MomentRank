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
        }
    }
}
