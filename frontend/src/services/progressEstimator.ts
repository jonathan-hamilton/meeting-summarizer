import type { 
  ProgressEstimation, 
  EstimationSettings, 
  ProcessingStage 
} from '../types/progress';
import { DEFAULT_ESTIMATION_SETTINGS } from '../types/progress';

/**
 * Service for estimating file processing times based on file characteristics
 * and historical data. Provides realistic time estimates for better UX.
 */
export class ProgressEstimatorService {
  private settings: EstimationSettings;
  private historicalData: Map<string, number[]> = new Map(); // Store actual times for calibration

  constructor(settings: EstimationSettings = DEFAULT_ESTIMATION_SETTINGS) {
    this.settings = settings;
    this.loadHistoricalData();
  }

  /**
   * Estimate total processing time for a file based on its characteristics
   */
  estimateProcessingTime(file: File): ProgressEstimation {
    const fileSizeMB = file.size / (1024 * 1024);
    const estimatedAudioMinutes = this.estimateAudioDuration(file);

    // Calculate each stage time
    const uploadTime = this.calculateUploadTime(fileSizeMB);
    const processingTime = this.calculateProcessingTime(fileSizeMB);
    const transcriptionTime = this.calculateTranscriptionTime(estimatedAudioMinutes);
    const summarizationTime = this.calculateSummarizationTime(fileSizeMB);

    const totalTime = uploadTime + processingTime + transcriptionTime + summarizationTime;

    // Apply historical calibration if available
    const calibratedEstimation = this.applyHistoricalCalibration({
      uploadTime,
      processingTime,
      transcriptionTime,
      summarizationTime,
      totalTime,
    }, fileSizeMB);

    return calibratedEstimation;
  }

  /**
   * Calculate time remaining based on current stage and progress
   */
  calculateTimeRemaining(
    estimation: ProgressEstimation, 
    currentStage: ProcessingStage, 
    stageProgress: number
  ): number {
    const stages: ProcessingStage[] = ['upload', 'processing', 'transcription', 'summarization'];
    const currentIndex = stages.indexOf(currentStage);
    
    if (currentIndex === -1) return 0; // Complete or invalid stage

    // Calculate remaining time in current stage
    const currentStageTime = this.getStageTime(estimation, currentStage);
    const currentStageRemaining = currentStageTime * (1 - stageProgress / 100);

    // Calculate time for remaining stages
    let remainingStagesTime = 0;
    for (let i = currentIndex + 1; i < stages.length; i++) {
      remainingStagesTime += this.getStageTime(estimation, stages[i]);
    }

    return Math.max(0, currentStageRemaining + remainingStagesTime);
  }

  /**
   * Update historical data with actual processing time for calibration
   */
  recordActualTime(fileSizeMB: number, actualTotalTime: number): void {
    const sizeCategory = this.getFileSizeCategory(fileSizeMB);
    const existing = this.historicalData.get(sizeCategory) || [];
    
    // Keep last 10 recordings per size category
    existing.push(actualTotalTime);
    if (existing.length > 10) {
      existing.shift();
    }
    
    this.historicalData.set(sizeCategory, existing);
    this.saveHistoricalData();
  }

  /**
   * Get estimation settings for customization
   */
  getSettings(): EstimationSettings {
    return { ...this.settings };
  }

