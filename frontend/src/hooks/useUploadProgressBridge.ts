import { useEffect, useCallback } from 'react';
import { useUploadQueueStore } from '../stores/uploadQueueStore';
import { useProgress } from '../contexts/ProgressContext';
import type { ProcessingStage } from '../types/progress';

/**
 * Hook that integrates the existing uploadQueueStore with the new progress system.
 * This provides backward compatibility while adding enhanced progress features.
 */
export const useUploadProgress = () => {
  const { uploadFiles, updateUploadFile } = useUploadQueueStore();
  const { 
    startFileProgress, 
    updateFileProgress, 
    completeFileProgress, 
    cancelFileProgress,
    fileProgress 
  } = useProgress();

  // Sync upload queue changes to progress system
  useEffect(() => {
    uploadFiles.forEach(uploadFile => {
      const progressData = fileProgress.get(uploadFile.id);
      
      // Start progress tracking if not already started
      if (!progressData && uploadFile.status !== 'pending') {
        startFileProgress(uploadFile.id, uploadFile.file);
      }
      
      // Update progress based on upload queue status
      if (progressData) {
        const stage = mapUploadStatusToProgressStage(uploadFile.status);
        const percentage = uploadFile.progress;
        
        // Only update if stage or percentage changed
        if (stage !== progressData.currentStage || percentage !== progressData.percentage) {
          if (uploadFile.status === 'completed' && uploadFile.result) {
            completeFileProgress(uploadFile.id, true);
          } else if (uploadFile.status === 'error') {
            completeFileProgress(uploadFile.id, false, uploadFile.error);
          } else {
            updateFileProgress(uploadFile.id, stage, percentage);
          }
        }
      }
    });
  }, [uploadFiles, fileProgress, startFileProgress, updateFileProgress, completeFileProgress]);

  // Enhanced upload methods that integrate with progress system
  const startUpload = useCallback((file: File, fileId: string) => {
    // Start progress tracking
    startFileProgress(fileId, file);
    
    // Add to upload queue
    const uploadFile = {
      file,
      id: fileId,
      status: 'uploading' as const,
      progress: 0,
    };
    
    // This would normally be done by the existing upload logic
    // We're just ensuring progress is started
    return uploadFile;
  }, [startFileProgress]);

  const updateUpload = useCallback((fileId: string, status: string, progress: number, result?: any, error?: string) => {
    // Update upload queue store
    updateUploadFile(fileId, { 
      status: status as any, 
      progress, 
      result, 
      error 
    });
    
    // Progress system will be updated via the useEffect above
  }, [updateUploadFile]);

  const cancelUpload = useCallback((fileId: string) => {
    cancelFileProgress(fileId);
    updateUploadFile(fileId, { status: 'error', error: 'Cancelled by user' });
  }, [cancelFileProgress, updateUploadFile]);

  return {
    // Original upload queue data
    uploadFiles,
    
    // Enhanced progress data
    fileProgress,
    
    // Enhanced methods
    startUpload,
    updateUpload,
    cancelUpload,
  };
};

/**
 * Map upload queue status to progress stage
 */
function mapUploadStatusToProgressStage(status: string): ProcessingStage {
  switch (status) {
    case 'uploading':
      return 'upload';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'complete';
    default:
      return 'upload'; // Default to upload stage
  }
}

/**
 * Map progress stage back to upload queue status for compatibility
 */
export function mapProgressStageToUploadStatus(stage: ProcessingStage): string {
  switch (stage) {
    case 'upload':
      return 'uploading';
    case 'processing':
      return 'processing';
    case 'transcription':
      return 'processing'; // Map transcription to processing for compatibility
    case 'summarization':
      return 'processing'; // Map summarization to processing for compatibility
    case 'complete':
      return 'completed';
    default:
      return 'pending';
  }
}