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
        p: 4,
        width: "100%",
        position: "relative",
        border: "2px dashed",
        borderColor: isDragActive 
          ? "primary.main" 
          : (theme) => theme.palette.mode === 'dark' ? '#555555' : '#a0a0a0', // Darker border for better contrast
        backgroundColor: isDragActive 
          ? "primary.50" 
          : (theme) => theme.palette.mode === 'dark' ? '#1a1a1a' : '#e8e8e8', // Dimmer light mode
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        boxShadow: (theme) => 
          theme.palette.mode === 'dark' 
            ? "0px 2px 8px rgba(0, 0, 0, 0.6)" 
            : "0px 2px 8px rgba(0, 0, 0, 0.12)",
        "&:hover": {
          borderColor: "primary.main",
          backgroundColor: "primary.50",
          boxShadow: (theme) => 
            theme.palette.mode === 'dark' 
              ? "0px 4px 12px rgba(0, 0, 0, 0.8)" 
              : "0px 4px 12px rgba(0, 0, 0, 0.16)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <input {...getInputProps()} data-testid="file-input" />
      
      <CloudUpload
        sx={{
          fontSize: 48,
          color: isDragActive 
            ? "primary.main" 
            : (theme) => theme.palette.mode === 'dark' ? '#999999' : '#666666', // Darker for better contrast
          mb: 2,
        }}
      />
      
      <Typography variant="h6" gutterBottom color="text.primary">
        {isDragActive
          ? "Drop your audio files here"
          : "Drag & drop audio files here, or click to select"}
      </Typography>
      
      <Typography variant="body2" sx={{ 
        color: (theme) => theme.palette.mode === 'dark' ? '#b3b3b3' : '#4a4a4a', // Darker text for dimmer background
        mb: 2 
      }}>
        Supported formats: {acceptedFileTypes.join(", ")}
      </Typography>
      
      <Typography variant="body2" sx={{ 
        color: (theme) => theme.palette.mode === 'dark' ? '#b3b3b3' : '#4a4a4a' // Darker text for dimmer background
      }}>
        Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
      </Typography>
      
      <Button 
        variant="contained" 
        startIcon={<CloudUpload />} 
        size={isMobile ? "large" : "medium"}
        sx={{ 
          mt: 2,
          minHeight: isMobile ? 48 : 'auto',
          px: isMobile ? 3 : 2,
        }}
      >
        Select File
      </Button>
    </Paper>
  );
};