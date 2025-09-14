// Step 13: Only allow share summary button (user-action step), disable everything else
export const isStep13ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'share-summary') {
    return false; // Enable share summary button - this is the focus
  }
  
  // All other actions are disabled in Step 13
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
    'add-item',
    'expand-action-items',
    'toggle-expand'
  ];
  return disabledActions.includes(actionType);
};

// Step 14: Only allow add email recipient button (user-action step), disable everything else
export const isStep14ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'add-email-recipient') {
    return false; // Enable add email recipient button - this is the focus
  }
  
  // All other actions are disabled in Step 14
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 15: Acknowledgment step - disable all UI actions, only tour navigation buttons should work
export const isStep15ActionDisabled = (actionType: string): boolean => {
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 16: Only allow preview email button (user-action step), disable everything else
export const isStep16ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'preview-email') {
    return false; // Enable preview email button - this is the focus
  }
  
  // All other actions are disabled in Step 16
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 17: Only allow send email button (user-action step), disable everything else
export const isStep17ActionDisabled = (actionType: string): boolean => {
  if (actionType === 'send-email') {
    return false; // Enable send email button - this is the focus
  }
  
  // All other actions are disabled in Step 17
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};

// Step 18: Tour Completion - disable all UI actions, only tour navigation buttons (RESTART/CLOSE) should work
export const isStep18ActionDisabled = (actionType: string): boolean => {
  const disabledActions = [
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
  return disabledActions.includes(actionType);
};