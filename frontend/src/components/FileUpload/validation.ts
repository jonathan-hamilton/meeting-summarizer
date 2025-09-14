import { ACCEPTED_AUDIO_FORMATS, MAX_FILE_SIZE } from './types';

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  if (!ACCEPTED_AUDIO_FORMATS.includes(file.type as any)) {
    return {
      isValid: false,
      error: `Invalid file type: ${file.type}. Supported formats: ${ACCEPTED_AUDIO_FORMATS.join(', ')}`
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  return { isValid: true };
};

export const validateFiles = (files: File[]): { validFiles: File[]; errors: string[] } => {
  const validFiles: File[] = [];
  const errors: string[] = [];

  files.forEach(file => {
    const validation = validateFile(file);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${validation.error}`);
    }
  });

  return { validFiles, errors };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};