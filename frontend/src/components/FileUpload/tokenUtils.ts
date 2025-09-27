// Shared utilities for token calculations and formatting
import { apiService } from '../../services/apiService';

export interface TokenCalculation {
  requiredTokens: number;
  estimatedDuration: number;
  estimatedCost: string;
  hasDiscount: boolean;
  discountPercentage?: number;
}

export interface FileEstimation {
  fileName: string;
  fileSize: string;
  fileSizeMB: number;
  estimatedDuration: number;
}

/**
 * Calculate tokens required based on duration (matches backend logic)
 */
export const calculateTokensRequired = (durationMinutes: number): number => {
  if (durationMinutes <= 0) return 100; // Minimum 1 increment
  
  // Base calculation: 100 tokens per 15-minute increment (rounded up)
  const baseTokens = Math.ceil(durationMinutes / 15.0) * 100;
  
  // Apply volume discount multiplier (matches backend logic)
  let discountMultiplier = 1.0;
  if (durationMinutes >= 60) discountMultiplier = 0.7;        // 30% discount
  else if (durationMinutes >= 45) discountMultiplier = 0.8;   // 20% discount  
  else if (durationMinutes >= 30) discountMultiplier = 0.9;   // 10% discount
  // else 15-29 minutes = 1.0 (no discount)
  
  return Math.floor(baseTokens * discountMultiplier);
};

/**
 * Get discount information for a given duration
 */
export const getDiscountInfo = (durationMinutes: number): { hasDiscount: boolean; discountPercentage?: number } => {
  if (durationMinutes >= 60) return { hasDiscount: true, discountPercentage: 30 };
  if (durationMinutes >= 45) return { hasDiscount: true, discountPercentage: 20 };
  if (durationMinutes >= 30) return { hasDiscount: true, discountPercentage: 10 };
  return { hasDiscount: false };
};

/**
 * Estimate file duration using API (preferred method for accuracy)
 */
export const estimateFileDurationAsync = async (fileSizeBytes: number, fileName: string): Promise<number> => {
  try {
    const response = await apiService.estimateDuration(fileSizeBytes, fileName);
    if (response.success && response.data) {
      return response.data.durationMinutes;
    } else {
      console.warn('API duration estimation failed, falling back to client-side calculation:', response.message);
      return estimateFileDuration(fileSizeBytes, fileName);
    }
  } catch (error) {
    console.warn('Error calling duration estimation API, falling back to client-side calculation:', error);
    return estimateFileDuration(fileSizeBytes, fileName);
  }
};

/**
 * Estimate file duration based on file size using realistic bitrates (fallback method)
 * Matches backend EstimateAudioDurationMinutes logic
 */
export const estimateFileDuration = (fileSizeBytes: number, fileName?: string): number => {
  const fileSizeBytes_actual = fileSizeBytes;
  
  // Determine bitrate based on file extension (matching backend logic)
  const extension = fileName ? fileName.toLowerCase().split('.').pop() : 'unknown';
  let bitrateKbps: number;
  
  switch (extension) {
    case 'wav':
      bitrateKbps = 700; // Realistic for meeting recordings
      break;
    case 'mp3':
      bitrateKbps = 128;
      break;
    case 'flac':
      bitrateKbps = 800;
      break;
    case 'm4a':
      bitrateKbps = 128;
      break;
    default:
      bitrateKbps = 256; // Conservative default
      break;
  }
  
  // Calculate duration: (file_size_bytes * 8) / (bitrate_kbps * 1000) / 60
  const durationSeconds = (fileSizeBytes_actual * 8) / (bitrateKbps * 1000);
  const durationMinutes = durationSeconds / 60;
  
  return Math.max(1, Math.round(durationMinutes));
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Calculate estimated cost in dollars (assuming $0.05 per token)
 */
export const calculateEstimatedCost = (tokens: number): string => {
  const costPerToken = 0.05; // $0.05 per token
  const totalCost = tokens * costPerToken;
  return `$${totalCost.toFixed(2)}`;
};

/**
 * Get complete token calculation for a file (using API for accuracy)
 */
export const getTokenCalculationAsync = async (file: File): Promise<TokenCalculation> => {
  const estimatedDuration = await estimateFileDurationAsync(file.size, file.name);
  const requiredTokens = calculateTokensRequired(estimatedDuration);
  const estimatedCost = calculateEstimatedCost(requiredTokens);
  const discountInfo = getDiscountInfo(estimatedDuration);
  
  return {
    requiredTokens,
    estimatedDuration,
    estimatedCost,
    hasDiscount: discountInfo.hasDiscount,
    discountPercentage: discountInfo.discountPercentage,
  };
};

/**
 * Get file estimation details for display (using API for accuracy)
 */
export const getFileEstimationAsync = async (file: File): Promise<FileEstimation> => {
  const fileSizeMB = file.size / (1024 * 1024);
  const estimatedDuration = await estimateFileDurationAsync(file.size, file.name);
  
  return {
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    fileSizeMB,
    estimatedDuration,
  };
};

/**
 * Get complete token calculation for a file
 */
export const getTokenCalculation = (file: File): TokenCalculation => {
  const estimatedDuration = estimateFileDuration(file.size, file.name);
  const requiredTokens = calculateTokensRequired(estimatedDuration);
  const estimatedCost = calculateEstimatedCost(requiredTokens);
  const discountInfo = getDiscountInfo(estimatedDuration);
  
  return {
    requiredTokens,
    estimatedDuration,
    estimatedCost,
    hasDiscount: discountInfo.hasDiscount,
    discountPercentage: discountInfo.discountPercentage,
  };
};

/**
 * Get file estimation details for display
 */
export const getFileEstimation = (file: File): FileEstimation => {
  const fileSizeMB = file.size / (1024 * 1024);
  
  return {
    fileName: file.name,
    fileSize: formatFileSize(file.size),
    fileSizeMB,
    estimatedDuration: estimateFileDuration(file.size),
  };
};