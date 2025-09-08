using Microsoft.EntityFrameworkCore;
using MeetingSummarizer.Api.Data.Entities;

namespace MeetingSummarizer.Api.Data;

/// <summary>
/// Entity Framework DbContext for persistent user data storage
/// </summary>
public class MeetingSummarizerDbContext : DbContext
{
    public MeetingSummarizerDbContext(DbContextOptions<MeetingSummarizerDbContext> options) : base(options)
    {
    }
    
    /// <summary>
    /// Users in the system
    /// </summary>
    public DbSet<User> Users { get; set; } = null!;
    
    /// <summary>
    /// Meetings owned by users
    /// </summary>
    public DbSet<Meeting> Meetings { get; set; } = null!;
    
    /// <summary>
    /// Meeting history and audit trail
    /// </summary>
    public DbSet<MeetingHistory> MeetingHistory { get; set; } = null!;
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
            entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.LastName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.TokenBalance).HasColumnType("decimal(18,2)");
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(u => u.LastActivityAt).HasDefaultValueSql("GETUTCDATE()");
        });
        
        // Configure Meeting entity
        modelBuilder.Entity<Meeting>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.HasIndex(m => new { m.UserId, m.CreatedAt }); // For efficient user meeting queries
            entity.HasIndex(m => m.ScheduledDeletionAt); // For cleanup job efficiency
            entity.Property(m => m.Title).IsRequired().HasMaxLength(200);
            entity.Property(m => m.OriginalFileName).IsRequired().HasMaxLength(255);
            entity.Property(m => m.BlobStoragePath).IsRequired().HasMaxLength(500);
            entity.Property(m => m.StorageTier).HasMaxLength(20).HasDefaultValue("Hot");
            entity.Property(m => m.TokensConsumed).HasColumnType("decimal(18,2)");
            entity.Property(m => m.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(m => m.LastAccessedAt).HasDefaultValueSql("GETUTCDATE()");
            
            // Configure relationship with User
            entity.HasOne(m => m.User)
                .WithMany(u => u.Meetings)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.NoAction); // Prevent multiple cascade paths issue
        });
        
        // Configure MeetingHistory entity
        modelBuilder.Entity<MeetingHistory>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.HasIndex(h => new { h.MeetingId, h.CreatedAt }); // For efficient history queries
            entity.Property(h => h.OperationType).IsRequired().HasMaxLength(50);
            entity.Property(h => h.Description).IsRequired().HasMaxLength(500);
            entity.Property(h => h.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            
            // Configure relationship with Meeting
            entity.HasOne(h => h.Meeting)
                .WithMany(m => m.History)
                .HasForeignKey(h => h.MeetingId)
                .OnDelete(DeleteBehavior.Cascade); // When meeting deleted, delete its history
                
            // Configure relationship with User (optional, for operations performed by users)
            entity.HasOne(h => h.PerformedBy)
                .WithMany()
                .HasForeignKey(h => h.PerformedByUserId)
                .OnDelete(DeleteBehavior.NoAction); // Prevent cascade conflict
        });
        
        // Configure enums
        modelBuilder.Entity<Meeting>()
            .Property(m => m.Status)
            .HasConversion<string>(); // Store enum as string for readability
    }
}
