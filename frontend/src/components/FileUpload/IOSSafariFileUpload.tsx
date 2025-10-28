import React, { useRef, useCallback } from 'react';
import {
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { type FileRejection } from 'react-dropzone';
import { isValidAudioFile, formatFileSize } from './validation';
import { MAX_FILE_SIZE } from './types';

interface IOSSafariFileUploadProps {
  onFilesDropped: (acceptedFiles: File[], rejections: FileRejection[]) => void;
}

/**
 * iOS Safari-specific file upload component
 * Completely bypasses react-dropzone to avoid iOS Safari compatibility issues
 */
export const IOSSafariFileUpload: React.FC<IOSSafariFileUploadProps> = ({
  onFilesDropped,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // iOS device detection (not just Safari)
  const isActualIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Track component initialization for analytics
  React.useEffect(() => {
    // Component loaded successfully - no action needed
  }, []);

  const handleFileSelection = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    
    const acceptedFiles: File[] = [];
    const rejections: FileRejection[] = [];

    Array.from(files).forEach((file) => {
      // Validate file
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

    onFilesDropped(acceptedFiles, rejections);

    // Reset input for next selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesDropped]);

  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(event.target.files);
  }, [handleFileSelection]);

  // iOS Safari file input trigger with fallback approach
  const triggerFileInput = useCallback(() => {
    // First attempt: Use existing hidden input
    if (fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }
    
    // Second attempt: Create fresh input element (iOS Safari sometimes requires this)
    const input = document.createElement('input');
    input.type = 'file';
    // iOS Safari fix: Use iOS-supported MIME types for file picker filtering (S8.7)
    input.accept = 'audio/mp3,audio/mp4,audio/wav';
    input.multiple = false; // Single file selection for better iOS Safari compatibility
    
    // Add to DOM temporarily (some iOS versions require this)
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    document.body.appendChild(input);
    
    // Set up change handler
    input.onchange = (e) => {
      const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(event);
      // Remove from DOM after use
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 100);
    };
    
    // Set up cancel handler (iOS Safari specific)
    input.oncancel = () => {
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 100);
    };
    
    // Trigger file picker with slight delay for iOS Safari
    setTimeout(() => {
      input.click();
    }, 10);
  }, [handleInputChange]);

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
        Select Audio File
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Supported formats: MP3, M4A, WAV, MP4
        <br />
        Maximum size: {formatFileSize(MAX_FILE_SIZE)}
      </Typography>

      {/* iOS Safari: Programmatic file input trigger */}
      <form>
        <button
          type="button"
          onClick={triggerFileInput}
          style={{
            fontSize: '18px',
            padding: '15px 25px',
            border: '3px solid #007AFF',
            borderRadius: '12px',
            backgroundColor: '#007AFF',
            color: 'white',
            cursor: 'pointer',
            outline: 'none',
            fontWeight: 'bold',
            minWidth: '250px',
            textAlign: 'center'
          }}
        >
          SELECT FILE
        </button>
        {/* Hidden fallback input with iOS Safari specific MIME types (S8.7: iOS-supported formats only) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mp3,audio/mp4,audio/wav"
          multiple={false}
          onChange={handleInputChange}
          style={{
            position: 'absolute',
            left: '-9999px',
            opacity: 0,
            width: '1px',
            height: '1px',
            pointerEvents: 'none'
          }}
        />
      </form>

      {/* Subtle iOS guidance - only show on actual iOS devices */}
      {isActualIOSDevice && (
        <Typography variant="caption" sx={{ 
          mt: 2,
          color: 'text.secondary',
          fontStyle: 'italic',
          opacity: 0.8
        }}>
          💡 Select files saved 'On My iPhone/iPad'
        </Typography>
      )}
    </Paper>
  );
};