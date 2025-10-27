import React, { useRef, useCallback, useState } from 'react';
import {
  Paper,
  Typography,
  useTheme,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { CloudUpload, ExpandMore, BugReport } from '@mui/icons-material';
import { type FileRejection } from 'react-dropzone';
import { isValidAudioFile, formatFileSize } from './validation';
import { MAX_FILE_SIZE } from './types';

interface IOSSafariFileUploadProps {
  onFilesDropped: (acceptedFiles: File[], rejections: FileRejection[]) => void;
}

// Debug state interface
interface DebugState {
  detectionInfo: {
    userAgent: string;
    platform: string;
    touchSupport: boolean;
    componentMounted: boolean;
  };
  interactions: string[];
  lastError: string | null;
  fileAttempts: number;
}

/**
 * iOS Safari-specific file upload component
 * Completely bypasses react-dropzone to avoid iOS Safari compatibility issues
 */
export const IOSSafariFileUpload: React.FC<IOSSafariFileUploadProps> = ({
  onFilesDropped,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debug state for visual debugging
  const [debugState, setDebugState] = useState<DebugState>({
    detectionInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      touchSupport: 'ontouchstart' in window,
      componentMounted: false,
    },
    interactions: [],
    lastError: null,
    fileAttempts: 0,
  });

  // Helper to add debug log
  const addDebugLog = useCallback((message: string) => {
    setDebugState(prev => ({
      ...prev,
      interactions: [...prev.interactions.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]
    }));
  }, []);

  // Helper to set debug error
  const setDebugError = useCallback((error: string) => {
    setDebugState(prev => ({
      ...prev,
      lastError: error
    }));
  }, []);

  // Track page load for iOS Safari debugging
  React.useEffect(() => {
    const trackPageLoad = async () => {
      addDebugLog('IOSSafariFileUpload component mounted');
      setDebugState(prev => ({
        ...prev,
        detectionInfo: { ...prev.detectionInfo, componentMounted: true }
      }));
      
      console.log('🍎 IOSSafariFileUpload component mounted');
      console.log('🍎 User Agent:', navigator.userAgent);
      console.log('🍎 Platform:', navigator.platform);
      console.log('🍎 Touch support:', 'ontouchstart' in window);
      
      try {
        await fetch('/api/IOSSafariDebug/pageload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 'IOSSafariFileUpload',
            componentDetected: true,
            pattern: 'file-extensions-instead-of-MIME-types-v2',
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            touchSupport: 'ontouchstart' in window
          })
        });
        addDebugLog('API tracking call successful');
      } catch (error) {
        console.error('Failed to track page load:', error);
        setDebugError(`API tracking failed: ${error}`);
      }
    };
    trackPageLoad();
  }, [addDebugLog, setDebugError]);

  const handleFileSelection = useCallback((files: FileList | null) => {
    addDebugLog(`File selection triggered: ${files?.length || 0} files`);
    
    if (!files || files.length === 0) {
      console.log('🍎 iOS Safari: No files selected');
      addDebugLog('No files selected');
      return;
    }

    console.log('🍎 iOS Safari: Processing', files.length, 'files');
    addDebugLog(`Processing ${files.length} files`);
    
    const acceptedFiles: File[] = [];
    const rejections: FileRejection[] = [];

    Array.from(files).forEach((file) => {
      console.log('🍎 iOS Safari: Validating file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      
      addDebugLog(`Validating: ${file.name} (${file.type})`);

      // Validate file
      if (!isValidAudioFile(file)) {
        console.log('🍎 iOS Safari: File rejected - invalid type:', file.name);
        addDebugLog(`❌ Rejected: ${file.name} - invalid type`);
        rejections.push({
          file,
          errors: [{ code: 'file-invalid-type', message: 'File type not supported' }]
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        console.log('🍎 iOS Safari: File rejected - too large:', file.name, formatFileSize(file.size));
        addDebugLog(`❌ Rejected: ${file.name} - too large`);
        rejections.push({
          file,
          errors: [{ code: 'file-too-large', message: `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}` }]
        });
        return;
      }

      console.log('🍎 iOS Safari: File accepted:', file.name);
      addDebugLog(`✅ Accepted: ${file.name}`);
      acceptedFiles.push(file);
    });

    console.log('🍎 iOS Safari: Final result - Accepted:', acceptedFiles.length, 'Rejected:', rejections.length);
    addDebugLog(`Final: ${acceptedFiles.length} accepted, ${rejections.length} rejected`);
    
    setDebugState(prev => ({
      ...prev,
      fileAttempts: prev.fileAttempts + 1
    }));
    
    onFilesDropped(acceptedFiles, rejections);

    // Reset input for next selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesDropped, addDebugLog]);

  const handleInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🍎 iOS Safari: File input change event triggered (programmatic approach)');
    addDebugLog('File input change event triggered');
    
    // Track file selection for debugging
    try {
      await fetch('/api/IOSSafariDebug/fileinput', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'fileSelectionChanged',
          pattern: 'react-dropzone-issue-1039-fix',
          acceptAttribute: event.target?.accept || 'none (all files allowed)',
          solution: 'specific-MIME-types-instead-of-audio-wildcard'
        })
      });
      addDebugLog('File input API tracking successful');
    } catch (error) {
      console.error('Failed to track file selection:', error);
      setDebugError(`File input tracking failed: ${error}`);
    }
    
    handleFileSelection(event.target.files);
  }, [handleFileSelection, addDebugLog, setDebugError]);

  // iOS Safari multiple approach file input trigger
  const triggerFileInput = useCallback(() => {
    console.log('🍎 iOS Safari: Triggering file input - User Agent:', navigator.userAgent);
    addDebugLog('Button clicked - triggering file input');
    
    // Create fresh input element (iOS Safari works better with dynamic inputs)
    console.log('🍎 iOS Safari: Creating fresh input element for better compatibility');
    addDebugLog('Creating dynamic input element');
    
    try {
      const input = document.createElement('input');
      input.type = 'file';
      
      // iOS Safari fix: Use file extensions instead of MIME types for maximum compatibility
      // Some iOS Safari versions ignore MIME types entirely, file extensions are more reliable
      input.accept = '.mp3,.mp4,.m4a,.wav,.flac,.ogg,.webm,.aac';
      input.multiple = false; // Single file selection for iOS Safari compatibility
      
      // Critical for iOS Safari: Input must be temporarily in DOM and properly styled
      input.style.position = 'fixed';
      input.style.top = '-10000px';
      input.style.left = '-10000px';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      input.style.zIndex = '-1';
      document.body.appendChild(input);
      
      addDebugLog('Dynamic input added to DOM');
      
      // Set up change handler
      input.onchange = (e) => {
        const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
        console.log('🍎 iOS Safari: File selected via dynamic input:', event.target.files?.length);
        addDebugLog(`File selected: ${event.target.files?.length || 0} files`);
        handleInputChange(event);
        // Remove from DOM after processing
        setTimeout(() => {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
            addDebugLog('Dynamic input cleaned up');
            console.log('🍎 iOS Safari: Dynamic input cleaned up');
          }
        }, 200);
      };
      
      // Set up cancel handler (iOS Safari specific)
      input.oncancel = () => {
        console.log('🍎 iOS Safari: File selection cancelled');
        addDebugLog('File selection cancelled');
        setTimeout(() => {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
            addDebugLog('Cancelled dynamic input cleaned up');
            console.log('🍎 iOS Safari: Cancelled dynamic input cleaned up');
          }
        }, 200);
      };
      
      // iOS Safari requires user gesture to be immediate - no setTimeout
      console.log('🍎 iOS Safari: Triggering click immediately (user gesture preservation)');
      addDebugLog('Triggering file picker immediately');
      input.click();
      
    } catch (error) {
      console.error('🍎 iOS Safari: Error creating file input:', error);
      setDebugError(`File input creation failed: ${error}`);
      addDebugLog(`❌ Error: ${error}`);
    }
  }, [handleInputChange, addDebugLog, setDebugError]);

  return (
    <>
      {/* Visual Debug Panel for iOS Safari */}
      <Box sx={{ mb: 2 }}>
        <Accordion defaultExpanded={false} sx={{ backgroundColor: '#f5f5f5' }}>
          <AccordionSummary 
            expandIcon={<ExpandMore />}
            sx={{ 
              backgroundColor: '#e3f2fd',
              '& .MuiAccordionSummary-content': {
                alignItems: 'center'
              }
            }}
          >
            <BugReport sx={{ mr: 1, color: '#1976d2' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              iOS Safari Debug Info (Tap to expand)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                Detection Status:
              </Typography>
              <Box sx={{ ml: 1, mb: 2 }}>
                <div>✅ Component Mounted: {debugState.detectionInfo.componentMounted ? 'Yes' : 'No'}</div>
                <div>📱 Touch Support: {debugState.detectionInfo.touchSupport ? 'Yes' : 'No'}</div>
                <div>🔄 File Attempts: {debugState.fileAttempts}</div>
                <div>🏷️ Platform: {debugState.detectionInfo.platform}</div>
              </Box>

              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                User Agent:
              </Typography>
              <Box sx={{ ml: 1, mb: 2, wordBreak: 'break-all', fontSize: '10px' }}>
                {debugState.detectionInfo.userAgent}
              </Box>

              {debugState.lastError && (
                <>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: 'error.main' }}>
                    Last Error:
                  </Typography>
                  <Box sx={{ ml: 1, mb: 2, color: 'error.main', fontSize: '10px' }}>
                    {debugState.lastError}
                  </Box>
                </>
              )}

              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                Recent Activity:
              </Typography>
              <Box sx={{ ml: 1 }}>
                {debugState.interactions.length === 0 ? (
                  <div style={{ color: '#666' }}>No activity yet</div>
                ) : (
                  debugState.interactions.map((log, index) => (
                    <div key={index} style={{ marginBottom: '2px', fontSize: '10px' }}>
                      {log}
                    </div>
                  ))
                )}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      <Paper
      elevation={2}
      sx={{
        p: 4,
        textAlign: 'center',
        border: `2px dashed ${theme.palette.primary.main}`,
        borderRadius: 2,
        backgroundColor: theme.palette.background.default,
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          borderColor: theme.palette.primary.dark,
        },
      }}
    >
      <CloudUpload
        sx={{
          fontSize: 64,
          color: theme.palette.primary.main,
          mb: 2,
        }}
      />
      
      <Typography variant="h6" gutterBottom>
        Select Audio File
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        iOS Safari Fix: File Extensions (more reliable than MIME types)
        <br />
        Supported: .wav, .mp3, .mp4, .m4a, .flac, .ogg, .webm, .aac
        <br />
        Maximum size: {formatFileSize(MAX_FILE_SIZE)}
      </Typography>

      {/* iOS Safari: Optimized button for touch events */}
      <form>
        <button
          type="button"
          onClick={triggerFileInput}
          style={{
            fontSize: '18px',
            padding: '15px 25px',
            border: '3px solid #007AFF',
            borderRadius: '12px',
            backgroundColor: '#007AFF',
            color: 'white',
            cursor: 'pointer',
            outline: 'none',
            fontWeight: 'bold',
            minWidth: '250px',
            textAlign: 'center',
            WebkitTapHighlightColor: 'transparent', // Remove iOS Safari tap highlight
            WebkitTouchCallout: 'none', // Disable iOS Safari callout
            WebkitUserSelect: 'none', // Disable text selection
            userSelect: 'none',
            touchAction: 'manipulation' // iOS Safari touch optimization
          }}
        >
          Choose Audio File
        </button>
        {/* Hidden fallback input with file extensions (more reliable than MIME types in iOS Safari) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.mp4,.m4a,.wav,.flac,.ogg,.webm,.aac"
          multiple={false}
          onChange={handleInputChange}
          style={{
            position: 'fixed',
            top: '-10000px',
            left: '-10000px',
            opacity: 0,
            width: '1px',
            height: '1px',
            pointerEvents: 'none',
            zIndex: -1
          }}
        />
      </form>

      {/* Debug information for iOS Safari */}
      <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.7 }}>
        iOS Safari • File Extensions Fix • User Gesture Preservation
      </Typography>
    </Paper>
    </>
  );
};