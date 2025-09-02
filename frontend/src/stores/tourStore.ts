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
    description: "Your audio has been transcribed. Review the details below.",
    transitionType: 'acknowledgment',
    component: 'TranscriptDisplay'
  },
  {
    id: 3,
    title: "Manage Speaker Names",
    description: "Customize speaker names to make your transcript more readable.",
    transitionType: 'user-action',
    triggerAction: 'manage-names',
    component: 'TranscriptDisplay'
  },
  {
    id: 4,
    title: "(Optional) Add Speaker",
    description: "Click 'ADD SPEAKER' to add additional speakers if someone was missed during automatic detection. ⚠️ Adding speakers will break the AI confidence score calculation",
    transitionType: 'acknowledgment',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 5,
    title: "(Optional) Edit/Delete Speaker",
    description: "Click the pencil icon to edit speaker details or the trash icon to delete speakers that were incorrectly detected. ⚠️ Deleting speakers will break the AI confidence score calculation",
    transitionType: 'user-action',
    triggerAction: 'edit-speaker',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 6,
    title: "Save Row",
    description: "After editing speaker details, click the checkmark to save changes for this speaker.",
    transitionType: 'user-action',
    triggerAction: 'save-row',
    component: 'SpeakerMappingField'
  },
  {
    id: 7,
    title: "Save All Changes",  
    description: "Once you've finished editing speakers, click 'SAVE MAPPINGS' to apply all changes.",
    transitionType: 'user-action',
    triggerAction: 'final-save',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 8,
    title: "Generate Summary",
    description: "Now that speakers are mapped, click 'GENERATE SUMMARY' to create an AI-powered summary of your meeting.",
    transitionType: 'user-action',
    triggerAction: 'generate-summary',
    component: 'SummaryDisplay'
  },
  {
    id: 9,
    title: "Add/Edit/Delete Action Items",
    description: "Click the ▼ to expand the Action Items. You can add, edit, delete, and drag action items between speakers.",
    transitionType: 'user-action',
    triggerAction: 'expand-action-items',
    component: 'SummaryDisplay'
  },
  {
    id: 10,
    title: "(Optional) Copy Summary",
    description: "You can copy the summary to your clipboard using this button to paste it elsewhere:",
    transitionType: 'acknowledgment',
    component: 'SummaryDisplay'
  },
  {
    id: 11,
    title: "Share Summary via Email",
    description: "Click 'SHARE' to send the meeting summary and action items via email to participants.",
    transitionType: 'user-action',
    triggerAction: 'open-email-dialog',
    component: 'SummaryDisplay'
  },
  {
    id: 12,
    title: "Add Email Recipients",
    description: "Click in this area to add email addresses for meeting participants. If you entered emails during speaker mapping, you can select from those or type new ones.",
    transitionType: 'user-action',
    triggerAction: 'add-email-recipient',
    component: 'EmailCompositionDialog'
  },
  {
    id: 13,
    title: "Edit Email Content",
    description: "Customize the email subject and add a personal message. The meeting summary will be included automatically.",
    transitionType: 'acknowledgment',
    component: 'EmailCompositionDialog'
  },
  {
    id: 14,
    title: "Preview Email",
    description: "Preview how your email will look with the meeting summary and action items included before sending it to recipients.",
    transitionType: 'user-action',
    triggerAction: 'preview-email',
    component: 'EmailCompositionDialog'
  },
  {
    id: 15,
    title: "Send Email",
    description: "Send the meeting summary and action items to all recipients. In demo mode, no actual emails are sent.",
    transitionType: 'user-action',
    triggerAction: 'send-email',
    component: 'EmailCompositionDialog'
  },
  {
    id: 16,
    title: "Tour Completion",
    description: "Congratulations! You've completed the demo tour. Sign up to start processing your own meeting recordings.",
    transitionType: 'acknowledgment',
    component: 'TourCompletion'
  }
  // ... more steps
];

interface TourState {
  // Tour status
  isActive: boolean;
  currentStep: number;
  
  // Closed steps tracking
  closedSteps: Set<number>;
  
  // Step configurations
  steps: TourStepConfig[];
  
  // Actions
  startTour: () => void;
  stopTour: () => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  closeStep: (stepNumber: number) => void;
  reopenStep: (stepNumber: number) => void;
  resetTour: () => void;
  
  // New event-driven actions
  triggerStepAction: (action: string) => void;
  getCurrentStepConfig: () => TourStepConfig | undefined;
  canAdvanceStep: () => boolean;
  isCurrentStep: (stepNumber: number) => boolean;
}

export const useTourStore = create<TourState>()(
  devtools(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      closedSteps: new Set<number>(),
      steps: TOUR_STEPS,
      
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
        set({ currentStep: step });
      },
      
      nextStep: () => {
        const state = get();
        console.log('nextStep called:', { 
          currentStep: state.currentStep, 
          isActive: state.isActive, 
          canAdvance: state.canAdvanceStep() 
        });
        
        if (state.isActive && state.canAdvanceStep()) {
          // Close current step and advance
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.add(state.currentStep);
          const newCurrentStep = state.currentStep + 1;
          
          console.log('Advancing step:', { 
            from: state.currentStep, 
            to: newCurrentStep,
            closedSteps: Array.from(newClosedSteps)
          });
          
          set({ 
            currentStep: newCurrentStep,
            closedSteps: newClosedSteps
          });
        } else {
          console.log('Cannot advance step - tour not active or cannot advance');
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
          closedSteps: new Set<number>() 
        });
      },
      
      // New event-driven methods
      triggerStepAction: (action: string) => {
        const state = get();
        const currentStepConfig = state.getCurrentStepConfig();
        
        console.log('triggerStepAction called:', { 
          action, 
          currentStep: state.currentStep, 
          isActive: state.isActive,
          currentStepConfig 
        });
        
        if (currentStepConfig && 
            currentStepConfig.transitionType === 'user-action' && 
            currentStepConfig.triggerAction === action) {
          console.log('Triggering step advancement for action:', action);
          
          // Directly advance the step without checking canAdvanceStep
          // since this is triggered by the required user action
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.add(state.currentStep);  // Close current step
          const newCurrentStep = state.currentStep + 1;
          
          console.log('Advancing step programmatically:', { 
            from: state.currentStep, 
            to: newCurrentStep,
            closedSteps: Array.from(newClosedSteps)
          });
          
          set({ 
            currentStep: newCurrentStep,
            closedSteps: newClosedSteps
          });
        } else {
          console.log('Action not matched or not user-action type');
        }
      },
      
      getCurrentStepConfig: () => {
        const state = get();
        return state.steps.find(step => step.id === state.currentStep);
      },
      
      canAdvanceStep: () => {
        const state = get();
        const currentStepConfig = state.getCurrentStepConfig();
        
        console.log('canAdvanceStep check:', { 
          currentStep: state.currentStep, 
          currentStepConfig,
          canAdvance: currentStepConfig?.transitionType === 'acknowledgment'
        });
        
        if (!currentStepConfig) return false;
        
        // For acknowledgment steps, Next button should be enabled
        return currentStepConfig.transitionType === 'acknowledgment';
      },
      
      isCurrentStep: (stepNumber: number) => {
        const state = get();
        return state.isActive && state.currentStep === stepNumber;
      },
    }),
    {
      name: 'tour-store',
    }
  )
);
