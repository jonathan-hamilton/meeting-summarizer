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
    description: "Click 'SELECT FILE' to choose an audio file to transcribe.",
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
    description: "Click 'MANAGE NAMES' to assign custom names to the speakers detected in your meeting.",
    transitionType: 'user-action',
    triggerAction: 'manage-names',
    component: 'TranscriptDisplay'
  },
  {
    id: 4,
    title: "Add Speaker",
    description: "Click 'ADD SPEAKER' to add additional speakers if someone was missed during automatic detection.",
    transitionType: 'acknowledgment',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 5,
    title: "Edit/Delete Speaker",
    description: "Click the pencil icon to edit speaker details or the trash icon to delete speakers that were incorrectly detected.",
    transitionType: 'user-action',
    triggerAction: 'pencil-clicked',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 6,
    title: "Save Row",
    description: "Click the checkmark.",
    transitionType: 'user-action',
    triggerAction: 'save-mappings',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 7,
    title: "Save All Mappings",
    description: "Once you've finished editing speakers, click 'SAVE MAPPINGS' to apply all changes.",
    transitionType: 'user-action',
    triggerAction: 'final-save',
    component: 'SpeakerMappingDialog'
  },
  {
    id: 8,
    title: "Generate Summary",
    description: "Click 'GENERATE SUMMARY' to create an AI-powered summary of your meeting.",
    transitionType: 'user-action',
    triggerAction: 'generate-summary',
    component: 'SummaryDisplay'
  },
  {
    id: 9,
    title: "Add/Edit/Delete Action Items",
    description: "Click the ▼ to expand the Action Items. You can add, edit, delete, and drag Action Items between speakers.",
    transitionType: 'user-action',
    triggerAction: 'expand-action-items',
    component: 'SummaryDisplay'
  },
  {
    id: 10,
    title: "(Optional) Copy Summary",
    description: "You can copy the summary to your clipboard using this button to paste it elsewhere.",
    transitionType: 'acknowledgment',
    component: 'SummaryDisplay'
  },
  {
    id: 11,
    title: "Share Summary via Email",
    description: "Click 'SHARE' to send the meeting summary and action items via email to participants.",
    transitionType: 'user-action',
    triggerAction: 'share-summary',
    component: 'SummaryDisplay'
  },
  {
    id: 12,
    title: "Send Email",
    description: "Review the email content and click 'SEND EMAIL' to share the meeting summary with participants.",
    transitionType: 'user-action',
    triggerAction: 'send-email',
    component: 'EmailCompositionDialog'
  },
  // ... more steps
];

interface TourState {
  // Tour status
  isActive: boolean;
  currentStep: number;
  
  // Closed steps tracking
  closedSteps: Set<number>;
  
  // Visited/unlocked steps tracking
  visitedSteps: Set<number>;
  
  // Step completion tracking for demo mode
  completedSteps: Set<number>;
  
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
  isStepClosed: (stepNumber: number) => boolean;
  
  // New event-driven actions
  triggerStepAction: (action: string) => void;
  getCurrentStepConfig: () => TourStepConfig | undefined;
  canAdvanceStep: () => boolean;
  isCurrentStep: (stepNumber: number) => boolean;
  hasVisitedStep: (stepNumber: number) => boolean;
  canGoToNextStep: () => boolean;
  
  // Step completion tracking
  hasCompletedStep: (stepNumber: number) => boolean;
  markStepCompleted: (stepNumber: number) => void;
}

export const useTourStore = create<TourState>()(
  devtools(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      closedSteps: new Set<number>(),
      visitedSteps: new Set<number>(),
      completedSteps: new Set<number>(),
      steps: TOUR_STEPS,
      
      startTour: () => {
        set({ 
          isActive: true, 
          currentStep: 1, 
          closedSteps: new Set<number>(),
          visitedSteps: new Set<number>([1]), // Step 1 is visited when tour starts
          completedSteps: new Set<number>()
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
        const newVisitedSteps = new Set(state.visitedSteps);
        newVisitedSteps.add(step);
        set({ 
          currentStep: step,
          visitedSteps: newVisitedSteps
        });
      },
      
      nextStep: () => {
        const state = get();
        if (state.isActive && state.canGoToNextStep()) {
          // Close current step and advance
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.add(state.currentStep);
          const newVisitedSteps = new Set(state.visitedSteps);
          newVisitedSteps.add(state.currentStep + 1);
          set({ 
            currentStep: state.currentStep + 1,
            closedSteps: newClosedSteps,
            visitedSteps: newVisitedSteps
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
          visitedSteps: new Set<number>(),
          completedSteps: new Set<number>()
        });
      },
      
      isStepClosed: (stepNumber: number) => {
        const state = get();
        return state.closedSteps.has(stepNumber);
      },
      
      // New event-driven methods
      triggerStepAction: (action: string) => {
        const state = get();
        const currentStepConfig = state.getCurrentStepConfig();
        
        // Special case: dialog-opened from Step 3 advances to Step 4
        if (action === 'dialog-opened' && state.currentStep === 3) {
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.add(state.currentStep);
          const newVisitedSteps = new Set(state.visitedSteps);
          newVisitedSteps.add(state.currentStep + 1);
          set({ 
            currentStep: state.currentStep + 1,
            closedSteps: newClosedSteps,
            visitedSteps: newVisitedSteps
          });
          return;
        }
        
        // Special case: share-summary from Step 11 advances to Step 12
        if (action === 'share-summary' && state.currentStep === 11) {
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.add(state.currentStep);
          const newVisitedSteps = new Set(state.visitedSteps);
          newVisitedSteps.add(state.currentStep + 1);
          set({ 
            currentStep: state.currentStep + 1,
            closedSteps: newClosedSteps,
            visitedSteps: newVisitedSteps
          });
          return;
        }
        
        if (currentStepConfig && 
            currentStepConfig.transitionType === 'user-action' && 
            currentStepConfig.triggerAction === action) {
          // This action triggers advancement for current step - advance directly
          const newClosedSteps = new Set(state.closedSteps);
          newClosedSteps.add(state.currentStep);
          const newVisitedSteps = new Set(state.visitedSteps);
          newVisitedSteps.add(state.currentStep + 1);
          set({ 
            currentStep: state.currentStep + 1,
            closedSteps: newClosedSteps,
            visitedSteps: newVisitedSteps
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
      
      hasVisitedStep: (stepNumber: number) => {
        const state = get();
        return state.visitedSteps.has(stepNumber);
      },
      
      canGoToNextStep: () => {
        const state = get();
        const currentStepConfig = state.getCurrentStepConfig();
        
        if (!currentStepConfig) return false;
        
        // For acknowledgment steps, Next button should be enabled
        if (currentStepConfig.transitionType === 'acknowledgment') {
          return true;
        }
        
        // For user-action steps, Next button is enabled if next step has been visited
        const nextStepNumber = state.currentStep + 1;
        return state.hasVisitedStep(nextStepNumber);
      },
      
      // Step completion tracking
      hasCompletedStep: (stepNumber: number) => {
        return get().completedSteps.has(stepNumber);
      },
      
      markStepCompleted: (stepNumber: number) => {
        set((state) => ({
          completedSteps: new Set(state.completedSteps.add(stepNumber))
        }));
      },
    }),
    {
      name: 'tour-store',
    }
  )
);
