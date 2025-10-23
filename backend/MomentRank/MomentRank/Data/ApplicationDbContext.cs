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

                // Configure relationship with Event
                entity.HasOne(p => p.Event)
                      .WithMany()
                      .HasForeignKey(p => p.EventId)
                      .OnDelete(DeleteBehavior.Cascade);

                // Configure relationship with User (UploadedBy)
                entity.HasOne(p => p.UploadedBy)
                      .WithMany()
                      .HasForeignKey(p => p.UploadedById)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
