import type { ChatContext } from '../stores/chatStore';

/**
 * Enhanced context detection service for Phase 2
 * Provides comprehensive app state context to AI assistant
 */
export class ChatContextService {
  /**
   * Build comprehensive chat context from all available sources
   */
  static buildEnhancedContext(): ChatContext {
    return {
      // Basic context
      currentPage: this.getCurrentPage(),
      hasUploadedFile: this.hasUploadedFile(),
      processingStatus: this.getProcessingStatus(),
      hasTranscript: this.hasTranscript(),
      speakersDetected: this.getSpeakersDetected(),
      speakersMapped: this.areSpeakersMapped(),
      hasSummary: this.hasSummary(),
      isAuthenticated: this.isUserAuthenticated(),
      recentError: this.getRecentError(),
      
      // Enhanced Phase 2 context
      ...this.getUploadContext(),
      ...this.getTranscriptContext(),
      ...this.getSummaryContext(),
      ...this.getUIContext(),
      ...this.getErrorContext(),
    };
  }

  /**
   * Get current page context
   */
  private static getCurrentPage(): string {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    if (path.includes('/history')) return 'history';
    if (path.includes('/app')) return 'app';
    if (hash.includes('transcript')) return 'app-transcript';
    if (hash.includes('summary')) return 'app-summary';
    
    return path.replace('/', '') || 'home';
  }

  /**
   * Check if user has uploaded a file
   */
  private static hasUploadedFile(): boolean {
    // Check for upload state in various possible stores
    const uploadElements = document.querySelectorAll('[data-testid*="upload"]');
    const fileElements = document.querySelectorAll('input[type="file"]');
    const uploadedIndicators = document.querySelectorAll('[data-testid*="uploaded"]');
    
    return uploadElements.length > 0 || fileElements.length > 0 || uploadedIndicators.length > 0;
  }

  /**
   * Get processing status
   */
  private static getProcessingStatus(): string | undefined {
    // Look for processing indicators
    const processingElements = document.querySelectorAll('[data-testid*="processing"]');
    const statusElements = document.querySelectorAll('[data-testid*="status"]');
    const progressElements = document.querySelectorAll('.MuiLinearProgress-root, .MuiCircularProgress-root');
    
    if (processingElements.length > 0) return 'processing';
    if (progressElements.length > 0) return 'in-progress';
    if (statusElements.length > 0) return 'status-available';
    
    return undefined;
  }

  /**
   * Check if transcript exists
   */
  private static hasTranscript(): boolean {
    const transcriptElements = document.querySelectorAll('[data-testid*="transcript"]');
    const transcriptContent = document.querySelectorAll('.transcript, [class*="transcript"]');
    
    return transcriptElements.length > 0 || transcriptContent.length > 0;
  }

  /**
   * Get number of detected speakers
   */
  private static getSpeakersDetected(): number {
    const speakerElements = document.querySelectorAll('[data-testid*="speaker"], .speaker');
    const speakerLabels = document.querySelectorAll('[class*="Speaker"], [id*="speaker"]');
    
    return Math.max(speakerElements.length, speakerLabels.length);
  }

  /**
   * Check if speakers are mapped
   */
  private static areSpeakersMapped(): boolean {
    const mappingElements = document.querySelectorAll('[data-testid*="mapping"]');
    const mappedElements = document.querySelectorAll('[data-testid*="mapped"]');
    
    return mappingElements.length > 0 || mappedElements.length > 0;
  }

  /**
   * Check if summary exists
   */
  private static hasSummary(): boolean {
    const summaryElements = document.querySelectorAll('[data-testid*="summary"]');
    const summaryContent = document.querySelectorAll('.summary, [class*="summary"]');
    
    return summaryElements.length > 0 || summaryContent.length > 0;
  }

  /**
   * Check if user is authenticated
   */
  private static isUserAuthenticated(): boolean {
    // Check for auth indicators
    const userElements = document.querySelectorAll('[data-testid*="user"]');
    const profileElements = document.querySelectorAll('[data-testid*="profile"]');
    const authTokens = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    return userElements.length > 0 || profileElements.length > 0 || !!authTokens;
  }

  /**
   * Get recent error
   */
  private static getRecentError(): string | undefined {
    // Look for error elements
    const errorElements = document.querySelectorAll('.MuiAlert-standardError, [data-testid*="error"], .error');
    const errorMessages = Array.from(errorElements).map(el => el.textContent).filter(Boolean);
    
    if (errorMessages.length > 0) {
      return errorMessages[0] || undefined;
    }
    
    return undefined;
  }

