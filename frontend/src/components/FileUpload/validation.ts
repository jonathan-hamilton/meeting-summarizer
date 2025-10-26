import { ACCEPTED_AUDIO_FORMATS, MAX_FILE_SIZE } from './types';

// iOS Safari sometimes provides incorrect or empty MIME types
// Use file extension as fallback validation
const ACCEPTED_EXTENSIONS = ['.wav', '.mp3', '.mp4', '.m4a', '.flac', '.ogg', '.webm'];

const getFileExtension = (filename: string): string => {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
};

const isValidAudioFile = (file: File): boolean => {
  // Enhanced logging for iOS Safari debugging
  const extension = getFileExtension(file.name);
  const mimeTypeValid = file.type && ACCEPTED_AUDIO_FORMATS.includes(file.type as any);
  const extensionValid = ACCEPTED_EXTENSIONS.includes(extension);
  
  console.log('🔍 File validation:', {
    fileName: file.name,
    mimeType: file.type || 'empty/unknown',
    extension: extension,
    mimeTypeValid: mimeTypeValid,
    extensionValid: extensionValid,
    userAgent: navigator.userAgent.includes('iPhone') ? 'iPhone Safari' : 'Other'
  });
  
  // First try MIME type validation
  if (mimeTypeValid) {
    console.log('✅ File validated by MIME type:', file.type);
    return true;
  }
  
  // Fallback to extension validation for iOS Safari compatibility
  if (extensionValid) {
    console.log('✅ File validated by extension (iOS Safari fallback):', extension);
    return true;
  }
  
  console.log('❌ File validation failed:', {
    fileName: file.name,
    providedType: file.type || 'empty',
    extension: extension,
    acceptedTypes: ACCEPTED_AUDIO_FORMATS,
    acceptedExtensions: ACCEPTED_EXTENSIONS
  });
  
  return false;
};

export { isValidAudioFile };

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Use enhanced iOS Safari compatible validation
  if (!isValidAudioFile(file)) {
    const extension = getFileExtension(file.name);
    return {
      isValid: false,
      error: `Invalid file type: ${file.type || 'unknown'} (${extension}). Supported formats: ${ACCEPTED_EXTENSIONS.join(', ')}`
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