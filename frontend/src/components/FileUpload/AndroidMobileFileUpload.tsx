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

export function AndroidMobileFileUpload({ onFilesDropped }: AndroidMobileFileUploadProps) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize mobile debugging when component mounts
  useEffect(() => {
    initializeMobileDebug();
    logMobileDebug('AndroidMobileFileUpload component mounted', 'AndroidMobileFileUpload');
  }, []);

  const handleFileSelection = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {
      logMobileDebug('No files selected', 'AndroidMobileFileUpload');
      return;
    }

    const acceptedFiles: File[] = [];
    const rejections: FileRejection[] = [];

    Array.from(files).forEach((file) => {
      logFileSelection(file);
      
      const fileTooBig = file.size > MAX_FILE_SIZE;
      const invalidType = !isValidAudioFile(file);

      if (fileTooBig || invalidType) {
        const errors = [];
        if (fileTooBig) errors.push({ code: 'file-too-large', message: 'File too large' });
        if (invalidType) errors.push({ code: 'file-invalid-type', message: 'Invalid file type' });
        
        rejections.push({ file, errors });
        logFileUploadError(file, errors.map(e => e.message).join(', '));
      } else {
        acceptedFiles.push(file);
      }
    });

    logMobileDebug(`File processing complete: ${acceptedFiles.length} accepted, ${rejections.length} rejected`, 'AndroidMobileFileUpload');
    onFilesDropped(acceptedFiles, rejections);
  }, [onFilesDropped]);

  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const filesInfo = files ? Array.from(files).map(f => `${f.name}(${formatFileSize(f.size)})`).join(', ') : 'none';
    await logMobileDebug(`🎉 ANDROID FIX SUCCESS: File input changed: ${files?.length || 0} files - ${filesInfo}`, 'AndroidMobileFileUpload');
    
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
        await logMobileDebug('🎉 ANDROID FIX: User-initiated input focused (picker opened)', 'AndroidMobileFileUpload');
      };
      
      const handleBlur = async () => {
        await logMobileDebug('🎉 ANDROID FIX: User-initiated input blurred (picker closed)', 'AndroidMobileFileUpload');
      };
      
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      
      return () => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      };
    }
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
        // ANDROID CHROME FIX: Make container relative for absolute positioning
        position: 'relative',
      }}
    >
      {/* ANDROID CHROME FIX: User-initiated file input overlay - this makes the entire area clickable */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/x-m4a,.mp3,.mp4,.m4a,.wav"
        onChange={handleInputChange}
        onClick={async () => await logMobileDebug('🎉 ANDROID FIX: User-initiated file input clicked directly', 'AndroidMobileFileUpload')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          zIndex: 1,
        }}
        aria-label="Select audio file to upload"
      />

      {/* Upload icon - positioned behind the invisible file input */}
      <CloudUpload 
        sx={{ 
          fontSize: '3rem',
          color: theme.palette.primary.main,
          mb: 1,
          zIndex: 0,
          pointerEvents: 'none',
        }} 
      />
      
      {/* Upload text - positioned behind the invisible file input */}
      <Typography 
        variant="h6" 
        color="primary"
        sx={{ 
          fontWeight: 600,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        Select Audio File
      </Typography>
      
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        Tap to choose an audio file to transcribe
      </Typography>

      {/* Subtle indicator that this is optimized for Android */}
      <Typography 
        variant="caption" 
        sx={{ 
          mt: 1,
          px: 2,
          py: 0.5,
          backgroundColor: theme.palette.success.main,
          color: theme.palette.success.contrastText,
          borderRadius: 1,
          fontSize: '0.7rem',
          fontWeight: 600,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        ANDROID
      </Typography>
    </Paper>
  );
}