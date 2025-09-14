// Step 7: Only allow SAVE ROW for first row (index 0), disable all others
export const isStep7ActionDisabled = (actionType: string, rowIndex?: number): boolean => {
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
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 8: Only allow SAVE MAPPINGS button, disable everything else
export const isStep8ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'save-mappings') {
    return false; // Enable SAVE MAPPINGS button
  }
  
  // All other actions are disabled in Step 8
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 9: Only allow reassignment actions (double arrow icons), disable everything else
export const isStep9ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'reassign-speaker-left' || actionType === 'reassign-speaker-right') {
    return false; // Enable reassignment buttons
  }
  
  // All other actions are disabled in Step 9
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 10: Only allow GENERATE MEETING SUMMARY button, disable everything else
export const isStep10ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'generate-summary') {
    return false; // Enable GENERATE MEETING SUMMARY button
  }
  
  // All other actions are disabled in Step 10
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 11: Only allow expanding action items (down arrow buttons), disable everything else
export const isStep11ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'expand-action-items' || actionType === 'toggle-expand') {
    return false; // Enable expand/collapse buttons for action items
  }
  
  // All other actions are disabled in Step 11
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 12: Only allow copy summary button (acknowledgment step), disable everything else
export const isStep12ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'copy-summary') {
    return false; // Enable copy summary button - this is the focus
  }
  
  // All other actions are disabled in Step 12
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};