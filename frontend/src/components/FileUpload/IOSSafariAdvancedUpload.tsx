import React, { useRef, useCallback, useState } from 'react';
import {
  Paper,
  Typography,
  useTheme,
  Box,
  Chip,
} from '@mui/material';
import { CloudUpload, TouchApp, FileUpload } from '@mui/icons-material';
import { type FileRejection } from 'react-dropzone';
import { isValidAudioFile, formatFileSize } from './validation';
import { MAX_FILE_SIZE } from './types';

interface IOSSafariAdvancedUploadProps {
  onFilesDropped: (acceptedFiles: File[], rejections: FileRejection[]) => void;
}

/**
 * Advanced iOS Safari file upload with multiple fallback strategies
 * Research shows iOS Safari has fundamental file input limitations that require creative solutions
 */
export const IOSSafariAdvancedUpload: React.FC<IOSSafariAdvancedUploadProps> = ({
  onFilesDropped,
}) => {
  const theme = useTheme();
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [attemptedMethod, setAttemptedMethod] = useState<string>('none');

  // Track component initialization
  React.useEffect(() => {
    const trackPageLoad = async () => {
      try {
        await fetch('/api/IOSSafariDebug/pageload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 'IOSSafariAdvancedUpload',
            componentDetected: true,
            pattern: 'multi-fallback-approach'
          })
        });
      } catch (error) {
        console.error('Failed to track page load:', error);
      }
    };
    trackPageLoad();
  }, []);

  const handleFileSelection = useCallback((files: FileList | null, method: string) => {
    console.log(`🍎 iOS Safari Advanced: Processing files via ${method}`);
    setAttemptedMethod(method);
    
    if (!files || files.length === 0) {
      console.log('🍎 iOS Safari Advanced: No files selected');
      return;
    }

    const acceptedFiles: File[] = [];
    const rejections: FileRejection[] = [];

    Array.from(files).forEach((file) => {
      console.log('🍎 iOS Safari Advanced: Validating file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        method: method
      });

      if (!isValidAudioFile(file)) {
        rejections.push({
          file,
          errors: [{ code: 'file-invalid-type', message: 'File type not supported' }]
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        rejections.push({
          file,
          errors: [{ code: 'file-too-large', message: `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}` }]
        });
        return;
      }

      acceptedFiles.push(file);
    });

    console.log(`🍎 iOS Safari Advanced: Final result via ${method} - Accepted:`, acceptedFiles.length, 'Rejected:', rejections.length);
    onFilesDropped(acceptedFiles, rejections);
  }, [onFilesDropped]);

  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, method: string) => {
    console.log(`🍎 iOS Safari Advanced: File input change event triggered via ${method}`);
    
    // Track successful file selection
    try {
      await fetch('/api/IOSSafariDebug/fileinput', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'fileSelectionChanged',
          pattern: 'advanced-multi-fallback',
          method: method,
          acceptAttribute: event.target?.accept || 'none'
        })
      });
    } catch (error) {
      console.error('Failed to track file selection:', error);
    }
    
    handleFileSelection(event.target.files, method);
    
    // Reset inputs
    if (event.target) {
      event.target.value = '';
    }
  }, [handleFileSelection]);

  // Method 1: Direct hidden input click
  const triggerHiddenInput = useCallback(() => {
    console.log('🍎 iOS Safari Advanced: Method 1 - Direct hidden input click');
    if (hiddenInputRef.current) {
      hiddenInputRef.current.click();
    }
  }, []);

  // Method 2: Label-wrapped input (iOS Safari sometimes prefers this)
  const triggerLabelInput = useCallback(() => {
    console.log('🍎 iOS Safari Advanced: Method 2 - Label-wrapped input');
    if (labelInputRef.current) {
      labelInputRef.current.click();
    }
  }, []);

  // Method 3: Fresh DOM input (last resort)
  const triggerFreshInput = useCallback(() => {
    console.log('🍎 iOS Safari Advanced: Method 3 - Fresh DOM input creation');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*,.mp3,.mp4,.m4a,.wav,.flac,.ogg,.webm';
    input.style.position = 'fixed';
    input.style.top = '-9999px';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.style.width = '1px';
    input.style.height = '1px';
    
    // Add to DOM
    document.body.appendChild(input);
    
    input.onchange = (e) => {
      const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(event, 'fresh-dom-input');
      // Clean up
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 100);
    };
    
    input.oncancel = () => {
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 100);
    };
    
    // iOS Safari sometimes needs a slight delay
    setTimeout(() => {
      input.click();
    }, 50);
  }, [handleInputChange]);

  // Method 4: File System Access API (if available)
  const tryFileSystemAPI = useCallback(async () => {
    console.log('🍎 iOS Safari Advanced: Method 4 - File System Access API');
    
    if ('showOpenFilePicker' in window) {
      try {
        const fileHandles = await (window as any).showOpenFilePicker({
          types: [{
            description: 'Audio files',
            accept: {
              'audio/*': ['.mp3', '.mp4', '.m4a', '.wav', '.flac', '.ogg', '.webm']
            }
          }],
          multiple: false
        });
        
        if (fileHandles && fileHandles.length > 0) {
          const file = await fileHandles[0].getFile();
          const fileList = [file];
          handleFileSelection({ length: 1, item: (i: number) => fileList[i], [Symbol.iterator]: function* () { yield* fileList; } } as unknown as FileList, 'file-system-access-api');
        }
      } catch (error) {
        console.log('🍎 iOS Safari Advanced: File System Access API failed:', error);
        // Fall back to fresh DOM input
        triggerFreshInput();
      }
    } else {
      console.log('🍎 iOS Safari Advanced: File System Access API not available, falling back');
      triggerFreshInput();
    }
  }, [handleFileSelection, triggerFreshInput]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 4,
        textAlign: 'center',
        border: `2px dashed ${theme.palette.primary.main}`,
        borderRadius: 2,
        backgroundColor: theme.palette.background.default,
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          borderColor: theme.palette.primary.dark,
        },
      }}
    >
      <CloudUpload
        sx={{
          fontSize: 64,
          color: theme.palette.primary.main,
          mb: 2,
        }}
      />
      
      <Typography variant="h6" gutterBottom>
        iOS Safari File Upload
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Multiple compatibility approaches for iOS Safari
        <br />
        Supported: WAV, MP3, MP4, M4A, FLAC, OGG, WebM
        <br />
        Maximum size: {formatFileSize(MAX_FILE_SIZE)}
      </Typography>

      {/* Method indicators */}
      {attemptedMethod !== 'none' && (
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={`Last method: ${attemptedMethod}`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>
      )}

      {/* Multiple upload approaches */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {/* Primary button - Method 1 */}
        <button
          type="button"
          onClick={triggerHiddenInput}
          style={{
            fontSize: '18px',
            padding: '15px 25px',
            border: '3px solid #007AFF',
            borderRadius: '12px',
            backgroundColor: '#007AFF',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            minWidth: '250px'
          }}
        >
          <FileUpload style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Choose Audio File (Method 1)
        </button>

        {/* Label-wrapped button - Method 2 */}
        <label style={{ cursor: 'pointer' }}>
          <button
            type="button"
            onClick={triggerLabelInput}
            style={{
              fontSize: '16px',
              padding: '12px 20px',
              border: '2px solid #34C759',
              borderRadius: '10px',
              backgroundColor: '#34C759',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              minWidth: '250px'
            }}
          >
            <TouchApp style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Try Alternative Method
          </button>
          <input
            ref={labelInputRef}
            type="file"
            accept="audio/*,.mp3,.mp4,.m4a,.wav,.flac,.ogg,.webm"
            onChange={(e) => handleInputChange(e, 'label-wrapped-input')}
            style={{ display: 'none' }}
          />
        </label>

        {/* Modern API button - Method 4 */}
        <button
          type="button"
          onClick={tryFileSystemAPI}
          style={{
            fontSize: '14px',
            padding: '10px 15px',
            border: '2px solid #FF9500',
            borderRadius: '8px',
            backgroundColor: '#FF9500',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            minWidth: '250px'
          }}
        >
          <CloudUpload style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Modern File API
        </button>
      </Box>

      {/* Hidden inputs for fallback */}
      <input
        ref={hiddenInputRef}
        type="file"
        accept="audio/*,.mp3,.mp4,.m4a,.wav,.flac,.ogg,.webm"
        onChange={(e) => handleInputChange(e, 'hidden-input-direct')}
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          width: '1px',
          height: '1px',
          pointerEvents: 'none'
        }}
      />

      <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.7 }}>
        iOS Safari • Advanced Multi-Method Approach • Single File
      </Typography>
    </Paper>
  );
};