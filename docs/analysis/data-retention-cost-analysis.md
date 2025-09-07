# Data Retention Policy & Cost Analysis

## File Size Analysis for 60-Minute Meeting Recordings

Based on our sample audio files, here are the projected file sizes for a typical 60-minute meeting:

| Format | Size (MB) | Compression | Use Case |
|--------|-----------|-------------|----------|
| **MP3** | ~82 MB | Lossy | Most common format |
| **M4A** | ~59 MB | Lossy | Apple devices |
| **OGG** | ~57 MB | Lossy | Open source |
| **FLAC** | ~128 MB | Lossless | High quality |
| **WAV** | ~300-600 MB | Uncompressed | Professional recordings |

**Key Insights:**
- **Typical case**: 60-80 MB per meeting (MP3/M4A)
- **Worst case**: 600 MB - 1 GB (high-quality WAV)
- **File limit**: 1 GB (needs verification in code)

## Azure Storage Cost Analysis

### Storage Costs (Azure Blob Storage - Hot Tier)
- **Hot Tier**: $0.0184 per GB per month
- **Cool Tier**: $0.01 per GB per month (access charges apply)
- **Archive Tier**: $0.00099 per GB per month (higher access costs)

### Cost Scenarios for Meeting Storage

#### Scenario 1: Typical User (MP3/M4A files)
- Average file size: 70 MB per meeting
- Monthly meetings: 10 meetings
- Monthly storage: 700 MB = 0.7 GB
- **Monthly cost**: $0.0184 × 0.7 = **$0.013/month**

#### Scenario 2: Heavy User (Mixed formats)
- Average file size: 150 MB per meeting
- Monthly meetings: 20 meetings
- Monthly storage: 3 GB
- **Monthly cost**: $0.0184 × 3 = **$0.055/month**

#### Scenario 3: Enterprise User (High-quality WAV)
- Average file size: 400 MB per meeting
- Monthly meetings: 50 meetings
- Monthly storage: 20 GB
- **Monthly cost**: $0.0184 × 20 = **$0.368/month**

### Retention Period Cost Impact

For a typical user storing 0.7 GB monthly:

| Retention Period | Cumulative Storage | Monthly Cost |
|------------------|-------------------|--------------|
| **30 days** | 0.7 GB | $0.013 |
| **90 days** | 2.1 GB | $0.039 |
| **180 days** | 4.2 GB | $0.077 |
| **365 days** | 8.4 GB | $0.155 |

## Competitive Analysis

### Meeting Transcription Services

#### Otter.ai
- **Storage**: "Unlimited" cloud storage for paid plans
- **Retention**: Permanent storage (no deletion policy mentioned)
- **Pricing**: $16.99/month Pro, $30/month Business

#### Rev.com
- **Storage**: Files stored "indefinitely"
- **Retention**: No automatic deletion
- **Pricing**: Pay-per-minute ($1.50/min for transcription)

#### Zoom
- **Storage**: Cloud recordings included in subscription
- **Retention**: Varies by plan (120 days to unlimited)
- **Pricing**: $14.99-$19.99/month per user

#### Microsoft Teams
- **Storage**: SharePoint/OneDrive integration
- **Retention**: Based on organization's SharePoint retention
- **Pricing**: Part of Microsoft 365 subscription

#### Google Meet
- **Storage**: Google Drive integration
- **Retention**: Based on Google Drive storage quotas
- **Pricing**: Part of Google Workspace

### Industry Standards
- Most services offer **unlimited** or **very long-term** storage for paid users
- Storage costs are typically absorbed into subscription pricing
- Users expect their meeting data to persist "indefinitely"

## Recommendations

### Storage Strategy
1. **Hot Tier**: For recent meetings (0-30 days)
2. **Cool Tier**: For older meetings (30-180 days)
3. **Archive Tier**: For long-term storage (180+ days)

### Retention Policy Options

#### Option 1: Competitive Parity (Recommended)
- **Free/Demo**: No persistent storage (current behavior)
- **Paid Users**: 365+ days retention
- **Cost Impact**: ~$0.15/month for typical user
- **Business Justification**: Competitive with industry standards

