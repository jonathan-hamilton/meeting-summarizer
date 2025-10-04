import type { ChatAction } from '../stores/chatStore';

/**
 * Service for executing chat actions triggered by AI responses
 * Handles navigation, scrolling, dialog opening, and process triggering
 */
export class ChatActionService {
  /**
   * Execute a chat action based on its type and target
   */
  static executeAction(action: ChatAction): void {
    console.log('Executing chat action:', action);

    switch (action.type) {
      case 'navigate':
        this.handleNavigation(action.target);
        break;
      case 'scroll':
        this.handleScrolling(action.target);
        break;
      case 'dialog':
        this.handleDialogOpening(action.target);
        break;
      case 'trigger':
        this.handleProcessTrigger(action.target);
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  /**
   * Handle navigation actions
   */
  private static handleNavigation(target: string): void {
    switch (target) {
      case 'upload':
      case 'app':
        window.location.href = '/app';
        break;
      case 'history':
      case 'meetings':
        window.location.href = '/history';
        break;
      case 'transcript':
        // Scroll to transcript section if on same page
        const transcriptSection = document.querySelector('[data-testid="transcript-display"]');
        if (transcriptSection) {
          transcriptSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Navigate to app page if not there
          window.location.href = '/app';
        }
        break;
      case 'summary':
        // Scroll to summary section if on same page
        const summarySection = document.querySelector('[data-testid="summary-display"]');
        if (summarySection) {
          summarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Navigate to app page if not there
          window.location.href = '/app';
        }
        break;
      default:
        console.warn('Unknown navigation target:', target);
    }
  }

  /**
   * Handle scrolling actions
   */
  private static handleScrolling(target: string): void {
    let element: Element | null = null;

    switch (target) {
      case 'summary-section':
      case 'summary':
        element = document.querySelector('[data-testid="summary-display"]') ||
                 document.querySelector('[id*="summary"]') ||
                 document.querySelector('.summary');
        break;
      case 'transcript-section':
      case 'transcript':
        element = document.querySelector('[data-testid="transcript-display"]') ||
                 document.querySelector('[id*="transcript"]') ||
                 document.querySelector('.transcript');
        break;
      case 'upload-section':
      case 'upload':
        element = document.querySelector('[data-testid="file-upload"]') ||
                 document.querySelector('.file-upload') ||
                 document.querySelector('#upload');
        break;
      case 'action-items':
        element = document.querySelector('[data-testid="action-items-section"]') ||
                 document.querySelector('.action-items');
        break;
      case 'speaker-mapping':
        element = document.querySelector('[data-testid="speaker-mapping"]') ||
                 document.querySelector('.speaker-mapping');
        break;
      case 'email-buttons':
        element = document.querySelector('[data-testid="email-buttons"]') ||
                 document.querySelector('.email-buttons');
        break;
      default:
        // Try to find element by ID or test-id
        element = document.querySelector(`[data-testid="${target}"]`) ||
                 document.querySelector(`#${target}`) ||
                 document.querySelector(`.${target}`);
    }

    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Add a brief highlight effect
      element.classList.add('chat-action-highlight');
      setTimeout(() => {
        element?.classList.remove('chat-action-highlight');
      }, 2000);
    } else {
      console.warn('Element not found for scrolling target:', target);
    }
  }

  /**
   * Handle dialog opening actions
   */
  private static handleDialogOpening(target: string): void {
    switch (target) {
      case 'speaker-mapping':
      case 'edit-speakers':
        // Try to find and click the speaker mapping button
        const speakerButton = document.querySelector('[data-testid="edit-mapping-button"]') as HTMLButtonElement ||
                             document.querySelector('button:contains("Edit Mapping")') as HTMLButtonElement ||
                             document.querySelector('button:contains("Map Speakers")') as HTMLButtonElement;
        speakerButton?.click();
        break;
      case 'email-composition':
      case 'email-transcript':
        // Try to find and click the email button
        const emailButton = document.querySelector('[data-testid="email-transcript-button"]') as HTMLButtonElement ||
                           document.querySelector('button:contains("Email")') as HTMLButtonElement;
        emailButton?.click();
        break;
      case 'email-summary':
        // Try to find and click the summary email button
        const summaryEmailButton = document.querySelector('[data-testid="email-summary-button"]') as HTMLButtonElement ||
                                   document.querySelector('button:contains("Email Summary")') as HTMLButtonElement;
        summaryEmailButton?.click();
        break;
      case 'token-purchase':
        // Try to find and click the token purchase button
        const tokenButton = document.querySelector('[data-testid="token-purchase-button"]') as HTMLButtonElement ||
                           document.querySelector('button:contains("Buy Tokens")') as HTMLButtonElement;
        tokenButton?.click();
        break;
      case 'user-profile':
        // Try to find and click the user profile button
        const profileButton = document.querySelector('[data-testid="user-profile-button"]') as HTMLButtonElement ||
                              document.querySelector('button:contains("Profile")') as HTMLButtonElement;
        profileButton?.click();
        break;
      default:
        console.warn('Unknown dialog target:', target);
    }
  }

  /**
   * Handle process trigger actions
   */
  private static handleProcessTrigger(target: string): void {
    switch (target) {
      case 'generate-summary':
        // Try to find and click the generate summary button
        const summaryButton = document.querySelector('[data-testid="generate-summary-button"]') as HTMLButtonElement ||
                              document.querySelector('button:contains("Generate Summary")') as HTMLButtonElement;
        summaryButton?.click();
        break;
      case 'refresh-transcript':
      case 'retry-transcription':
        // Try to find and click the refresh/retry button
        const refreshButton = document.querySelector('[data-testid="refresh-transcript-button"]') as HTMLButtonElement ||
                              document.querySelector('button:contains("Refresh")') as HTMLButtonElement ||
                              document.querySelector('button:contains("Retry")') as HTMLButtonElement;
        refreshButton?.click();
        break;
      case 'upload-file':
        // Try to trigger file upload
        const uploadInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        uploadInput?.click();
        break;
      case 'start-processing':
        // Try to find and click the start processing button
        const processButton = document.querySelector('[data-testid="start-processing-button"]') as HTMLButtonElement ||
                              document.querySelector('button:contains("Start")') as HTMLButtonElement ||
                              document.querySelector('button:contains("Process")') as HTMLButtonElement;
        processButton?.click();
        break;
      default:
        console.warn('Unknown trigger target:', target);
    }
  }
}

// Add CSS for highlight effect
const style = document.createElement('style');
style.textContent = `
  .chat-action-highlight {
    animation: chatActionHighlight 2s ease-in-out;
    border: 2px solid #1976d2 !important;
    border-radius: 4px !important;
  }
  
  @keyframes chatActionHighlight {
    0% { 
      box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
      border-color: #1976d2;
    }
    50% { 
      box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
      border-color: #1976d2;
    }
    100% { 
      box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
      border-color: transparent;
    }
  }
`;
document.head.appendChild(style);