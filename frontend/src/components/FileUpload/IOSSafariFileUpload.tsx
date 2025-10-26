import React, { useRef, useCallback } from 'react';
import {
  Paper,
  Typography,
  Button,
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

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🍎 iOS Safari: File input change event triggered');
    handleFileSelection(event.target.files);
  }, [handleFileSelection]);

  const handleUploadClick = useCallback(() => {
    console.log('🍎 iOS Safari: Upload button clicked');
    console.log('🍎 iOS Safari: File input ref:', fileInputRef.current);
    
    if (fileInputRef.current) {
      try {
        console.log('🍎 iOS Safari: Attempting to trigger file input click');
        fileInputRef.current.click();
        console.log('🍎 iOS Safari: File input click triggered successfully');
      } catch (error) {
        console.error('🍎 iOS Safari: Error triggering file input:', error);
      }
    } else {
      console.error('🍎 iOS Safari: File input ref is null');
    }
  }, []);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 4,
        textAlign: 'center',
        border: `2px dashed ${theme.palette.primary.main}`,
        borderRadius: 2,
        backgroundColor: theme.palette.background.default,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          borderColor: theme.palette.primary.dark,
        },
      }}
      onClick={handleUploadClick}
    >
      {/* Hidden file input - iOS Safari specific configuration */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*,.wav,.mp3,.mp4,.m4a,.flac,.ogg,.webm"
        multiple={false}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        capture={undefined} // Explicitly avoid capture attribute that can cause issues
      />

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

      <Button
        variant="contained"
        startIcon={<CloudUpload />}
        onClick={(e) => {
          e.stopPropagation();
          handleUploadClick();
        }}
        sx={{ mt: 2 }}
      >
        Choose File
      </Button>

      {/* Debug information for iOS Safari */}
      <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.7 }}>
        iOS Safari Optimized • Native File Input
      </Typography>
    </Paper>
  );
};