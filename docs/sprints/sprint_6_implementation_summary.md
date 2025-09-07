# Sprint 6 Implementation Requirements - Finalized

## File Size Limits - VERIFIED ✅

### Backend Validation (C#)
- **Location**: `MeetingSummarizer.Api\Helpers\AudioFileValidator.cs`
- **Max File Size**: `1024L * 1024 * 1024` = **1GB**
- **Min File Size**: `1024` bytes = **1KB**
- **Implementation**: Consistent across AudioFileValidator and FilePreProcessingService

### Frontend Validation (TypeScript)
- **Location**: `frontend\src\components\FileUpload.tsx`
- **Max File Size**: `1024 * 1024 * 1024` = **1GB** (default prop)
- **Display**: "Maximum file size: 1 GB" shown to users
- **Validation**: react-dropzone handles client-side validation with backend confirmation

### File Size Analysis for 60-Minute Meetings
| Format | Projected Size | Fits in 1GB Limit? |
|--------|---------------|-------------------|
| **MP3** | ~82 MB | ✅ Yes (12x smaller) |
| **M4A** | ~59 MB | ✅ Yes (17x smaller) |
| **OGG** | ~57 MB | ✅ Yes (18x smaller) |
| **FLAC** | ~128 MB | ✅ Yes (8x smaller) |
| **WAV** | ~300-600 MB | ✅ Yes (1.5-3x smaller) |

**Conclusion**: 1GB limit is appropriate and supports all use cases including worst-case high-quality WAV files.

## Token Pricing Strategy - FINALIZED

### Cost Structure
- **Storage Cost**: ~$0.15/month per typical user
- **Token Price Increase**: 10-15% to cover persistent storage
- **Example**: 60-minute meeting: $3.00 → $3.30 (includes 1-year storage)

### Value Proposition
- **User Message**: "Your meetings stored safely for 365 days"
- **Competitive Advantage**: Persistent storage included with token purchase
- **Simplicity**: No separate storage fees or subscriptions

### Business Model
- **Token-Only Pricing**: Pay per use for AI processing
- **Storage Included**: 365-day retention bundled with tokens
- **Break-Even**: 1 meeting per year covers annual storage costs

## Data Retention Policy - APPROVED

### Retention Timeline
- **Paid Users**: 365 days (industry competitive standard)
- **Demo Users**: No persistent storage (current behavior)
- **Storage Tiers**: Hot (0-30d) → Cool (30-180d) → Archive (180-365d)

### Implementation Details
- **Automated Cleanup**: Delete files after 365 days
- **User Notifications**: 30-day warning before deletion
- **Policy Location**: Terms of Service (not footer)
- **Admin Tools**: Audit logging and manual retention management

## Footer Requirements - CONFIRMED

### Required Content
- **Copyright**: "© 2025 Vertec Solutions LLC"
- **Support Contact**: "support@meeting-summary.io" (placeholder until domain active)
- **Legal Links**: Terms of Service, Privacy Policy
- **Design**: Responsive, accessible, consistent styling

### Future Elements (Deferred)
- **Social Media**: Prepared section for future implementation
- **Legal Jurisdiction**: Generic terms acceptable
- **Data Retention**: Displayed in Terms of Service only

## Azure Storage Requirements

### Infrastructure Setup
- **Primary Storage**: Azure Blob Storage Hot tier
- **Database**: Azure SQL Database or Cosmos DB for metadata
- **Security**: Azure AD authentication, encryption at rest/transit
- **Access Control**: Logical isolation per user, least-privilege principles

### Cost Management
- **Monthly Costs**: 
  - Typical user: $0.15/month
  - Heavy user: $0.37/month
  - Enterprise: $1-2/month
- **Tier Migration**: Automatic Hot → Cool → Archive transition
- **Monitoring**: Usage tracking and cost alerts

## Integration Requirements

### Payment System (Stripe)
- **Token Packages**: Include storage costs in pricing
- **Webhooks**: Payment confirmation and balance updates
- **Messaging**: "365-day storage included" in purchase flow
- **Admin Tools**: Transaction reconciliation and audit trails

### User Experience
- **Dashboard**: Token balance + meeting history + storage usage
- **Upload Progress**: Real-time progress for paid users
- **Meeting History**: Persistent access to all processed files
- **Export/Download**: Before retention expiry

### Accessibility Compliance
- **WCAG 2.1 Level AA**: Full compliance across all components
- **Testing**: Automated (axe-core) + manual testing
- **Assistive Technology**: NVDA, JAWS, VoiceOver compatibility
- **Focus Management**: Proper keyboard navigation

## Sprint 6 Success Criteria

### Technical Deliverables
1. ✅ File size limits verified and appropriate
2. 🔄 Azure storage infrastructure operational
3. 🔄 Token pricing updated with storage costs
4. 🔄 365-day retention policy implemented
5. 🔄 Footer content with legal information
6. 🔄 Accessibility compliance achieved

### Business Deliverables
1. 🔄 Token-storage pricing model deployed
2. 🔄 Competitive persistent storage advantage
3. 🔄 User retention through meeting history
4. 🔄 Compliance foundation for enterprise sales
5. 🔄 Simplified pricing without subscriptions

### User Value Delivered
- **Persistent Storage**: Meeting results saved for full year
- **Simple Pricing**: One token purchase covers processing + storage
- **Professional Experience**: Meeting history, progress tracking
- **Accessible Design**: Inclusive for all users
- **Trust & Support**: Clear legal information and support contact

## Next Steps

1. **Implement Azure Storage**: S6.1 - Storage and database setup
2. **Update Token Pricing**: S6.2 - Stripe integration with storage costs
3. **Build Meeting History**: S6.3 - Persistent upload progress and history
4. **Accessibility Audit**: S6.4 - WCAG compliance implementation
5. **Footer Implementation**: S6.5 - Legal information and support contact

## Technical Debt Resolved

- ✅ File size validation confirmed across frontend/backend
- ✅ Storage cost analysis completed with competitive research
- ✅ Business model clarified (token-only, no subscriptions)
- ✅ Data retention policy defined with cost recovery strategy
- ✅ Footer requirements specified with future-ready structure

**Sprint 6 is ready for implementation with all requirements finalized and technical constraints verified.**
