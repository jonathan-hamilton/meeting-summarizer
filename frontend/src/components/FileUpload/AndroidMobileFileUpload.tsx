import React, { useRef, useCallback, useEffect } from 'react';
import {
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { type FileRejection } from 'react-dropzone';
import { isValidAudioFile, formatFileSize } from './validation';
import { MAX_FILE_SIZE } from './types';
import { 
  initializeMobileDebug, 
  logFileSelection, 
  logFileUploadError,
  logMobileDebug 
} from '../../utils/mobileDebugger';

interface AndroidMobileFileUploadProps {
  onFilesDropped: (acceptedFiles: File[], rejections: FileRejection[]) => void;
}

/**
 * Android mobile-specific file upload component
 * Optimized for Android Chrome and Samsung Internet browsers
 * Based on iOS Safari component but with Android-specific optimizations
 */
export const AndroidMobileFileUpload: React.FC<AndroidMobileFileUploadProps> = ({
  onFilesDropped,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize mobile debugging when component mounts
  useEffect(() => {
    initializeMobileDebug('AndroidMobileFileUpload').catch(console.warn);
  }, []);

  const handleFileSelection = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      await logMobileDebug('No files selected from input', 'AndroidMobileFileUpload');
      return;
    }
    
    const acceptedFiles: File[] = [];
    const rejections: FileRejection[] = [];

    for (const file of Array.from(files)) {
      await logFileSelection(file.name, file.size, 'AndroidMobileFileUpload');

      // Validate file
      if (!isValidAudioFile(file)) {
        const errorMsg = `Invalid audio file: ${file.name} (${file.type})`;
        await logFileUploadError(errorMsg, 'AndroidMobileFileUpload');
        rejections.push({
          file,
          errors: [{ code: 'file-invalid-type', message: 'File type not supported' }]
        });
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = `File too large: ${file.name} (${formatFileSize(file.size)} > ${formatFileSize(MAX_FILE_SIZE)})`;
        await logFileUploadError(errorMsg, 'AndroidMobileFileUpload');
        rejections.push({
          file,
          errors: [{ 
            code: 'file-too-large', 
            message: `File is larger than ${formatFileSize(MAX_FILE_SIZE)}` 
          }]
        });
        continue;
      }

      await logMobileDebug(`Valid file selected: ${file.name} (${formatFileSize(file.size)})`, 'AndroidMobileFileUpload');
      acceptedFiles.push(file);
    }

    // Call the callback with results
    onFilesDropped(acceptedFiles, rejections);
  }, [onFilesDropped]);

  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const filesInfo = files ? Array.from(files).map(f => `${f.name}(${formatFileSize(f.size)})`).join(', ') : 'none';
    await logMobileDebug(`File input changed: ${files?.length || 0} files - ${filesInfo}`, 'AndroidMobileFileUpload');
    
    handleFileSelection(files);
    
    // Reset the input so the same file can be selected again if needed
    if (event.target) {
      event.target.value = '';
    }
  }, [handleFileSelection]);

  // Android Chrome: Enhanced event handling for the persistent input
  useEffect(() => {
    const input = fileInputRef.current;
    if (input) {
      const handleFocus = async () => {
        await logMobileDebug('Persistent input focused (picker opened)', 'AndroidMobileFileUpload');
      };
      
      const handleBlur = async () => {
        await logMobileDebug('Persistent input blur detected', 'AndroidMobileFileUpload');
        // Android Chrome sometimes doesn't fire onChange, check after blur
        setTimeout(async () => {
          if (input.files && input.files.length > 0) {
            await logMobileDebug('Files detected on blur - triggering change manually', 'AndroidMobileFileUpload');
            const event = new Event('change', { bubbles: true }) as unknown as React.ChangeEvent<HTMLInputElement>;
            Object.defineProperty(event, 'target', { value: input, enumerable: true });
            await handleInputChange(event);
            // Clear the input after processing
            input.value = '';
          }
        }, 150); // Delay for Android to settle
      };
      
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      
      return () => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      };
    }
  }, [handleInputChange]);

  const handleClick = useCallback(async () => {
    await logMobileDebug('🚨 ENHANCED DEBUGGING ACTIVE - v2025.11.09.22:20 - DEPLOYMENT FORCE 🚨', 'AndroidMobileFileUpload');
    await logMobileDebug('File picker clicked', 'AndroidMobileFileUpload');
    
    // Strategy 1: Try persistent input with extensive debugging
    if (fileInputRef.current) {
      await logMobileDebug('Using persistent input ref for Android Chrome reliability', 'AndroidMobileFileUpload');
      
      // Add temporary event listeners for this click session
      const input = fileInputRef.current;
      
      const tempFocusHandler = async () => {
        await logMobileDebug('TEMP: Persistent input focused', 'AndroidMobileFileUpload');
      };
      
      const tempBlurHandler = async () => {
        await logMobileDebug('TEMP: Persistent input blurred', 'AndroidMobileFileUpload');
        // Check for files after a delay
        setTimeout(async () => {
          if (input.files && input.files.length > 0) {
            await logMobileDebug(`TEMP: ${input.files.length} files found after blur!`, 'AndroidMobileFileUpload');
            const event = new Event('change', { bubbles: true }) as unknown as React.ChangeEvent<HTMLInputElement>;
            Object.defineProperty(event, 'target', { value: input, enumerable: true });
            await handleInputChange(event);
          } else {
            await logMobileDebug('TEMP: No files found after blur', 'AndroidMobileFileUpload');
          }
        }, 200);
      };
      
      const tempChangeHandler = async () => {
        await logMobileDebug('TEMP: onChange fired naturally!', 'AndroidMobileFileUpload');
      };
      
      // Add temporary listeners
      input.addEventListener('focus', tempFocusHandler, { once: true });
      input.addEventListener('blur', tempBlurHandler, { once: true });
      input.addEventListener('change', tempChangeHandler, { once: true });
      
      // Click the input
      input.click();
      
      // Clean up temporary listeners after 5 seconds
      setTimeout(() => {
        input.removeEventListener('focus', tempFocusHandler);
        input.removeEventListener('blur', tempBlurHandler);
        input.removeEventListener('change', tempChangeHandler);
      }, 5000);
      
      return;
    }
    
    // Strategy 2: Dynamic input with enhanced Android handling (fallback)
    await logMobileDebug('Creating dynamic input as fallback', 'AndroidMobileFileUpload');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/x-m4a,.mp3,.mp4,.m4a,.wav';
    input.multiple = false;
    
    // Try different positioning strategies for Android
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    input.style.top = '-9999px';
    input.style.width = '1px';
    input.style.height = '1px';
    input.style.opacity = '0';
    input.style.zIndex = '-1000';
    document.body.appendChild(input);
    
    let fileSelectionDetected = false;
    
    // Enhanced event handling for dynamic input
    input.onfocus = async () => {
      await logMobileDebug('Dynamic input focused (picker opened)', 'AndroidMobileFileUpload');
    };
    
    input.onblur = async () => {
      await logMobileDebug('Dynamic input blur detected', 'AndroidMobileFileUpload');
      setTimeout(async () => {
        if (!fileSelectionDetected && input.files && input.files.length > 0) {
          fileSelectionDetected = true;
          await logMobileDebug(`Dynamic: ${input.files.length} files detected on blur!`, 'AndroidMobileFileUpload');
          const event = new Event('change', { bubbles: true }) as unknown as React.ChangeEvent<HTMLInputElement>;
          Object.defineProperty(event, 'target', { value: input, enumerable: true });
          await handleInputChange(event);
        }
        // Clean up after processing
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 300); // Longer delay for Android
    };
    
    input.onchange = async (e) => {
      if (!fileSelectionDetected) {
        fileSelectionDetected = true;
        await logMobileDebug('Dynamic onChange fired naturally', 'AndroidMobileFileUpload');
        const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
        await handleInputChange(event);
      }
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 100);
    };
    
    input.oncancel = async () => {
      await logMobileDebug('Dynamic input cancelled', 'AndroidMobileFileUpload');
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 100);
    };
    
    // Alternative click strategies for Android
    await logMobileDebug('Triggering dynamic file picker', 'AndroidMobileFileUpload');
    
    // Strategy A: Direct click
    try {
      input.click();
    } catch {
      await logMobileDebug('Direct click failed, trying focus+click', 'AndroidMobileFileUpload');
      try {
        input.focus();
        input.click();
      } catch {
        await logMobileDebug('Focus+click failed, trying delayed click', 'AndroidMobileFileUpload');
        setTimeout(() => {
          try {
            input.click();
          } catch {
            logMobileDebug('All click strategies failed', 'AndroidMobileFileUpload');
          }
        }, 100);
      }
    }
    
    // Safety cleanup after 10 seconds
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 10000);
  }, [handleInputChange]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 4,
        textAlign: 'center',
        border: `2px dashed ${theme.palette.primary.main}`,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: theme.palette.primary.dark,
          backgroundColor: theme.palette.action.hover,
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
        // Enhanced touch targets for mobile
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Select audio file to upload"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Hidden file input for programmatic access */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/x-m4a,.mp3,.mp4,.m4a,.wav"
        onChange={handleInputChange}
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Upload icon */}
      <CloudUpload 
        sx={{ 
          fontSize: '3rem', 
          color: theme.palette.primary.main,
          mb: 1,
        }} 
      />

      {/* Debug indicator for mobile testing */}
      <Typography 
        variant="caption" 
        sx={{ 
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'success.main',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.7rem',
          fontWeight: 'bold',
        }}
      >
        ANDROID
      </Typography>

      {/* Main instruction */}
      <Typography 
        variant="h6" 
        component="div"
        sx={{ 
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: 1,
        }}
      >
        SELECT FILE
      </Typography>

      {/* Generic mobile guidance */}
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          maxWidth: '300px',
          lineHeight: 1.5,
        }}
      >
        Tap to select an audio file from your device storage
      </Typography>

      {/* File type guidance */}
      <Typography 
        variant="caption" 
        color="text.secondary"
        sx={{ 
          mt: 1,
          opacity: 0.8,
        }}
      >
        Supported formats: MP3, MP4, WAV
      </Typography>
    </Paper>
  );
};

export default AndroidMobileFileUpload;