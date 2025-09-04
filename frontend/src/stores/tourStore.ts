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
    description: "Start by selecting an audio file to transcribe.",
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
    description: "Now that Speakers are mapped, click 'GENERATE SUMMARY' to create an AI-powered Summary of your meeting.",
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
    description: "You can copy the Summary to your clipboard using this button to paste it elsewhere:",
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
    description: "Click in this area to add email addresses for meeting participants. If you entered emails during Speaker mapping, you can select from those or type new ones.",
    transitionType: 'user-action',
    triggerAction: 'add-email-recipient',
    component: 'EmailCompositionDialog'
  },
  {
    id: 15,
    title: "Edit Email Content",
    description: "Customize the email subject and add a personal message. The Meeting Summary will be included automatically.",
    transitionType: 'acknowledgment',
    component: 'EmailCompositionDialog'
  },
  {
    id: 16,
    title: "Preview Email",
    description: "Preview how your email will look with the Meeting Summary and action items included before sending it to recipients.",
    transitionType: 'user-action',
    triggerAction: 'preview-email',
    component: 'EmailCompositionDialog'
  },
  {
    id: 17,
    title: "Send Email",
    description: "Send the Meeting Summary and action items to all recipients. In demo mode, no actual emails are sent.",
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

// Dialog control callbacks for tour navigation
interface DialogControllers {
  openSpeakerMappingDialog?: () => void;
  openEmailCompositionDialog?: () => void;
}

// Helper function for step-specific scroll behavior
const handleStepScroll = (stepNumber: number) => {
  switch (stepNumber) {
    case 2:
      // Step 2: Scroll is handled by ref callback pattern in App.tsx
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
  
  // Step configurations
  steps: TourStepConfig[];
  
  // Dialog controllers for backward navigation
  dialogControllers: DialogControllers;
  
  // Actions
  startTour: () => void;
  stopTour: () => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  closeStep: (stepNumber: number) => void;
  reopenStep: (stepNumber: number) => void;
  resetTour: () => void;
  
  // Dialog management for tour navigation
  registerDialogController: (dialogType: keyof DialogControllers, controller: () => void) => void;
  unregisterDialogController: (dialogType: keyof DialogControllers) => void;
  
  // Navigation utilities
  jumpToStep: (step: number) => void;
  
  // New event-driven actions
  triggerStepAction: (action: string) => void;
  getCurrentStepConfig: () => TourStepConfig | undefined;
  canAdvanceStep: () => boolean;
  isCurrentStep: (stepNumber: number) => boolean;
  getTotalSteps: () => number;
}

export const useTourStore = create<TourState>()(
  devtools(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      closedSteps: new Set<number>(),
      steps: TOUR_STEPS,
      dialogControllers: {},
      
      startTour: () => {
        set({ 
          isActive: true, 
          currentStep: 1, 
          closedSteps: new Set<number>() 
        });
      },
      
      stopTour: () => {
        set({ 
          isActive: false, 
          currentStep: 0 
        });
      },
      
      setCurrentStep: (step: number) => {
        const state = get();
        if (state.isActive) {
          // When manually setting a step, we need to handle dialog opening
          const targetStepConfig = state.steps.find(s => s.id === step);
          
          // Open the required dialog if the step requires it
          if (targetStepConfig) {
            if (targetStepConfig.component === 'SpeakerMappingDialog' && state.dialogControllers.openSpeakerMappingDialog) {
              state.dialogControllers.openSpeakerMappingDialog();
            } else if (targetStepConfig.component === 'EmailCompositionDialog' && state.dialogControllers.openEmailCompositionDialog) {
              state.dialogControllers.openEmailCompositionDialog();
            }
          }
          
          // Remove the target step from closed steps to ensure it shows
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.delete(step);
          
          // Handle step-specific scroll behavior
          handleStepScroll(step);
          
          set({ 
            currentStep: step,
            closedSteps: newClosedSteps
          });
        }
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
      
      previousStep: () => {
        const state = get();
        if (state.isActive && state.currentStep > 1) {
          // Close current step and go back
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.add(state.currentStep);
          const previousStepNumber = state.currentStep - 1;
          // Reopen the previous step
          newClosedSteps.delete(previousStepNumber);
          
          // Get the step configuration for the target step
          const targetStepConfig = state.steps.find(step => step.id === previousStepNumber);
          
          // Open the required dialog if the step requires it
          if (targetStepConfig) {
            if (targetStepConfig.component === 'SpeakerMappingDialog' && state.dialogControllers.openSpeakerMappingDialog) {
              state.dialogControllers.openSpeakerMappingDialog();
            } else if (targetStepConfig.component === 'EmailCompositionDialog' && state.dialogControllers.openEmailCompositionDialog) {
              state.dialogControllers.openEmailCompositionDialog();
            }
          }
          
          set({ 
            currentStep: previousStepNumber,
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
          dialogControllers: {}
        });
      },
      
      // Dialog management methods
      registerDialogController: (dialogType: keyof DialogControllers, controller: () => void) => {
        const state = get();
        set({
          dialogControllers: {
            ...state.dialogControllers,
            [dialogType]: controller
          }
        });
      },
      
      unregisterDialogController: (dialogType: keyof DialogControllers) => {
        const state = get();
        const newControllers = { ...state.dialogControllers };
        delete newControllers[dialogType];
        set({ dialogControllers: newControllers });
      },
      
      // Navigation utility method
      jumpToStep: (step: number) => {
        const state = get();
        if (state.isActive && step >= 1 && step <= state.steps.length) {
          // Use setCurrentStep which handles dialog opening
          state.setCurrentStep(step);
        }
      },
      
      // New event-driven methods
      triggerStepAction: (action: string) => {
        const state = get();
        const currentStepConfig = state.getCurrentStepConfig();
        
        if (currentStepConfig && 
            currentStepConfig.transitionType === 'user-action' && 
            currentStepConfig.triggerAction === action) {
          
          // Directly advance the step without checking canAdvanceStep
          // since this is triggered by the required user action
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.add(state.currentStep);  // Close current step
          const newCurrentStep = state.currentStep + 1;
          
          // Handle step-specific scroll behavior
          handleStepScroll(newCurrentStep);
          
          set({ 
            currentStep: newCurrentStep,
            closedSteps: newClosedSteps
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
        
        // For acknowledgment steps, Next button should be enabled
        return currentStepConfig.transitionType === 'acknowledgment';
      },
      
      isCurrentStep: (stepNumber: number) => {
        const state = get();
        return state.isActive && state.currentStep === stepNumber;
      },
      
      getTotalSteps: () => {
        const state = get();
        return state.steps.length;
      },
    }),
    {
      name: 'tour-store',
    }
  )
);