#### Option 2: Tiered Retention
- **Basic Plan**: 90 days retention
- **Pro Plan**: 365 days retention
- **Enterprise**: Unlimited retention
- **Cost Impact**: $0.04-$0.15/month per user

#### Option 3: Usage-Based Storage
- **Storage Quota**: Include X GB in subscription
- **Overage Charges**: $0.50/GB per month for additional storage
- **User Control**: Users manage their own retention

## Business Model Implications

### Token-Only Pricing Model (No Subscriptions)
- Users pay only for AI processing (OpenAI tokens)
- No recurring revenue to offset storage costs
- Storage becomes a **pure operational cost**
- Need to factor storage costs into token pricing

### Pricing Strategy Options

#### Option 1: Token Price Increase (Recommended)
- **Current token cost**: ~$0.03-0.06 per minute of transcription
- **Storage cost**: ~$0.15/month for typical user (10 meetings)
- **Solution**: Increase token pricing by 10-15% to cover storage costs
- **Impact**: Minimal price increase, users get persistent storage value

#### Option 2: Storage-Inclusive Token Packages
- **Token Bundles**: Sell tokens in packages that include storage
- **Example**: "100 minutes package" = tokens + 90-day storage
- **Benefit**: Clear value proposition, predictable costs

#### Option 3: Separate Storage Fees
- **Base Service**: Pay-per-token for processing only
- **Storage Add-on**: Optional $2-5/month for persistent storage
- **Risk**: Complexity, may reduce adoption

#### Option 4: Limited Free Storage + Premium
- **Free Tier**: 30-day storage included with token purchase
- **Premium Storage**: Pay extra for extended retention (90/180/365 days)
- **Hybrid approach**: Balance user value with cost recovery

### Cost Recovery Analysis

#### Current Token Economics
- **Processing cost**: $0.03-0.06 per minute
- **Markup**: Likely 2-3x for profit margin
- **Revenue per meeting**: $1.80-3.60 (60-minute meeting)

#### Storage Cost Impact
- **Monthly storage cost**: $0.15 per user
- **Annual storage cost**: $1.80 per user
- **Break-even**: 1 meeting per year covers storage costs
- **Conclusion**: Storage costs are manageable with slight token price adjustment

### Recommended Pricing Strategy

#### Immediate Implementation (Sprint 6)
1. **Increase token pricing by 10-15%** to cover storage costs
2. **Include 365-day storage** as part of token purchase value
3. **Market as premium feature**: "Your meetings are safely stored for a full year"
4. **No separate storage fees**: Keep pricing simple

#### Justification
- Storage costs are minimal compared to processing costs
- Users get significant value from persistent storage
- Maintains simple pricing model
- Competitive with subscription-based services

#### Token Package Examples
- **Before**: 60-minute meeting = $3.00 in tokens
- **After**: 60-minute meeting = $3.30 in tokens (includes 1-year storage)
- **Value proposition**: "Process and store your meeting for just $3.30"

## Implementation Recommendations

### Immediate (Sprint 6)
1. Implement 365-day retention for paid users
2. Use Azure Blob Storage Hot tier initially
3. Display retention policy in Terms of Service
4. No user-configurable retention (keep it simple)

### Future Enhancements
1. Implement storage tier migration (Hot → Cool → Archive)
2. User-configurable retention settings
3. Storage usage dashboard
4. Export/download functionality before deletion

### Technical Requirements
- Automated cleanup jobs for expired content
- User notifications before deletion (30-day warning)
- Audit logging for compliance
- Backup strategy for critical user data

## Cost Summary

**Bottom Line**: With token-only pricing, storage costs need to be factored into token pricing. Recommend **10-15% token price increase** to cover persistent storage costs while providing significant user value.

**Storage Cost Recovery**:
- Monthly storage: ~$0.15/user
- Annual storage: ~$1.80/user  
- Token price increase: 10-15% covers storage + provides user value
- Break-even: 1 meeting per year covers storage costs

**Pricing Impact**:
- 60-minute meeting: $3.00 → $3.30 (includes 1-year storage)
- Value proposition: Persistent storage becomes part of the service value
- Competitive advantage: "Your meetings stored safely for a full year"
