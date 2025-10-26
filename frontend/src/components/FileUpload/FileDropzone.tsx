import React from 'react';
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
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles, rejections) => {
      // Call the parent handler
      onFilesDropped(acceptedFiles, rejections);
      
      // Reset the input value to allow selecting the same file again
      // This is necessary because browsers don't trigger onChange if the same file is selected
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    },
    accept: {
      "audio/*": acceptedFileTypes,
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled: false, // Always allow uploads
  });

  const handleClick = (e: React.MouseEvent) => {
    // In production mode, trigger the file picker directly
    const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  return (
    <Paper
      {...getRootProps()}
      data-testid="dropzone"
      onClick={handleClick}
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
        borderColor: isDragActive 
          ? "primary.main" 
          : (theme) => theme.palette.mode === 'dark' ? '#555555' : '#a0a0a0',
        backgroundColor: isDragActive 
          ? "primary.50" 
          : (theme) => theme.palette.mode === 'dark' ? '#1a1a1a' : '#e8e8e8',
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.3s ease-in-out", // Slightly longer for better mobile feedback
        boxShadow: (theme) => 
          theme.palette.mode === 'dark' 
            ? "0px 2px 8px rgba(0, 0, 0, 0.6)" 
            : "0px 2px 8px rgba(0, 0, 0, 0.12)",
        // Enhanced hover/touch feedback
        "&:hover": {
          borderColor: "primary.main",
          backgroundColor: isDragActive ? "primary.100" : "primary.50",
          boxShadow: (theme) => 
            theme.palette.mode === 'dark' 
              ? "0px 4px 12px rgba(0, 0, 0, 0.8)" 
              : "0px 4px 12px rgba(0, 0, 0, 0.16)",
          transform: isMobile ? "scale(0.98)" : "translateY(-1px)", // Mobile-friendly scale instead of translate
        },
        // Touch feedback for mobile devices
        "&:active": {
          transform: isMobile ? "scale(0.96)" : "translateY(-1px)",
          transition: "transform 0.1s ease-in-out",
        },
      }}
    >
      <input {...getInputProps()} data-testid="file-input" />
      
      <CloudUpload
        sx={{
          // Mobile-first responsive icon sizing
          fontSize: isMobile ? 56 : isTablet ? 52 : 48,
          color: isDragActive 
            ? "primary.main" 
            : (theme) => theme.palette.mode === 'dark' ? '#999999' : '#666666',
          mb: isMobile ? 1.5 : 2,
          transition: "all 0.3s ease-in-out",
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
        }}
      >
        {isDragActive
          ? "Drop your audio files here"
          : isMobile 
            ? "Tap to select audio files"
            : "Drag & drop audio files here, or click to select"}
      </Typography>
      
      <Typography 
        variant="body2" 
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
        sx={{ 
          mt: isMobile ? 1 : 2,
          // S8.3 touch optimization - 44px minimum height
          minHeight: 44,
          px: isMobile ? 4 : 2,
          fontSize: isMobile ? '1rem' : '0.875rem',
          fontWeight: 500,
          borderRadius: isMobile ? 2 : 1,
          // Enhanced touch feedback
          transition: "all 0.2s ease-in-out",
          "&:active": {
            transform: "scale(0.98)",
          },
        }}
      >
        SELECT FILE
      </Button>
    </Paper>
  );
};