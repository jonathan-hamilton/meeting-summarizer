// Shared utilities for token calculations and formatting

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
 * Estimate file duration based on file size (rough approximation)
 * Assuming ~1MB per minute for typical audio files
 */
export const estimateFileDuration = (fileSizeBytes: number): number => {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  return Math.max(1, Math.ceil(fileSizeMB));
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
 * Get complete token calculation for a file
 */
export const getTokenCalculation = (file: File): TokenCalculation => {
  const estimatedDuration = estimateFileDuration(file.size);
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