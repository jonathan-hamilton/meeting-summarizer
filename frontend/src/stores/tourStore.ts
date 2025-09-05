/**
 * Tour Store - Centralized state management for demo tour
 * Handles which tour steps are visible/closed across all components
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define step transition types
export type StepTransitionType = 
  | 'user-action'      // User must perform specific UI action (e.g., click button)
  | 'acknowledgment'   // User just needs to acknowledge info (Next button enabled)
  | 'automatic';       // Automatically advance (rare, for loading states)

// Define step configuration
export interface TourStepConfig {
  id: number;
  title: string;
  description: string;
  transitionType: StepTransitionType;
  triggerAction?: string; // For user-action steps, what action triggers advancement
  component: string; // Which component this step appears in
}

// Tour step definitions
export const TOUR_STEPS: TourStepConfig[] = [
  {
    id: 1,
    title: "Upload Your Audio",
    description: "Click 'SELECT FILE' to select a mock audio file to transcribe.",
    transitionType: 'user-action',
    triggerAction: 'file-select',
    component: 'FileUpload'
  },
  {
    id: 2,
    title: "Transcription Complete",
    description: "Excellent! Review the transcript statistics shown in the chips above: file size, processing time, duration, Speaker count, confidence score, and detected language. Click 'NEXT' to continue.",
    transitionType: 'acknowledgment',
    component: 'TranscriptDisplay'
  },
  {
    id: 3,
    title: "MANAGE SPEAKERS",
    description: "Click 'MANAGE SPEAKERS' to create/edit/delete Speakers. You can optionally assign Name/Role/Email",
    transitionType: 'user-action',
    triggerAction: 'manage-names',
    component: 'TranscriptDisplay'
  },
  {
    id: 4,
    title: "Add Speaker",
    description: "Click 'ADD SPEAKER' to add additional Speakers if someone was missed during automatic detection. ⚠️ Adding Speakers will break the AI confidence score calculation",
    transitionType: 'user-action',
    triggerAction: 'add-speaker',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 5,
    title: "Speaker Added Successfully",
    description: "Great! A new Speaker has been added to the list. Notice the new colored chip in the auto-detected Speakers section above. Click 'NEXT'.",
    transitionType: 'acknowledgment',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 6,
    title: "Edit/Delete Speaker",
    description: "Click the 'pencil' icon to edit Speaker details or the trash icon to delete Speakers that were incorrectly detected. ⚠️ Deleting Speakers will break the AI confidence score calculation",
    transitionType: 'user-action',
    triggerAction: 'edit-speaker',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 7,
    title: "Save Row",
    description: "After editing Speaker details, click the 'checkmark' to save changes for this Speaker.",
    transitionType: 'user-action',
    triggerAction: 'save-row',
    component: 'SpeakerMappingField'
  },
  {
    id: 8,
    title: "Save All Changes",  
    description: "Once you've finished editing Speakers, click 'SAVE MAPPINGS' to apply all changes.",
    transitionType: 'user-action',
    triggerAction: 'final-save',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 9,
    title: "Reassign Speaker Transcript Segment",
    description: "Click the 'double arrow' icon to reassign a Transcription Segment to another Speaker. Click 'NEXT' to continue",
    transitionType: 'acknowledgment',
    component: 'TranscriptDisplay'
  },
  {
    id: 10,
    title: "Generate Summary",
    description: "Now that Speakers are mapped, click 'GENERATE MEETING SUMMARY' to create an AI-powered Summary of your meeting.",
    transitionType: 'user-action',
    triggerAction: 'generate-summary',
    component: 'SummaryDisplay'
  },
  {
    id: 11,
    title: "Add/Edit/Delete Action Items",
    description: "Click the ▼ to expand the Action Items. You can add, edit, delete, and drag action items between Speakers.",
    transitionType: 'user-action',
    triggerAction: 'expand-action-items',
    component: 'SummaryDisplay'
  },
  {
    id: 12,
    title: "Copy Summary",
    description: "You can copy the Summary to your clipboard using this button to paste it elsewhere. Click 'NEXT'.",
    transitionType: 'acknowledgment',
    component: 'SummaryDisplay'
  },
  {
    id: 13,
    title: "Share Summary via Email",
    description: "Click 'SHARE' to send the Meeting Summary and action items via email to participants.",
    transitionType: 'user-action',
    triggerAction: 'open-email-dialog',
    component: 'SummaryDisplay'
  },
  {
    id: 14,
    title: "Add Email Recipients",
    description: "Here you can add email addresses for meeting participants. If you entered emails during Speaker mapping, you can select from those or type new ones. Click 'ADD ALL PARTICIPANTS' to continue.",
    transitionType: 'user-action',
    triggerAction: 'add-email-recipient',
    component: 'EmailCompositionDialog'
  },
  {
    id: 15,
    title: "Edit Email Content",
    description: "Customize the email subject and add a personal message. The Meeting Summary will be included automatically. Click 'NEXT'.",
    transitionType: 'acknowledgment',
    component: 'EmailCompositionDialog'
  },
  {
    id: 16,
    title: "Preview Email",
    description: "Preview how your email will look with the Meeting Summary and action items included before sending it to recipients. Click 'PREVIEW' to continue",
    transitionType: 'user-action',
    triggerAction: 'preview-email',
    component: 'EmailCompositionDialog'
  },
  {
    id: 17,
    title: "Send Email",
    description: "Send the Meeting Summary and Action Items to all recipients. In demo mode, no actual emails are sent. Click 'SEND EMAIL'.",
    transitionType: 'user-action',
    triggerAction: 'send-email',
    component: 'EmailCompositionDialog'
  },
  {
    id: 18,
    title: "Tour Completion",
    description: "Congratulations! You've completed the demo tour. Sign up to start processing your own meeting recordings.",
    transitionType: 'acknowledgment',
    component: 'TourCompletion'
  }
];

// Helper function for step-specific scroll behavior
const handleStepScroll = (stepNumber: number) => {
  switch (stepNumber) {
    case 2:
      // Step 2: Scroll is handled by ref callback pattern in App.tsx
      break;
    case 10:
      // Step 10: Scroll to bottom of page to show AI-Powered Meeting Summary section
      setTimeout(() => {
        window.scrollTo({ 
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 100); // Small delay to ensure the element is rendered
      break;
    case 11:
      // Step 11: Scroll handled by aiSummaryRef callback in React when component mounts
      break;
    // Add more cases here for other steps that need scroll behavior
    default:
      // No special scroll behavior for other steps
      break;
  }
};

interface TourState {
  // Tour status
  isActive: boolean;
  currentStep: number;
  
  // Closed steps tracking
  closedSteps: Set<number>;
  
  // Completed steps tracking - for enabling NEXT button on user-action steps
  completedSteps: Set<number>;
  
  // Step configurations
  steps: TourStepConfig[];
  
  // Actions
  startTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  closeStep: (stepNumber: number) => void;
  reopenStep: (stepNumber: number) => void;
  resetTour: () => void;
  restartTour: () => void;
  
  // New event-driven actions
  triggerStepAction: (action: string) => void;
  getCurrentStepConfig: () => TourStepConfig | undefined;
  canAdvanceStep: () => boolean;
  isCurrentStep: (stepNumber: number) => boolean;
  getTotalSteps: () => number;
  
  // Centralized process control
  isActionDisabledDuringTour: (actionType: string, rowIndex?: number) => boolean;
}

export const useTourStore = create<TourState>()(
  devtools(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      closedSteps: new Set<number>(),
      completedSteps: new Set<number>(),
      steps: TOUR_STEPS,
      
      startTour: () => {
        set({ 
          isActive: true, 
          currentStep: 1, 
          closedSteps: new Set<number>(),
          completedSteps: new Set<number>()
        });
      },
      
      stopTour: () => {
        set({ 
          isActive: false, 
          currentStep: 0 
        });
      },
      
      nextStep: () => {
        const state = get();
        
        if (state.isActive && state.canAdvanceStep()) {
          // Close current step and advance
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.add(state.currentStep);
          const newCurrentStep = state.currentStep + 1;
          
          // Handle step-specific scroll behavior
          handleStepScroll(newCurrentStep);
          
          set({ 
            currentStep: newCurrentStep,
            closedSteps: newClosedSteps
          });
        }
      },
      
      closeStep: (stepNumber: number) => {
        const state = get();
        const newClosedSteps = new Set(state.closedSteps);
        newClosedSteps.add(stepNumber);
        set({ closedSteps: newClosedSteps });
      },
      
      reopenStep: (stepNumber: number) => {
        const state = get();
        const newClosedSteps = new Set(state.closedSteps);
        newClosedSteps.delete(stepNumber);
        set({ closedSteps: newClosedSteps });
      },
      
      resetTour: () => {
        set({ 
          isActive: false,
          currentStep: 0,
          closedSteps: new Set<number>(),
          completedSteps: new Set<number>()
        });
      },
      
      restartTour: () => {
        // Refresh the page to restart the tour completely
        window.location.reload();
      },
      
      // New event-driven methods
      triggerStepAction: (action: string) => {
        const state = get();
        const currentStepConfig = state.getCurrentStepConfig();
        
        if (currentStepConfig && 
            currentStepConfig.transitionType === 'user-action' && 
            currentStepConfig.triggerAction === action) {
          
          // Mark the current step as completed (enables NEXT button for backward navigation)
          const newCompletedSteps = new Set(state.completedSteps);
          newCompletedSteps.add(state.currentStep);
          
          // ALWAYS auto-advance (restore original behavior)
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.add(state.currentStep);  // Close current step
          const newCurrentStep = state.currentStep + 1;
          
          // Handle step-specific scroll behavior
          handleStepScroll(newCurrentStep);
          
          set({ 
            currentStep: newCurrentStep,
            closedSteps: newClosedSteps,
            completedSteps: newCompletedSteps
          });
        }
      },
      
      getCurrentStepConfig: () => {
        const state = get();
        return state.steps.find(step => step.id === state.currentStep);
      },
      
      canAdvanceStep: () => {
        const state = get();
        const currentStepConfig = state.getCurrentStepConfig();
        
        if (!currentStepConfig) return false;
        
        // For acknowledgment steps, Next button should always be enabled
        if (currentStepConfig.transitionType === 'acknowledgment') {
          return true;
        }
        
        // For user-action steps, enable Next button if the step has been completed
        if (currentStepConfig.transitionType === 'user-action') {
          return state.completedSteps.has(state.currentStep);
        }
        
        return false;
      },
      
      isCurrentStep: (stepNumber: number) => {
        const state = get();
        return state.isActive && state.currentStep === stepNumber;
      },
      
      getTotalSteps: () => {
        const state = get();
        return state.steps.length;
      },

      // Centralized process control - determines if an action should be disabled during tour
      isActionDisabledDuringTour: (actionType: string, rowIndex?: number) => {
        const state = get();
        if (!state.isActive) return false;
        
        const currentStep = state.currentStep;
        
        switch (currentStep) {
          case 1:
            // Step 1: Only allow file upload action, disable all others
            const step1DisabledActions = [
              'copy-transcript',
              'generate-summary',
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers'
            ];
            return step1DisabledActions.includes(actionType);
            
          case 2:
            // Step 2: Allow transcript copying and summary generation, but disable speaker management and reassignment
            const step2DisabledActions = [
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'generate-summary'
            ];
            return step2DisabledActions.includes(actionType);
            
          case 3:
            // Step 3: Only allow MANAGE SPEAKERS, disable all others
            if (actionType === 'manage-speakers') {
              return false;
            }
            const step3DisabledActions = [
              'copy-transcript',
              'generate-summary', 
              'reassign-speaker-left',
              'reassign-speaker-right'
            ];
            return step3DisabledActions.includes(actionType);
            
          case 4:
            // Step 4: Only allow ADD SPEAKER, disable all others
            if (actionType === 'add-speaker') {
              return false;
            }
            const step4DisabledActions = [
              'copy-transcript',
              'generate-summary', 
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'edit-speaker',
              'delete-speaker'
            ];
            return step4DisabledActions.includes(actionType);
            
          case 5:
            // Step 5: Only allow CANCEL, disable all others
            if (actionType === 'cancel-mappings') {
              return false;
            }
            const step5DisabledActions = [
              'copy-transcript',
              'generate-summary', 
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker'
            ];
            return step5DisabledActions.includes(actionType);
            
          case 6:
            // Step 6: Only allow EDIT SPEAKER for first row (index 0), disable all others
            if (actionType === 'edit-speaker') {
              // Enable only the first row's edit button (index 0)
              const isFirstRow = rowIndex === 0;
              return !isFirstRow; // Return false (enabled) for first row, true (disabled) for others
            }
            
            // All other actions are disabled in Step 6
            const step6DisabledActions = [
              'copy-transcript',
              'generate-summary', 
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'delete-speaker' // Always disabled, regardless of row
            ];
            return step6DisabledActions.includes(actionType);
            
          case 7:
            // Step 7: Only allow SAVE ROW for first row (index 0), disable all others
            if (actionType === 'save-row' || actionType === 'confirm-edit') {
              // Enable only the first row's save/confirm button (index 0)
              const isFirstRow = rowIndex === 0;
              return !isFirstRow; // Return false (enabled) for first row, true (disabled) for others
            }
            
            // For form fields, disable editing in all rows during Step 7 to focus on save action
            if (actionType === 'edit-form-fields') {
              return true; // Always disabled during Step 7 to focus on save action
            }
            
            // All other actions are disabled in Step 7
            const step7DisabledActions = [
              'copy-transcript',
              'generate-summary', 
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'cancel-edit' // Also disable cancel buttons to force saving
            ];
            return step7DisabledActions.includes(actionType);
            
          case 8:
            // Step 8: Only allow SAVE MAPPINGS button, disable everything else
            if (actionType === 'save-mappings') {
              return false; // Enable SAVE MAPPINGS button
            }
            
            // All other actions are disabled in Step 8
            const step8DisabledActions = [
              'copy-transcript',
              'generate-summary', 
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields'
            ];
            return step8DisabledActions.includes(actionType);
            
          case 9:
            // Step 9: Only allow reassignment actions (double arrow icons), disable everything else
            if (actionType === 'reassign-speaker-left' || actionType === 'reassign-speaker-right') {
              return false; // Enable reassignment buttons
            }
            
            // All other actions are disabled in Step 9
            const step9DisabledActions = [
              'copy-transcript',
              'generate-summary', 
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields'
            ];
            return step9DisabledActions.includes(actionType);
            
          case 10:
            // Step 10: Only allow GENERATE MEETING SUMMARY button, disable everything else
            if (actionType === 'generate-summary') {
              return false; // Enable GENERATE MEETING SUMMARY button
            }
            
            // All other actions are disabled in Step 10
            const step10DisabledActions = [
              'copy-transcript',
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields'
            ];
            return step10DisabledActions.includes(actionType);
            
          case 11:
            // Step 11: Only allow expanding action items (down arrow buttons), disable everything else
            if (actionType === 'expand-action-items' || actionType === 'toggle-expand') {
              return false; // Enable expand/collapse buttons for action items
            }
            
            // All other actions are disabled in Step 11
            const step11DisabledActions = [
              'copy-transcript',
              'copy-summary', // Copy summary button should be disabled
              'generate-summary',
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields',
              'add-item', // ADD ITEM button should be disabled until they expand
              'share-summary' // SHARE button should be disabled
            ];
            return step11DisabledActions.includes(actionType);
            
          case 12:
            // Step 12: Only allow copy summary button (acknowledgment step), disable everything else
            if (actionType === 'copy-summary') {
              return false; // Enable copy summary button - this is the focus
            }
            
            // All other actions are disabled in Step 12
            const step12DisabledActions = [
              'copy-transcript',
              'generate-summary',
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields',
              'add-item',
              'share-summary', // SHARE button should be disabled
              'expand-action-items',
              'toggle-expand'
            ];
            return step12DisabledActions.includes(actionType);
            
          case 13:
            // Step 13: Only allow share summary button (user-action step), disable everything else
            if (actionType === 'share-summary') {
              return false; // Enable share summary button - this is the focus
            }
            
            // All other actions are disabled in Step 13
            const step13DisabledActions = [
              'copy-transcript',
              'copy-summary', // Copy summary button should be disabled
              'generate-summary',
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields',
              'add-item',
              'expand-action-items',
              'toggle-expand'
            ];
            return step13DisabledActions.includes(actionType);
            
          case 14:
            // Step 14: Only allow add email recipient button (user-action step), disable everything else
            if (actionType === 'add-email-recipient') {
              return false; // Enable add email recipient button - this is the focus
            }
            
            // All other actions are disabled in Step 14
            const step14DisabledActions = [
              'copy-transcript',
              'copy-summary',
              'generate-summary',
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields',
              'add-item',
              'share-summary',
              'expand-action-items',
              'toggle-expand',
              'add-recipient', // ADD button should be disabled
              'add-suggested-recipient', // Email participant chips should be disabled
              'preview-email', // Email preview should be disabled
              'send-email', // Send email should be disabled
              'cancel-email' // Cancel email should be disabled
            ];
            return step14DisabledActions.includes(actionType);
            
          case 15:
            // Step 15: Acknowledgment step - disable all UI actions, only tour navigation buttons should work
            const step15DisabledActions = [
              'copy-transcript',
              'copy-summary',
              'generate-summary',
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields',
              'add-item',
              'share-summary',
              'expand-action-items',
              'toggle-expand',
              'add-recipient', // ADD button should be disabled
              'add-suggested-recipient', // Email participant chips should be disabled
              'add-email-recipient', // ADD ALL PARTICIPANTS button should be disabled
              'preview-email', // Email preview should be disabled
              'send-email', // Send email should be disabled
              'cancel-email' // Cancel email should be disabled
            ];
            return step15DisabledActions.includes(actionType);
            
          case 16:
            // Step 16: Only allow preview email button (user-action step), disable everything else
            if (actionType === 'preview-email') {
              return false; // Enable preview email button - this is the focus
            }
            
            // All other actions are disabled in Step 16
            const step16DisabledActions = [
              'copy-transcript',
              'copy-summary',
              'generate-summary',
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields',
              'add-item',
              'share-summary',
              'expand-action-items',
              'toggle-expand',
              'add-recipient', // ADD button should be disabled
              'add-suggested-recipient', // Email participant chips should be disabled
              'add-email-recipient', // ADD ALL PARTICIPANTS button should be disabled
              'send-email', // Send email should be disabled
              'cancel-email' // Cancel email should be disabled
            ];
            return step16DisabledActions.includes(actionType);
            
          case 17:
            // Step 17: Only allow send email button (user-action step), disable everything else
            if (actionType === 'send-email') {
              return false; // Enable send email button - this is the focus
            }
            
            // All other actions are disabled in Step 17
            const step17DisabledActions = [
              'copy-transcript',
              'copy-summary',
              'generate-summary',
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields',
              'add-item',
              'share-summary',
              'expand-action-items',
              'toggle-expand',
              'add-recipient', // ADD button should be disabled
              'add-suggested-recipient', // Email participant chips should be disabled
              'add-email-recipient', // ADD ALL PARTICIPANTS button should be disabled
              'preview-email', // Email preview should be disabled
              'cancel-email' // Cancel email should be disabled
            ];
            return step17DisabledActions.includes(actionType);
            
          case 18:
            // Step 18: Tour Completion - disable all UI actions, only tour navigation buttons (RESTART/CLOSE) should work
            const step18DisabledActions = [
              'copy-transcript',
              'copy-summary',
              'generate-summary',
              'reassign-speaker-left',
              'reassign-speaker-right',
              'manage-speakers',
              'save-mappings',
              'cancel-mappings',
              'add-speaker',
              'edit-speaker',
              'delete-speaker',
              'save-row',
              'cancel-edit',
              'edit-form-fields',
              'add-item',
              'share-summary',
              'expand-action-items',
              'toggle-expand',
              'add-recipient', // ADD button should be disabled
              'add-suggested-recipient', // Email participant chips should be disabled
              'add-email-recipient', // ADD ALL PARTICIPANTS button should be disabled
              'preview-email', // Email preview should be disabled
              'send-email', // Send email should be disabled
              'cancel-email' // Cancel email should be disabled
            ];
            return step18DisabledActions.includes(actionType);
            
          default:
            // For any other step, don't disable actions
            return false;
        }
      },
    }),
    {
      name: 'tour-store',
    }
  )
);
