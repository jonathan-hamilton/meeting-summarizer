// Quick debug script to understand the tour state
import { useTourStore } from './src/stores/tourStore.js';

console.log('Testing tour step 3...');

// Simulate the exact test steps
const store = useTourStore.getState();

console.log('Initial state:', {
  currentStep: store.currentStep,
  isActive: store.isActive
});

// Start tour
store.startTour();
console.log('After startTour:', {
  currentStep: store.currentStep,
  isActive: store.isActive
});

// Step 1 -> 2
store.triggerStepAction('file-select');
console.log('After file-select:', {
  currentStep: store.currentStep,
  isActive: store.isActive
});

// Step 2 -> 3
store.nextStep();
console.log('After nextStep (should be step 3):', {
  currentStep: store.currentStep,
  isActive: store.isActive
});

// Check the specific function call
const result = store.isActionDisabledDuringTour("manage-speakers");
console.log('isActionDisabledDuringTour("manage-speakers"):', result);
console.log('Expected: false (not disabled)');
console.log('Actual:', result);