  /**
   * Update estimation settings
   */
  updateSettings(newSettings: Partial<EstimationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Private helper methods

  private calculateUploadTime(fileSizeMB: number): number {
    // Convert Mbps to MB/s and calculate upload time
    const uploadSpeedMBps = this.settings.uploadSpeedMbps / 8; // Convert bits to bytes
    const uploadTimeSeconds = fileSizeMB / uploadSpeedMBps;
    
    // Add some overhead for connection setup and processing
    const overhead = Math.min(5000, uploadTimeSeconds * 100); // Max 5 seconds overhead
    
    return (uploadTimeSeconds * 1000) + overhead;
  }

  private calculateProcessingTime(fileSizeMB: number): number {
    // Base processing time scales with file size
    const baseTime = fileSizeMB * this.settings.processingTimePerMb;
    
    // Add overhead for format validation and conversion
    const overhead = Math.min(10000, baseTime * 0.2); // Max 10 seconds overhead
    
    return baseTime + overhead;
  }

  private calculateTranscriptionTime(audioMinutes: number): number {
    // Transcription time based on estimated audio duration
    const baseTime = audioMinutes * this.settings.transcriptionTimePerMinute;
    
    // Add overhead for API calls and processing
    const overhead = Math.min(15000, baseTime * 0.1); // Max 15 seconds overhead
    
    return baseTime + overhead;
  }

  private calculateSummarizationTime(fileSizeMB: number): number {
    // Summarization has a base time plus small scaling factor
    const scalingFactor = Math.min(10000, fileSizeMB * 500); // Max 10 seconds scaling
    
    return this.settings.summarizationBaseTime + scalingFactor;
  }

  private estimateAudioDuration(file: File): number {
    // Rough estimation based on file size and common bitrates
    const fileSizeMB = file.size / (1024 * 1024);
    
    // Use higher bitrate assumption for better quality audio files
    // Based on actual data: 131.3MB = 27 minutes ≈ 700 kbps
    const avgBitrateKbps = 700; // Much more realistic for high-quality audio
    const avgBitrateMBps = avgBitrateKbps / 8 / 1024; // Convert to MB per second
    
    const estimatedDurationSeconds = fileSizeMB / avgBitrateMBps;
    const estimatedMinutes = estimatedDurationSeconds / 60;
    
    // Clamp to reasonable bounds (30 seconds to 4 hours)
    return Math.max(0.5, Math.min(240, estimatedMinutes));
  }

  private getStageTime(estimation: ProgressEstimation, stage: ProcessingStage): number {
    switch (stage) {
      case 'upload': return estimation.uploadTime;
      case 'processing': return estimation.processingTime;
      case 'transcription': return estimation.transcriptionTime;
      case 'summarization': return estimation.summarizationTime;
      default: return 0;
    }
  }

  private applyHistoricalCalibration(
    estimation: ProgressEstimation, 
    fileSizeMB: number
  ): ProgressEstimation {
    const sizeCategory = this.getFileSizeCategory(fileSizeMB);
    const historicalTimes = this.historicalData.get(sizeCategory);
    
    if (!historicalTimes || historicalTimes.length < 3) {
      return estimation; // Not enough data for calibration
    }
    
    // Calculate average of historical times
    const avgHistoricalTime = historicalTimes.reduce((sum, time) => sum + time, 0) / historicalTimes.length;
    
    // Calculate calibration factor
    const calibrationFactor = avgHistoricalTime / estimation.totalTime;
    
    // Apply calibration (but limit extreme adjustments)
    const clampedFactor = Math.max(0.5, Math.min(2.0, calibrationFactor));
    
    return {
      uploadTime: estimation.uploadTime * clampedFactor,
      processingTime: estimation.processingTime * clampedFactor,
      transcriptionTime: estimation.transcriptionTime * clampedFactor,
      summarizationTime: estimation.summarizationTime * clampedFactor,
      totalTime: estimation.totalTime * clampedFactor,
    };
  }

  private getFileSizeCategory(fileSizeMB: number): string {
    if (fileSizeMB < 5) return 'small';
    if (fileSizeMB < 25) return 'medium';
    return 'large';
  }

  private loadHistoricalData(): void {
    try {
      const stored = localStorage.getItem('progressEstimationHistory');
      if (stored) {
        const data = JSON.parse(stored);
        this.historicalData = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load historical progress data:', error);
    }
  }

  private saveHistoricalData(): void {
    try {
      const data = Object.fromEntries(this.historicalData);
      localStorage.setItem('progressEstimationHistory', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save historical progress data:', error);
    }
  }
}

// Singleton instance
export const progressEstimator = new ProgressEstimatorService();

// Utility functions for common operations
export const estimateFileProcessingTime = (file: File): ProgressEstimation => {
  return progressEstimator.estimateProcessingTime(file);
};

export const calculateTimeRemaining = (
  estimation: ProgressEstimation,
  currentStage: ProcessingStage,
  stageProgress: number
): number => {
  return progressEstimator.calculateTimeRemaining(estimation, currentStage, stageProgress);
};

export const recordActualProcessingTime = (fileSizeMB: number, actualTime: number): void => {
  progressEstimator.recordActualTime(fileSizeMB, actualTime);
};