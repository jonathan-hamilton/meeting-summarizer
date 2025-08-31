/**
 * Tour Store - Centralized state management for demo tour
 * Handles which tour steps are visible/closed across all components
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TourState {
  // Closed steps tracking
  closedSteps: Set<number>;
  
  // Actions
  closeStep: (stepNumber: number) => void;
  reopenStep: (stepNumber: number) => void;
  resetTour: () => void;
  isStepClosed: (stepNumber: number) => boolean;
}

export const useTourStore = create<TourState>()(
  devtools(
    (set, get) => ({
      closedSteps: new Set<number>(),
      
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
        set({ closedSteps: new Set<number>() });
      },
      
      isStepClosed: (stepNumber: number) => {
        const state = get();
        return state.closedSteps.has(stepNumber);
      },
    }),
    {
      name: 'tour-store',
    }
  )
);
