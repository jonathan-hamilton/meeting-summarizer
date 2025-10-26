import React, { useRef, useCallback, useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { formatFileSize } from './validation';
import { MAX_FILE_SIZE } from './types';

interface FileDropzoneProps {
  onFilesDropped: (acceptedFiles: File[], rejections: FileRejection[]) => void;
}

const acceptedFileTypes = ['.wav', '.mp3', '.mp4', '.m4a', '.flac', '.ogg', '.webm']; // Azure Fast Transcription supported formats

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesDropped,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Enhanced mobile file input reference management
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles, rejections) => {
      // Call the parent handler
      onFilesDropped(acceptedFiles, rejections);
      
      // Enhanced input reset for mobile browsers
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    // Simplified accept for iOS Safari compatibility
    accept: isMobile ? {
      "*/*": acceptedFileTypes, // iOS Safari: Use catch-all with extensions
    } : {
      // Desktop: Full MIME type support
      "audio/*": acceptedFileTypes,
      "video/mp4": [".mp4", ".m4a"],
      "video/quicktime": [".m4a"],
      "video/webm": [".webm"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled: false,
    // Disable validator for iOS Safari to prevent conflicts
    validator: isMobile ? undefined : (file) => {
      // Desktop: Use extension-based validation
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!acceptedFileTypes.includes(extension)) {
        return {
          code: 'invalid-file-type',
          message: `File type ${extension} not supported`
        };
      }
      return null;
    }
  });

  // iOS Safari specific file change handler
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('📱 iOS Safari file change:', { 
      fileCount: files.length, 
      files: files.map(f => ({ 
        name: f.name, 
        type: f.type || 'unknown', 
        size: f.size,
        extension: f.name.substring(f.name.lastIndexOf('.'))
      })),
      userAgent: navigator.userAgent
    });
    
    if (files.length > 0) {
      // Call the parent handler directly for iOS Safari
      onFilesDropped(files, []);
    }
    
    // Reset for iOS Safari compatibility
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onFilesDropped]);

  // Enhanced mobile file picker trigger with iOS Safari detection
  const handleFilePickerClick = useCallback((e: React.MouseEvent) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    console.log('📱 File picker clicked:', { 
      isMobile, 
      isIOS,
      isSafari,
      userAgent: navigator.userAgent,
      inputRef: !!inputRef.current,
      inputAccept: inputRef.current?.accept,
      inputMultiple: inputRef.current?.multiple
    });
    
    // Try different approaches for iOS Safari
    if (isIOS && isSafari) {
      console.log('🍎 iOS Safari detected - using aggressive compatibility mode');
      
      // Method 1: Try to completely bypass react-dropzone
      e.preventDefault();
      e.stopPropagation();
      
      if (inputRef.current) {
        console.log('🍎 Triggering iOS Safari file picker directly');
        inputRef.current.value = '';
        
        // Add error handling for iOS Safari click
        try {
          inputRef.current.click();
          console.log('🍎 iOS Safari click successful');
        } catch (error) {
          console.error('🍎 iOS Safari click failed:', error);
          // Fallback: try without preventDefault
          return;
        }
      }
    } else {
      // Standard mobile/desktop handling
      e.preventDefault();
      e.stopPropagation();
      
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.click();
        
        if (isMobile) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
        }
      }
    }
  }, [isMobile]);

  // Enhanced mobile touch feedback states
  const [isTouching, setIsTouching] = useState(false);
  
  const handleTouchStart = useCallback(() => {
    if (isMobile) {
      setIsTouching(true);
    }
  }, [isMobile]);
  
  const handleTouchEnd = useCallback(() => {
    if (isMobile) {
      setIsTouching(false);
    }
  }, [isMobile]);

  return (
    <Paper
      {...getRootProps()}
      data-testid="dropzone"
      onClick={handleFilePickerClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      sx={{
        // Mobile-first responsive padding (S8.1 breakpoints)
        p: isMobile ? 3 : isTablet ? 3.5 : 4,
        width: "100%",
        position: "relative",
        // Enhanced touch-friendly minimum height (S8.3 compliance)
        minHeight: isMobile ? 200 : isTablet ? 220 : 240,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: "2px dashed",
        borderColor: (isDragActive || (isMobile && isTouching))
          ? "primary.main" 
          : (theme) => theme.palette.mode === 'dark' ? '#555555' : '#a0a0a0',
        backgroundColor: (isDragActive || (isMobile && isTouching))
          ? "primary.50" 
          : (theme) => theme.palette.mode === 'dark' ? '#1a1a1a' : '#e8e8e8',
        // S8.3 gradient theming - enhanced for mobile touch states
        ...((isDragActive || (isMobile && isTouching)) && theme.palette.mode === 'dark' && {
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%), #1a1a1a',
          borderColor: '#667eea',
        }),
        ...((isDragActive || (isMobile && isTouching)) && theme.palette.mode === 'light' && {
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%), #f5f5f5',
          borderColor: '#667eea',
        }),
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.3s ease-in-out", // Slightly longer for better mobile feedback
        boxShadow: (theme) => 
          theme.palette.mode === 'dark' 
            ? "0px 2px 8px rgba(0, 0, 0, 0.6)" 
            : "0px 2px 8px rgba(0, 0, 0, 0.12)",
        // Enhanced hover/touch feedback with gradient theming
        "&:hover": {
          // Only apply hover effects on non-touch devices to avoid sticky hover on mobile
          ...((!isMobile || !('ontouchstart' in window)) && {
            borderColor: "primary.main",
            backgroundColor: isDragActive ? "primary.100" : "primary.50",
            // S8.3 gradient theming for hover state
            ...(theme.palette.mode === 'dark' && {
              background: isDragActive 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%), #1a1a1a'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%), #2a2a2a',
              borderColor: '#667eea',
            }),
            ...(theme.palette.mode === 'light' && {
              background: isDragActive 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%), #f0f0f0'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.04) 0%, rgba(118, 75, 162, 0.04) 100%), #f8f8f8',
            }),
            boxShadow: (theme) => 
              theme.palette.mode === 'dark' 
                ? "0px 4px 12px rgba(0, 0, 0, 0.8)" 
                : "0px 4px 12px rgba(0, 0, 0, 0.16)",
            transform: "translateY(-1px)",
          }),
        },
        // Enhanced touch feedback for mobile devices with haptic-like visual response
        "&:active": {
          transform: isMobile ? "scale(0.96)" : "translateY(-1px)",
          transition: "transform 0.1s ease-in-out",
          // Enhanced active state for mobile touches
          ...(isMobile && {
            borderColor: "primary.main",
            ...(theme.palette.mode === 'dark' && {
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%), #1a1a1a',
              boxShadow: "0px 2px 8px rgba(102, 126, 234, 0.4)",
            }),
            ...(theme.palette.mode === 'light' && {
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%), #f0f0f0',
              boxShadow: "0px 2px 8px rgba(102, 126, 234, 0.2)",
            }),
          }),
        },
      }}
    >
      <input 
        {...getInputProps()} 
        ref={inputRef}
        data-testid="file-input"
        // Enhanced mobile file picker attributes
        aria-label={isMobile ? "Tap to select audio files" : "Select audio files to upload"}
        // iOS Safari optimized accept attribute - prioritize extensions over MIME types
        accept=".wav,.mp3,.mp4,.m4a,.flac,.ogg,.webm"
        // iOS Safari optimization
        capture={isMobile ? undefined : false}
        // iOS Safari specific change handler
        onChange={isMobile ? handleFileChange : undefined}
        // iOS Safari specific attributes
        multiple={true}
        style={{ 
          // Ensure input is properly hidden but accessible
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px',
        }}
      />
      
      {/* iOS Safari Emergency Fallback - Visible Input */}
      {isMobile && /iPad|iPhone|iPod/.test(navigator.userAgent) && (
        <input
          type="file"
          accept=".wav,.mp3,.mp4,.m4a,.flac,.ogg,.webm"
          multiple
          onChange={handleFileChange}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1000,
            opacity: 0.1,
            width: '100px',
            height: '44px',
            backgroundColor: 'red',
            border: '2px solid red'
          }}
        />
      )}
      
      <CloudUpload
        sx={{
          // Mobile-first responsive icon sizing
          fontSize: isMobile ? 56 : isTablet ? 52 : 48,
          color: (isDragActive || (isMobile && isTouching))
            ? "primary.main" 
            : (theme) => theme.palette.mode === 'dark' ? '#999999' : '#666666',
          mb: isMobile ? 1.5 : 2,
          transition: "all 0.3s ease-in-out",
          // Enhanced mobile touch feedback for icon
          ...(isMobile && isTouching && {
            transform: "scale(1.05)",
            filter: "drop-shadow(0px 2px 4px rgba(102, 126, 234, 0.3))",
          }),
        }}
      />
      
      <Typography 
        variant={isMobile ? "h6" : "h6"} 
        gutterBottom 
        color="text.primary"
        sx={{
          // Mobile-optimized text sizing and spacing
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: 500,
          lineHeight: 1.3,
          mb: isMobile ? 1 : 1.5,
          px: isMobile ? 1 : 0, // Prevent text overflow on small screens
          transition: "all 0.3s ease-in-out",
          // Enhanced mobile touch feedback for text
          ...(isMobile && isTouching && {
            color: "primary.main",
            fontWeight: 600,
          }),
        }}
      >
        {(isDragActive || (isMobile && isTouching))
          ? isMobile 
            ? "Ready to select files!"
            : "Drop your audio files here"
          : isMobile 
            ? "Tap to select audio files"
            : "Drag & drop audio files here, or click to select"}
      </Typography>
      
      <Typography 
        variant="body2" 
        id="file-format-help"
        sx={{ 
          color: (theme) => theme.palette.mode === 'dark' ? '#b3b3b3' : '#4a4a4a',
          mb: isMobile ? 1 : 2,
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          px: isMobile ? 1 : 0,
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        Supported formats: {isMobile ? 'WAV, MP3, MP4, M4A...' : acceptedFileTypes.join(", ")}
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: (theme) => theme.palette.mode === 'dark' ? '#b3b3b3' : '#4a4a4a',
          mb: isMobile ? 2 : 2,
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          px: isMobile ? 1 : 0,
          textAlign: 'center',
        }}
      >
        Max size: {formatFileSize(MAX_FILE_SIZE)}
      </Typography>
      
      <Button 
        variant="contained" 
        startIcon={<CloudUpload />} 
        size={isMobile ? "large" : "medium"}
        onClick={handleFilePickerClick}
        // Enhanced mobile accessibility
        aria-label={isMobile ? "Tap to select audio files from your device" : "Click to select audio files"}
        aria-describedby="file-format-help"
        sx={{ 
          mt: isMobile ? 1 : 2,
          // S8.3 touch optimization - 44px minimum height
          minHeight: 44,
          px: isMobile ? 4 : 2,
          fontSize: isMobile ? '1rem' : '0.875rem',
          fontWeight: 500,
          borderRadius: isMobile ? 2 : 1,
          // S8.3 gradient theming integration for dark mode
          ...(theme.palette.mode === 'dark' && {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0px 4px 12px rgba(102, 126, 234, 0.3)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              boxShadow: '0px 6px 16px rgba(102, 126, 234, 0.4)',
            },
            '&:active': {
              background: 'linear-gradient(135deg, #4e63c6 0%, #5e377e 100%)',
            },
          }),
          // Enhanced touch feedback
          transition: "all 0.2s ease-in-out",
          "&:active": {
            transform: "scale(0.98)",
          },
        }}
      >
        {isMobile ? "SELECT AUDIO" : "SELECT FILE"}
      </Button>
    </Paper>
  );
};