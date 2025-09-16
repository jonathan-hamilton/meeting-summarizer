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
  isDemo?: boolean;
  hasCompletedFile?: boolean;
  isSimulatingUpload?: boolean;
  mockTranscripts?: any[];
  onDemoStart?: () => void;
  onStepAction?: (action: string) => void;
  children?: React.ReactNode;
}

const acceptedFileTypes = ['.wav', '.mp3', '.mp4', '.m4a', '.flac', '.ogg', '.webm', '.aac'];

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesDropped,
  isDemo = false,
  hasCompletedFile = false,
  isSimulatingUpload = false,
  mockTranscripts = [],
  onDemoStart,
  onStepAction,
  children
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFilesDropped,
    accept: {
      "audio/*": acceptedFileTypes,
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled: hasCompletedFile,
    noClick: isDemo,
    noKeyboard: isDemo,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isDemo && !hasCompletedFile) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Demo dropzone clicked, starting demo upload...');
      onDemoStart?.();
      onStepAction?.('file-select');
    } else if (!isDemo) {
      // In production mode, trigger the file picker directly
      const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        input.click();
      }
    }
  };

  return (
    <Paper
      {...(hasCompletedFile || isDemo ? {} : getRootProps())}
      data-testid="dropzone"
      onClick={handleClick}
      sx={{
        p: 4,
        width: "100%",
        position: "relative",
        border: "2px dashed",
        borderColor: hasCompletedFile 
          ? "grey.200" 
          : isDragActive 
            ? "primary.main" 
            : "grey.300",
        backgroundColor: hasCompletedFile 
          ? "grey.50" 
          : isDragActive 
            ? "primary.50" 
            : "background.paper",
        textAlign: "center",
        cursor: hasCompletedFile ? "default" : "pointer",
        opacity: hasCompletedFile ? 0.6 : 1,
        transition: "all 0.2s ease-in-out",
        "&:hover": hasCompletedFile ? {} : {
          borderColor: "primary.main",
          backgroundColor: "primary.50",
        },
      }}
    >
      {!hasCompletedFile && !isDemo && <input {...getInputProps()} data-testid="file-input" />}
      
      <CloudUpload
        sx={{
          fontSize: 48,
          color: hasCompletedFile 
            ? "grey.400" 
            : isDragActive 
              ? "primary.main" 
              : "grey.400",
          mb: 2,
        }}
      />
      
      <Typography variant="h6" gutterBottom color={hasCompletedFile ? "text.disabled" : "text.primary"}>
        {hasCompletedFile
          ? "File processing complete - Refresh page to upload another file"
          : isDemo
            ? "Click to start demo transcription"
            : isDragActive
              ? "Drop your audio files here"
              : "Drag & drop audio files here, or click to select"}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {isDemo 
          ? "Demo mode - Simulated transcription with mock data"
          : `Supported formats: ${acceptedFileTypes.join(", ")}`}
      </Typography>
      
      {isDemo && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Supported formats: {acceptedFileTypes.join(", ")}
        </Typography>
      )}
      
      <Typography variant="body2" color="text.secondary">
        Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
      </Typography>
      
      <Button 
        variant="contained" 
        startIcon={<CloudUpload />} 
        sx={{ mt: 2 }}
        disabled={hasCompletedFile || (isDemo && (isSimulatingUpload || mockTranscripts.length > 0))}
      >
        Select File
      </Button>

      {children}
    </Paper>
  );
};