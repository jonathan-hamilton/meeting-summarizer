# Database Migration Safety Guidelines

## CRITICAL: Data Loss Prevention

**🚨 NEVER include destructive SQL in migrations for production or development environments with real data!**

### ❌ Prohibited Migration Patterns:
```csharp
// NEVER DO THIS:
migrationBuilder.Sql("DELETE FROM [TableName]");
migrationBuilder.Sql("TRUNCATE TABLE [TableName]");
migrationBuilder.Sql("DROP TABLE [TableName]");
```

### ✅ Safe Migration Practices:
1. **Use conditional checks before destructive operations**
2. **Always backup data before structural changes**
3. **Use separate data migration scripts for production**
4. **Test migrations on empty databases first**

### 🔧 Recommended Approach for Schema Changes:
```csharp
// Safe approach - preserve data during schema changes
if (!migrationBuilder.ActiveProvider.Contains("InMemory"))
{
    // Only run on real databases, not in-memory test databases
    // Add conditional logic here
}
```

### 🛡️ Migration Review Checklist:
- [ ] No unconditional DELETE statements
- [ ] No TRUNCATE statements  
- [ ] Data preservation logic included
- [ ] Tested on development database with sample data
- [ ] Peer reviewed for destructive operations

### 📋 Current Issue:
The migration `20250928222033_RemoveBatchTranscriptionJobAndCleanData.cs` contains:
- `DELETE FROM [TranscriptSegments]`
- `DELETE FROM [TokenRefunds]`

This migration should be modified to preserve existing data or run conditionally.

### 🚀 Next Steps:
1. Create backup procedures before migrations
2. Review all pending migrations for destructive operations
3. Implement migration validation in CI/CD pipeline
4. Add data seeding for development environment