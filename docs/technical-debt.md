# Technical Debt Tracking

## Production Blockers

### Email Formatting Issue ⚠️ **CRITICAL**
**Status**: PRODUCTION BLOCKER - Must fix before deployment  
**Added**: October 2, 2025  
**Story**: S6.9 DevOps Deployment  

**Issue**: Transcript emails lose line break formatting when sent via EmailCompositionDialog  
- EmailCompositionDialog shows proper formatting with line breaks  
- Received emails appear as single block of text without line breaks  
- Affects both transcript and summary email functionality  

**Root Cause**: Line break format mismatch or Content-Type configuration  
- Frontend stores content with `\n` line breaks  
- Email service may require `\r\n` for plain text emails  
- OR email needs to be sent as HTML with `<br>` tags instead of plain text  

**Impact**: 
- Poor user experience for primary sharing feature  
- Professional communication degraded (unreadable email content)  
- Key workflow (transcript → email) is broken  

**Fix Options**:
1. **Convert to HTML Email**: Change Content-Type to `text/html` and convert `\n` to `<br>` tags  
2. **Fix Plain Text**: Ensure line breaks are `\r\n` in email service  
3. **Pre-format Content**: Add proper spacing and formatting before email sending  

**Files to Investigate**:
- Backend email service implementation  
- EmailCompositionDialog content processing  
- Email Content-Type configuration  

**Priority**: P0 - Must be resolved before production deployment

---

## Other Technical Debt

### ✅ User Interface Stability Issues - RESOLVED
**Status**: ✅ RESOLVED via S7.10  
**Added**: October 25, 2025  
**Resolved**: October 25, 2025  
**Story**: S7.10 UI Stability & Authentication Dialog Fixes

**Issues Resolved**:
- **Legal Agreement Dialog Timing**: Dialog was showing for unauthenticated users
- **Edit Profile Form Validation**: HTML5 validation preventing form submission
- **Profile Data Synchronization**: Cache prioritization causing stale data display
- **JWT Token Parsing**: Email addresses being parsed as names

**Impact Eliminated**: 
- User confusion from inappropriate dialog display
- Complete Edit Profile functionality breakdown
- Inconsistent profile data across application
- Improper name display for email-based user accounts

**Resolution**: Comprehensive UI stability fixes implemented with proper authentication guards, dynamic form validation, data synchronization, and robust token parsing

*Additional items to be added as identified*
