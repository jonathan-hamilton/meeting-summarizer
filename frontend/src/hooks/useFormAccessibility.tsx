import { useEffect } from 'react';
import { useAccessibilityStore } from '../stores/accessibilityStore';

/**
 * Hook for announcing form errors to screen readers
 * Integrates with accessibility store for centralized announcements
 */
export const useFormErrorAnnouncement = (errors: Record<string, string>, formName: string) => {
  const { setAnnouncement } = useAccessibilityStore();

  useEffect(() => {
    const errorMessages = Object.values(errors).filter(Boolean);
    if (errorMessages.length > 0) {
      const announcement = `${formName} has ${errorMessages.length} error${errorMessages.length > 1 ? 's' : ''}: ${errorMessages.join(', ')}`;
      setAnnouncement(announcement, 5000);
    }
  }, [errors, formName, setAnnouncement]);
};

/**
 * Hook for announcing successful form submissions
 */
export const useFormSuccessAnnouncement = (success: boolean, message: string) => {
  const { setAnnouncement } = useAccessibilityStore();

  useEffect(() => {
    if (success) {
      setAnnouncement(message, 3000);
    }
  }, [success, message, setAnnouncement]);
};

/**
 * Generate ARIA attributes for form fields with error states
 */
export const getFormFieldAria = (
  fieldName: string,
  error?: string,
  helpText?: string
) => {
  const ariaProps: Record<string, any> = {
    'aria-invalid': !!error,
  };

  if (error) {
    ariaProps['aria-describedby'] = `${fieldName}-error`;
  } else if (helpText) {
    ariaProps['aria-describedby'] = `${fieldName}-help`;
  }

  return ariaProps;
};

/**
 * Component for accessible error messages
 */
export const FormErrorMessage = ({ 
  fieldName, 
  error 
}: { 
  fieldName: string; 
  error?: string; 
}) => {
  if (!error) return null;

  return (
    <div
      id={`${fieldName}-error`}
      role="alert"
      aria-live="polite"
      style={{
        color: '#d32f2f',
        fontSize: '0.75rem',
        marginTop: '3px',
        marginLeft: '14px',
        marginRight: '14px',
      }}
    >
      {error}
    </div>
  );
};

/**
 * Component for accessible help text
 */
export const FormHelpText = ({ 
  fieldName, 
  text 
}: { 
  fieldName: string; 
  text: string; 
}) => {
  return (
    <div
      id={`${fieldName}-help`}
      style={{
        color: '#666',
        fontSize: '0.75rem',
        marginTop: '3px',
        marginLeft: '14px',
        marginRight: '14px',
      }}
    >
      {text}
    </div>
  );
};