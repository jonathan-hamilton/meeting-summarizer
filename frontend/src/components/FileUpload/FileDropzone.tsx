import React from 'react';
import {
  Paper,
  Typography,
  Button
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { formatFileSize } from './validation';
import { MAX_FILE_SIZE } from './types';

interface FileDropzoneProps {
  onFilesDropped: (acceptedFiles: File[], rejections: FileRejection[]) => void;
}

const acceptedFileTypes = ['.wav', '.mp3', '.mp4', '.m4a', '.flac', '.ogg', '.webm', '.aac'];

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesDropped,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFilesDropped,
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
          : "grey.300",
        backgroundColor: isDragActive 
          ? "primary.50" 
          : "background.paper",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: "primary.main",
          backgroundColor: "primary.50",
        },
      }}
    >
      <input {...getInputProps()} data-testid="file-input" />
      
      <CloudUpload
        sx={{
          fontSize: 48,
          color: isDragActive 
            ? "primary.main" 
            : "grey.400",
          mb: 2,
        }}
      />
      
      <Typography variant="h6" gutterBottom color="text.primary">
        {isDragActive
          ? "Drop your audio files here"
          : "Drag & drop audio files here, or click to select"}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Supported formats: {acceptedFileTypes.join(", ")}
      </Typography>
      
      <Typography variant="body2" color="text.secondary">
        Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
      </Typography>
      
      <Button 
        variant="contained" 
        startIcon={<CloudUpload />} 
        sx={{ mt: 2 }}
      >
        Select File
      </Button>
    </Paper>
  );
};