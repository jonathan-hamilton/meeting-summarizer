import apiService from './apiService';
import type { MeetingSummary, SpeakerMapping, SpeakerSegment } from '../types';

export interface TranscriptEmailData {
  transcriptionId: string;
  fileName: string;
  speakerSegments: SpeakerSegment[];
  transcribedText: string;
}

export interface SendEmailRequest {
  recipients: string[];
  subject: string;
  content: string;
  plainTextContent?: string;
  meetingSummary?: MeetingSummary;
  speakerMappings?: SpeakerMapping[];
  transcriptData?: TranscriptEmailData;
  includeTranscript?: boolean;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
  recipientsCount: number;
  sentAt: string;
  errorDetails?: string;
}

export interface EmailValidationRequest {
  emailAddresses: string[];
}

export interface EmailValidationResponse {
  isValid: boolean;
  invalidEmails: string[];
  validEmailCount: number;
  message: string;
}

export interface GenerateTemplateRequest {
  summary: MeetingSummary;
  speakerMappings?: SpeakerMapping[];
}

export class EmailService {
  /**
   * Send an email with meeting summary
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      // Email sending can take longer than the default 10s timeout, especially with transcript data
      const response = await apiService.post<SendEmailResponse>('/api/Email/send', request, {
        timeout: 30000 // 30 seconds timeout for email operations
      });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        console.error('❌ Failed to send email:', response.message);
        return {
          success: false,
          message: response.message || 'Failed to send email',
          recipientsCount: 0,
          sentAt: new Date().toISOString(),
          errorDetails: response.errors?.join(', ') || 'Unknown error'
        };
      }
    } catch (error: any) {
      console.error('❌ Failed to send email:', error);
      
      // Handle network or other errors
      return {
        success: false,
        message: 'Failed to send email: Network error',
        recipientsCount: 0,
        sentAt: new Date().toISOString(),
        errorDetails: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate HTML email template for meeting summary
   */
  async generateEmailTemplate(request: GenerateTemplateRequest): Promise<string> {
    try {
      console.log('🎨 Generating email template for meeting summary');
      
      const response = await apiService.post<string>('/api/Email/template', request);
      
      if (response.success && response.data) {
        console.log('✅ Email template generated successfully');
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate template');
      }
    } catch (error: any) {
      console.error('❌ Failed to generate email template:', error);
      throw new Error(`Failed to generate email template: ${error.message}`);
    }
  }

  /**
   * Validate email addresses
   */
  async validateEmails(emailAddresses: string[]): Promise<EmailValidationResponse> {
    try {
      console.log('✅ Validating email addresses:', emailAddresses);
      
      const request: EmailValidationRequest = { emailAddresses };
      const response = await apiService.post<EmailValidationResponse>('/api/Email/validate', request);
      
      if (response.success && response.data) {
        console.log('✅ Email validation completed:', response.data);
        return response.data;
      } else {
        return {
          isValid: false,
          invalidEmails: emailAddresses,
          validEmailCount: 0,
          message: response.message || 'Validation failed'
        };
      }
    } catch (error: any) {
      console.error('❌ Failed to validate emails:', error);
      
      return {
        isValid: false,
        invalidEmails: emailAddresses,
        validEmailCount: 0,
        message: `Validation failed: ${error.message}`
      };
    }
  }

  /**
   * Send transcript-only email
   */
  async emailTranscript(transcriptionId: string, emailData: {
    recipients: string[];
    subject: string;
    includeTranscript: boolean;
  }): Promise<SendEmailResponse> {
    try {
      const response = await apiService.post<SendEmailResponse>(`/api/email/transcript/${transcriptionId}`, emailData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return {
          success: false,
          message: response.message || 'Failed to send transcript email',
          recipientsCount: 0,
          sentAt: new Date().toISOString(),
          errorDetails: response.errors?.join(', ') || 'Unknown error'
        };
      }
    } catch (error: any) {
      console.error('❌ Failed to send transcript email:', error);
      
      return {
        success: false,
        message: 'Failed to send transcript email: Network error',
        recipientsCount: 0,
        sentAt: new Date().toISOString(),
        errorDetails: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a professional email subject for meeting summaries
   */
  createEmailSubject(meetingDate?: string): string {
    const date = meetingDate || new Date().toLocaleDateString();
    return `Meeting Summary - ${date}`;
  }

  /**
   * Create email content by combining meeting summary data
   */
  async createEmailContent(
    summary: MeetingSummary, 
    speakerMappings?: SpeakerMapping[]
  ): Promise<string> {
    try {
      // Generate HTML template using the API
      const template = await this.generateEmailTemplate({
        summary,
        speakerMappings
      });
      
      return template;
    } catch (error) {
      console.error('Failed to generate template, falling back to simple content:', error);
      
      // Fallback to simple text content if template generation fails
      return this.createSimpleEmailContent(summary, speakerMappings);
    }
  }

  /**
   * Create simple text-based email content (fallback)
   */
  private createSimpleEmailContent(
    summary: MeetingSummary, 
    speakerMappings?: SpeakerMapping[]
  ): string {
    let content = '<h1>Meeting Summary</h1>\n\n';
    
    if (summary.meetingOverview) {
      content += '<h2>Meeting Overview</h2>\n';
      content += `<p>${summary.meetingOverview.replace(/\n/g, '<br>')}</p>\n\n`;
    }
    
    if (summary.actionItemsByRole && summary.actionItemsByRole.length > 0) {
      content += '<h2>Action Items by Role</h2>\n';
      summary.actionItemsByRole.forEach(roleGroup => {
        if (roleGroup.actionItems && roleGroup.actionItems.length > 0) {
          content += `<h3>${roleGroup.speakerName} (${roleGroup.speakerRole})</h3>\n`;
          content += '<ul>\n';
          roleGroup.actionItems.forEach(item => {
            content += `<li>${item.description}</li>\n`;
          });
          content += '</ul>\n';
        }
      });
    }
    
    if (summary.unassignedActionItems && summary.unassignedActionItems.length > 0) {
      content += '<h2>Unassigned Action Items</h2>\n';
      content += '<ul>\n';
      summary.unassignedActionItems.forEach(item => {
        content += `<li>${item.description}</li>\n`;
      });
      content += '</ul>\n';
    }
    
    if (speakerMappings && speakerMappings.length > 0) {
      content += '<h2>Meeting Participants</h2>\n';
      content += '<ul>\n';
      speakerMappings.forEach(speaker => {
        if (speaker.name) {
          content += `<li>${speaker.name}`;
          if (speaker.email) {
            content += ` (${speaker.email})`;
          }
          content += '</li>\n';
        }
      });
      content += '</ul>\n';
    }
    
    content += '<hr>\n';
    content += '<p><em>This meeting summary was automatically generated by Meeting-Summary.io.</em></p>\n';
    
    return content;
  }
}

// Export singleton instance
export const emailService = new EmailService();
