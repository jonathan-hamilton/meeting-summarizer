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

  // Track page load for iOS Safari debugging
  React.useEffect(() => {
    const trackPageLoad = async () => {
      try {
        await fetch('/api/IOSSafariDebug/pageload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 'IOSSafariFileUpload',
            componentDetected: true,
            pattern: 'hidden-input-label-button'
          })
        });
      } catch (error) {
        console.error('Failed to track page load:', error);
      }
    };
    trackPageLoad();
  }, []);

  const handleFileSelection = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      console.log('🍎 iOS Safari: No files selected');
      return;
    }

    console.log('🍎 iOS Safari: Processing', files.length, 'files');
    
    const acceptedFiles: File[] = [];
    const rejections: FileRejection[] = [];

    Array.from(files).forEach((file) => {
      console.log('🍎 iOS Safari: Validating file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      // Validate file
      if (!isValidAudioFile(file)) {
        console.log('🍎 iOS Safari: File rejected - invalid type:', file.name);
        rejections.push({
          file,
          errors: [{ code: 'file-invalid-type', message: 'File type not supported' }]
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        console.log('🍎 iOS Safari: File rejected - too large:', file.name, formatFileSize(file.size));
        rejections.push({
          file,
          errors: [{ code: 'file-too-large', message: `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}` }]
        });
        return;
      }

      console.log('🍎 iOS Safari: File accepted:', file.name);
      acceptedFiles.push(file);
    });

    console.log('🍎 iOS Safari: Final result - Accepted:', acceptedFiles.length, 'Rejected:', rejections.length);
    onFilesDropped(acceptedFiles, rejections);

    // Reset input for next selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesDropped]);

  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🍎 iOS Safari: File input change event triggered (Material-UI label pattern)');
    
    // Track file selection for debugging
    try {
      await fetch('/api/IOSSafariDebug/fileinput', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'fileSelectionChanged',
          pattern: 'hidden-input-label-button',
          acceptAttribute: fileInputRef.current?.accept || 'none (all files allowed)'
        })
      });
    } catch (error) {
      console.error('Failed to track file selection:', error);
    }
    
    handleFileSelection(event.target.files);
  }, [handleFileSelection]);

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
        iOS Safari Compatible Upload
        <br />
        Supported: WAV, MP3, MP4, M4A, FLAC, OGG, WebM
        <br />
        Maximum size: {formatFileSize(MAX_FILE_SIZE)}
      </Typography>

      {/* iOS Safari: Label wrapper approach for better touch handling */}
      <form>
        <label 
          htmlFor="ios-safari-file-input"
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            backgroundColor: '#007AFF',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            textAlign: 'center',
            minWidth: '200px'
          }}
        >
          Choose Audio File
        </label>
        <input
          id="ios-safari-file-input"
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          style={{
            position: 'absolute',
            left: '-9999px',
            opacity: 0,
            width: '1px',
            height: '1px'
          }}
        />
      </form>

      {/* Debug information for iOS Safari */}
      <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.7 }}>
        iOS Safari • Hidden Input + Label Button Pattern
      </Typography>
    </Paper>
  );
};