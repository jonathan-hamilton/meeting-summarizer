import {
  isStep7ActionDisabled,
  isStep8ActionDisabled,
  isStep9ActionDisabled,
  isStep10ActionDisabled,
  isStep11ActionDisabled,
  isStep12ActionDisabled
} from './processControl2';

import {
  isStep13ActionDisabled,
  isStep14ActionDisabled,
  isStep15ActionDisabled,
  isStep16ActionDisabled,
  isStep17ActionDisabled,
  isStep18ActionDisabled
} from './processControl3';

// Centralized process control - determines if an action should be disabled during tour
export const isActionDisabledDuringTour = (
  currentStep: number,
  isActive: boolean,
  actionType: string, 
  rowIndex?: number
): boolean => {
  if (!isActive) return false;
  
  switch (currentStep) {
    case 1:
      return isStep1ActionDisabled(actionType);
    case 2:
      return isStep2ActionDisabled(actionType);
    case 3:
      return isStep3ActionDisabled(actionType);
    case 4:
      return isStep4ActionDisabled(actionType);
    case 5:
      return isStep5ActionDisabled(actionType);
    case 6:
      return isStep6ActionDisabled(actionType, rowIndex);
    case 7:
      return isStep7ActionDisabled(actionType, rowIndex);
    case 8:
      return isStep8ActionDisabled(actionType);
    case 9:
      return isStep9ActionDisabled(actionType);
    case 10:
      return isStep10ActionDisabled(actionType);
    case 11:
      return isStep11ActionDisabled(actionType);
    case 12:
      return isStep12ActionDisabled(actionType);
    case 13:
      return isStep13ActionDisabled(actionType);
    case 14:
      return isStep14ActionDisabled(actionType);
    case 15:
      return isStep15ActionDisabled(actionType);
    case 16:
      return isStep16ActionDisabled(actionType);
    case 17:
      return isStep17ActionDisabled(actionType);
    case 18:
      return isStep18ActionDisabled(actionType);
    default:
      return false;
  }
};

// Step 1: Only allow file upload action, disable all others
const isStep1ActionDisabled = (actionType: string): boolean => {
  const disabledActions = [
    'copy-transcript',
    'generate-summary',
    'reassign-speaker-left',
    'reassign-speaker-right',
    'manage-speakers'
  ];
  return disabledActions.includes(actionType);
};

// Step 2: Allow transcript copying and summary generation, but disable speaker management and reassignment
const isStep2ActionDisabled = (actionType: string): boolean => {
  const disabledActions = [
    'reassign-speaker-left',
    'reassign-speaker-right',
    'manage-speakers',
    'generate-summary'
  ];
  return disabledActions.includes(actionType);
};

// Step 3: Only allow MANAGE SPEAKERS, disable all others
const isStep3ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'manage-speakers') {
    return false;
  }
  const disabledActions = [
    'copy-transcript',
    'generate-summary', 
    'reassign-speaker-left',
    'reassign-speaker-right',
    'add-speaker'
  ];
  return disabledActions.includes(actionType);
};

// Step 4: Only allow ADD SPEAKER, disable all others
const isStep4ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'add-speaker') {
    return false;
  }
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 5: Only allow CANCEL, disable all others
const isStep5ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'cancel-mappings') {
    return false;
  }
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 6: Only allow EDIT SPEAKER for first row (index 0), disable all others
const isStep6ActionDisabled = (actionType: string, rowIndex?: number): boolean => {
  if (actionType === 'edit-speaker') {
    // Enable only the first row's edit button (index 0)
    const isFirstRow = rowIndex === 0;
    return !isFirstRow; // Return false (enabled) for first row, true (disabled) for others
  }
  
  // All other actions are disabled in Step 6
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

export { 
  isStep1ActionDisabled, 
  isStep2ActionDisabled, 
  isStep3ActionDisabled,
  isStep4ActionDisabled,
  isStep5ActionDisabled,
  isStep6ActionDisabled
};