  /**
   * Get enhanced upload context
   */
  private static getUploadContext() {
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    const uploadButtons = document.querySelectorAll('[data-testid*="upload"], button:contains("Upload")');
    
    return {
      hasFileInput: fileInputs.length > 0,
      fileInputEnabled: Array.from(fileInputs).some(input => !input.disabled),
      uploadButtonsVisible: uploadButtons.length > 0,
      dragDropAvailable: document.querySelectorAll('[data-testid*="drag"], [class*="drop"]').length > 0,
    };
  }

  /**
   * Get enhanced transcript context
   */
  private static getTranscriptContext() {
    const transcriptSections = document.querySelectorAll('[data-testid*="transcript"]');
    const speakerElements = document.querySelectorAll('[data-testid*="speaker"]');
    const timestampElements = document.querySelectorAll('[data-testid*="timestamp"], .timestamp');
    
    return {
      transcriptSections: transcriptSections.length,
      visibleSpeakers: speakerElements.length,
      hasTimestamps: timestampElements.length > 0,
      hasScrollableContent: document.querySelectorAll('.transcript-scroll, [class*="scroll"]').length > 0,
    };
  }

  /**
   * Get enhanced summary context
   */
  private static getSummaryContext() {
    const summaryElements = document.querySelectorAll('[data-testid*="summary"]');
    const actionItemElements = document.querySelectorAll('[data-testid*="action"], .action-item');
    const emailButtons = document.querySelectorAll('[data-testid*="email"], button:contains("Email")');
    
    return {
      summarySections: summaryElements.length,
      actionItemsCount: actionItemElements.length,
      emailButtonsAvailable: emailButtons.length,
      summaryExpanded: document.querySelectorAll('[aria-expanded="true"]').length > 0,
    };
  }

  /**
   * Get UI context
   */
  private static getUIContext() {
    const openDialogs = document.querySelectorAll('.MuiDialog-root[style*="opacity: 1"]');
    const activeDialogs = Array.from(openDialogs).map(dialog => 
      dialog.querySelector('[data-testid]')?.getAttribute('data-testid') || 'unknown'
    );
    
    return {
      openDialogsCount: openDialogs.length,
      activeDialogs,
      hasScrollPosition: window.scrollY > 100,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  /**
   * Get error context
   */
  private static getErrorContext() {
    const errorAlerts = document.querySelectorAll('.MuiAlert-standardError');
    const warningAlerts = document.querySelectorAll('.MuiAlert-standardWarning');
    const infoAlerts = document.querySelectorAll('.MuiAlert-standardInfo');
    
    return {
      errorAlertsCount: errorAlerts.length,
      warningAlertsCount: warningAlerts.length,
      infoAlertsCount: infoAlerts.length,
      hasNotifications: document.querySelectorAll('.MuiSnackbar-root').length > 0,
    };
  }

  /**
   * Detect user confusion or stuck workflows
   */
  static detectUserConfusion(): {
    isConfused: boolean;
    reasons: string[];
    suggestions: string[];
  } {
    const reasons: string[] = [];
    const suggestions: string[] = [];

    // Check for error states
    if (this.getRecentError()) {
      reasons.push('Recent error detected');
      suggestions.push('Help resolve the error');
    }

    // Check for incomplete workflows
    if (this.hasUploadedFile() && !this.hasTranscript()) {
      reasons.push('File uploaded but no transcript');
      suggestions.push('Check processing status');
    }

    if (this.hasTranscript() && !this.areSpeakersMapped() && this.getSpeakersDetected() > 1) {
      reasons.push('Multiple speakers detected but not mapped');
      suggestions.push('Guide speaker mapping process');
    }

    if (this.hasTranscript() && !this.hasSummary()) {
      reasons.push('Transcript available but no summary');
      suggestions.push('Suggest summary generation');
    }

    // Check for UI confusion
    const openDialogs = document.querySelectorAll('.MuiDialog-root[style*="opacity: 1"]').length;
    if (openDialogs > 1) {
      reasons.push('Multiple dialogs open');
      suggestions.push('Help close unnecessary dialogs');
    }

    return {
      isConfused: reasons.length > 0,
      reasons,
      suggestions,
    };
  }
}