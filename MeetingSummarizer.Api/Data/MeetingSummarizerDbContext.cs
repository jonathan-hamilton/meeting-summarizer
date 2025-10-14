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
    
    /// <summary>
    /// Token purchases made by users
    /// </summary>
    public DbSet<TokenPurchase> TokenPurchases { get; set; } = null!;
    
    /// <summary>
    /// Token usage for meeting processing
    /// </summary>
    public DbSet<TokenUsage> TokenUsages { get; set; } = null!;
    
    /// <summary>
    /// Webhook events for replay attack prevention
    /// </summary>
    public DbSet<WebhookEvent> WebhookEvents { get; set; } = null!;
    
    /// <summary>
    /// Token refunds for failed transcriptions
    /// </summary>
    public DbSet<TokenRefund> TokenRefunds { get; set; } = null!;

    /// <summary>
    /// Fast transcription jobs for all meetings (Azure Fast Transcription API)
    /// </summary>
    public DbSet<FastTranscriptionJob> FastTranscriptionJobs { get; set; } = null!;

    /// <summary>
    /// Parsed transcript segments for efficient storage and search
    /// </summary>
    public DbSet<TranscriptSegment> TranscriptSegments { get; set; } = null!;
    
    /// <summary>
    /// Saved summaries created by users
    /// </summary>
    public DbSet<SavedSummary> SavedSummaries { get; set; } = null!;
    
    /// <summary>
    /// Action items within saved summaries
    /// </summary>
    public DbSet<SavedActionItem> SavedActionItems { get; set; } = null!;
    
    /// <summary>
    /// Invitation codes for development environment access control
    /// </summary>
    public DbSet<InvitationCode> InvitationCodes { get; set; } = null!;
    
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
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()")
                .HasConversion(
                    v => v,
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            entity.Property(u => u.LastActivityAt).HasDefaultValueSql("GETUTCDATE()")
                .HasConversion(
                    v => v,
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
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
            entity.Property(m => m.CreatedAt).HasDefaultValueSql("GETUTCDATE()").HasConversion(
                v => v, // To database: DateTime as-is (already UTC)
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)); // From database: Ensure Kind = UTC
            entity.Property(m => m.LastAccessedAt).HasDefaultValueSql("GETUTCDATE()").HasConversion(
                v => v, // To database: DateTime as-is (already UTC)
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)); // From database: Ensure Kind = UTC
            entity.Property(m => m.CompletedAt).HasConversion(
                v => v, // To database: DateTime as-is (already UTC)
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : (DateTime?)null); // From database: Ensure Kind = UTC
            
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
        
        // Configure TokenPurchase entity
        modelBuilder.Entity<TokenPurchase>(entity =>
        {
            entity.HasKey(tp => tp.Id);
            entity.HasIndex(tp => new { tp.UserId, tp.PurchaseDate }); // For efficient user purchase queries
            entity.HasIndex(tp => tp.PaymentId).IsUnique(); // Ensure unique payment IDs
            entity.HasIndex(tp => tp.StripeSessionId); // For Stripe webhook lookups
            entity.Property(tp => tp.AmountPaid).HasColumnType("decimal(10,2)");
            entity.Property(tp => tp.PaymentStatus).IsRequired().HasMaxLength(50);
            entity.Property(tp => tp.PurchaseDate).HasDefaultValueSql("GETUTCDATE()");
            
            // Configure relationship with User
            entity.HasOne(tp => tp.User)
                .WithMany(u => u.TokenPurchases)
                .HasForeignKey(tp => tp.UserId)
                .OnDelete(DeleteBehavior.NoAction); // Prevent cascade conflicts
        });
        
        // Configure TokenUsage entity
        modelBuilder.Entity<TokenUsage>(entity =>
        {
            entity.HasKey(tu => tu.Id);
            entity.HasIndex(tu => new { tu.UserId, tu.UsageDate }); // For efficient user usage queries
            entity.HasIndex(tu => tu.MeetingId); // For meeting-specific usage lookups
            entity.Property(tu => tu.CostInUsd).HasColumnType("decimal(10,2)");
            entity.Property(tu => tu.VolumeDiscountApplied).HasColumnType("decimal(5,2)");
            entity.Property(tu => tu.ProcessingType).IsRequired().HasMaxLength(100);
            entity.Property(tu => tu.UsageDate).HasDefaultValueSql("GETUTCDATE()");
            
            // Configure relationship with User
            entity.HasOne(tu => tu.User)
                .WithMany(u => u.TokenUsages)
                .HasForeignKey(tu => tu.UserId)
                .OnDelete(DeleteBehavior.NoAction); // Prevent cascade conflicts
                
            // Configure relationship with Meeting
            entity.HasOne(tu => tu.Meeting)
                .WithMany()
                .HasForeignKey(tu => tu.MeetingId)
                .OnDelete(DeleteBehavior.NoAction); // Prevent cascade conflicts
        });
        
        // Configure FastTranscriptionJob entity
        modelBuilder.Entity<FastTranscriptionJob>(entity =>
        {
            entity.HasKey(ftj => ftj.Id);
            entity.HasIndex(ftj => ftj.UserId); // For user-specific job queries
            entity.HasIndex(ftj => ftj.MeetingId); // For meeting-specific job queries
            entity.HasIndex(ftj => ftj.Status); // For status-based filtering
            entity.HasIndex(ftj => ftj.SubmittedAt); // For chronological ordering
            entity.HasIndex(ftj => ftj.ProcessingMethod); // For processing method filtering
            
            entity.Property(ftj => ftj.FileName).IsRequired().HasMaxLength(255);
            entity.Property(ftj => ftj.Status).IsRequired().HasMaxLength(50);
            entity.Property(ftj => ftj.ProcessingMethod).IsRequired().HasMaxLength(20).HasDefaultValue("fast");
#pragma warning disable CS0618 // Type or member is obsolete
            entity.Property(ftj => ftj.ResultsJson).HasColumnType("nvarchar(max)");
#pragma warning restore CS0618 // Type or member is obsolete
            entity.Property(ftj => ftj.ErrorMessage).HasMaxLength(1000);
            entity.Property(ftj => ftj.SubmittedAt).HasDefaultValueSql("GETUTCDATE()");
            
            // Configure relationship with User
            entity.HasOne(ftj => ftj.User)
                .WithMany(u => u.FastTranscriptionJobs)
                .HasForeignKey(ftj => ftj.UserId)
                .OnDelete(DeleteBehavior.NoAction); // Prevent cascade conflicts
            
            // Configure relationship with Meeting
            entity.HasOne(ftj => ftj.Meeting)
                .WithMany(m => m.FastTranscriptionJobs)
                .HasForeignKey(ftj => ftj.MeetingId)
                .OnDelete(DeleteBehavior.NoAction); // Prevent cascade conflicts
        });

        // Configure TranscriptSegment entity
        modelBuilder.Entity<TranscriptSegment>(entity =>
        {
            entity.HasKey(ts => new { ts.JobId, ts.SegmentIndex }); // Composite primary key
            entity.HasIndex(ts => ts.JobId); // For job-specific queries
            entity.HasIndex(ts => ts.StartTime); // For time-based searches
            entity.HasIndex(ts => ts.SpeakerId); // For speaker filtering
            
            entity.Property(ts => ts.Text).IsRequired().HasMaxLength(1000);
            entity.Property(ts => ts.SpeakerId).HasMaxLength(50);
            
            // Configure relationship with FastTranscriptionJob
            entity.HasOne(ts => ts.Job)
                .WithMany(ftj => ftj.TranscriptSegments)
                .HasForeignKey(ts => ts.JobId)
                .OnDelete(DeleteBehavior.Cascade); // Segments should be deleted with the job
        });

        // Configure SavedSummary entity
        modelBuilder.Entity<SavedSummary>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasIndex(s => new { s.UserId, s.CreatedAt }); // For efficient user summary queries
            entity.HasIndex(s => s.MeetingId); // For meeting-related summary lookups
            entity.HasIndex(s => s.LastAccessedAt); // For usage tracking and cleanup
            entity.Property(s => s.Title).IsRequired().HasMaxLength(200);
            entity.Property(s => s.Description).HasMaxLength(1000);
            entity.Property(s => s.SummaryData).IsRequired().HasColumnType("nvarchar(max)");
            entity.Property(s => s.TranscriptFileName).IsRequired().HasMaxLength(255);
            entity.Property(s => s.CreatedAt).HasDefaultValueSql("GETUTCDATE()").HasConversion(
                v => v, // To database: DateTime as-is (already UTC)
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)); // From database: Ensure Kind = UTC
            entity.Property(s => s.LastModifiedAt).HasDefaultValueSql("GETUTCDATE()").HasConversion(
                v => v, // To database: DateTime as-is (already UTC)
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)); // From database: Ensure Kind = UTC
            entity.Property(s => s.LastAccessedAt).HasConversion(
                v => v, // To database: DateTime as-is (already UTC)
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : (DateTime?)null); // From database: Ensure Kind = UTC
            
            // Configure relationship with User
            entity.HasOne(s => s.User)
                .WithMany(u => u.SavedSummaries)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade); // When user deleted, delete their summaries
                
            // Configure relationship with Meeting (optional)
            entity.HasOne(s => s.Meeting)
                .WithMany()
                .HasForeignKey(s => s.MeetingId)
                .OnDelete(DeleteBehavior.SetNull); // When meeting deleted, keep summary but clear reference
        });
        
        // Configure SavedActionItem entity
        modelBuilder.Entity<SavedActionItem>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => new { a.SummaryId, a.SortOrder }); // For efficient ordered retrieval
            entity.HasIndex(a => a.AssignedTo); // For filtering by assignee
            entity.Property(a => a.Description).IsRequired().HasMaxLength(500);
            entity.Property(a => a.AssignedTo).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Confidence).HasColumnType("decimal(5,4)").HasPrecision(5, 4);
            entity.Property(a => a.CreatedAt).HasDefaultValueSql("GETUTCDATE()").HasConversion(
                v => v, // To database: DateTime as-is (already UTC)
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)); // From database: Ensure Kind = UTC
            entity.Property(a => a.LastModifiedAt).HasDefaultValueSql("GETUTCDATE()").HasConversion(
                v => v, // To database: DateTime as-is (already UTC)
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc)); // From database: Ensure Kind = UTC
            
            // Configure relationship with SavedSummary
            entity.HasOne(a => a.Summary)
                .WithMany(s => s.ActionItems)
                .HasForeignKey(a => a.SummaryId)
                .OnDelete(DeleteBehavior.Cascade); // When summary deleted, delete its action items
        });

        // Configure WebhookEvent entity
        modelBuilder.Entity<WebhookEvent>(entity =>
        {
            entity.HasKey(we => we.Id);
            entity.HasIndex(we => we.EventId).IsUnique(); // Prevent duplicate event processing
            entity.HasIndex(we => we.PaymentIntentId); // For payment intent lookups
            entity.HasIndex(we => we.ProcessedAt); // For chronological queries
            entity.HasIndex(we => new { we.EventType, we.ProcessedAt }); // For event type filtering
            
            entity.Property(we => we.EventId).IsRequired().HasMaxLength(255);
            entity.Property(we => we.EventType).IsRequired().HasMaxLength(100);
            entity.Property(we => we.PaymentIntentId).HasMaxLength(255);
            entity.Property(we => we.Status).IsRequired().HasMaxLength(50);
            entity.Property(we => we.ErrorMessage).HasMaxLength(1000);
            entity.Property(we => we.ProcessedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(we => we.RawPayload).HasColumnType("nvarchar(max)");
        });

        // Configure TokenRefund entity
        modelBuilder.Entity<TokenRefund>(entity =>
        {
            entity.HasKey(tr => tr.Id);
            entity.HasIndex(tr => tr.UserId);
            entity.HasIndex(tr => tr.RefundedAt);
            
            entity.Property(tr => tr.Reason).IsRequired().HasMaxLength(500);
            entity.Property(tr => tr.BalanceBefore).HasColumnType("decimal(18,2)");
            entity.Property(tr => tr.BalanceAfter).HasColumnType("decimal(18,2)");
            entity.Property(tr => tr.RefundedAt).HasDefaultValueSql("GETUTCDATE()");
            
            // Configure relationships
            entity.HasOne(tr => tr.User)
                .WithMany()
                .HasForeignKey(tr => tr.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure enums
        modelBuilder.Entity<Meeting>()
            .Property(m => m.Status)
            .HasConversion<string>(); // Store enum as string for readability
            
        // Configure InvitationCode entity
        modelBuilder.Entity<InvitationCode>(entity =>
        {
            entity.HasKey(ic => ic.Id);
            entity.HasIndex(ic => ic.Code).IsUnique(); // Unique code constraint for security
            entity.HasIndex(ic => ic.Email); // For email-restricted invitations
            entity.HasIndex(ic => ic.ExpiresAt); // For cleanup and validation queries
            entity.HasIndex(ic => ic.IsActive); // For active invitation queries
            entity.HasIndex(ic => new { ic.IsActive, ic.ExpiresAt }); // Composite index for validation
            
            entity.Property(ic => ic.Code).IsRequired().HasMaxLength(50);
            entity.Property(ic => ic.Email).HasMaxLength(255);
            entity.Property(ic => ic.CreatedBy).IsRequired().HasMaxLength(255);
            entity.Property(ic => ic.ExpiresAt).IsRequired();
            entity.Property(ic => ic.CreatedAt).HasDefaultValueSql("GETUTCDATE()")
                .HasConversion(
                    v => v,
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            entity.Property(ic => ic.UsedAt)
                .HasConversion(
                    v => v.HasValue ? v.Value : (DateTime?)null,
                    v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : (DateTime?)null);
            
            // Configure relationships
            entity.HasOne(ic => ic.UsedByUser)
                .WithMany()
                .HasForeignKey(ic => ic.UsedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
