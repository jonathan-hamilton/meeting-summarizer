/**
 * Tour Store - Centralized state management for demo tour
 * Handles which tour steps are visible/closed across all components
 * 
 * This is the main export that maintains backward compatibility
 * while using the new modular architecture under the hood.
 */

// Re-export everything from the modular tour system
export { useTourStore } from './tour';
export type { TourState, TourStepConfig, StepTransitionType } from './tour';
export { TOUR_STEPS } from './tour';