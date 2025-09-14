import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { TourState, TourStepConfig } from './types';
import { TOUR_STEPS } from './steps';
import { handleStepScroll } from './scrollBehavior';
import { isActionDisabledDuringTour } from './processControl1';

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
      
      getCurrentStepConfig: (): TourStepConfig | undefined => {
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
        return isActionDisabledDuringTour(
          state.currentStep, 
          state.isActive, 
          actionType, 
          rowIndex
        );
      },
    }),
    {
      name: 'tour-store',
    }
  )
);