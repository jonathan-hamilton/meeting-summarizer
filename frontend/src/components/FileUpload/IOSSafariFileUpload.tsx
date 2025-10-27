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
 * Research-based approach using MIME types + label triggering
 * Based on Can I Use data, WebKit documentation, and react-dropzone research
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
            pattern: 'research-based-MIME-types-plus-label-triggering-v3',
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
          pattern: 'research-based-MIME-types-plus-label-triggering-v3',
          acceptAttribute: event.target?.accept || 'none (all files allowed)',
          solution: 'Can-I-Use-data-MIME-types-only-plus-label-based-triggering'
        })
      });
      addDebugLog('File input API tracking successful');
    } catch (error) {
      console.error('Failed to track file selection:', error);
      setDebugError(`File input tracking failed: ${error}`);
    }
    
    handleFileSelection(event.target.files);
  }, [handleFileSelection, addDebugLog, setDebugError]);

  // Research-based approach: No programmatic triggering needed with label
  // iOS Safari handles label->input association natively

  return (
    <>
      {/* Visual Debug Panel for iOS Safari */}
      <Box sx={{ mb: 2 }}>
        <Accordion defaultExpanded={false} sx={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
          <AccordionSummary 
            expandIcon={<ExpandMore />}
            sx={{ 
              backgroundColor: '#e3f2fd',
              borderBottom: '1px solid #dee2e6',
              '& .MuiAccordionSummary-content': {
                alignItems: 'center'
              }
            }}
          >
            <BugReport sx={{ mr: 1, color: '#1976d2' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              iOS Safari Debug Info (Tap to expand)
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: '#ffffff', color: '#212529' }}>
            <Box sx={{ fontSize: '12px', fontFamily: 'monospace', color: '#212529' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#495057' }}>
                Detection Status:
              </Typography>
              <Box sx={{ ml: 1, mb: 2, color: '#212529' }}>
                <div>✅ Component Mounted: {debugState.detectionInfo.componentMounted ? 'Yes' : 'No'}</div>
                <div>📱 Touch Support: {debugState.detectionInfo.touchSupport ? 'Yes' : 'No'}</div>
                <div>🔄 File Attempts: {debugState.fileAttempts}</div>
                <div>🏷️ Platform: {debugState.detectionInfo.platform}</div>
              </Box>

              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#495057' }}>
                User Agent:
              </Typography>
              <Box sx={{ ml: 1, mb: 2, wordBreak: 'break-all', fontSize: '10px', color: '#6c757d', backgroundColor: '#f8f9fa', p: 1, borderRadius: '4px' }}>
                {debugState.detectionInfo.userAgent}
              </Box>

              {debugState.lastError && (
                <>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#dc3545' }}>
                    Last Error:
                  </Typography>
                  <Box sx={{ ml: 1, mb: 2, color: '#dc3545', fontSize: '10px', backgroundColor: '#f8d7da', p: 1, borderRadius: '4px', border: '1px solid #f5c6cb' }}>
                    {debugState.lastError}
                  </Box>
                </>
              )}

              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#495057' }}>
                Recent Activity:
              </Typography>
              <Box sx={{ ml: 1, backgroundColor: '#f8f9fa', p: 1, borderRadius: '4px', border: '1px solid #dee2e6' }}>
                {debugState.interactions.length === 0 ? (
                  <div style={{ color: '#6c757d' }}>No activity yet</div>
                ) : (
                  debugState.interactions.map((log, index) => (
                    <div key={index} style={{ marginBottom: '2px', fontSize: '10px', color: '#212529' }}>
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
        Research-Based iOS Safari Fix: MIME Types + Label Triggering
        <br />
        Supported: audio/mpeg, audio/wav, audio/mp4, audio/aac, audio/flac, audio/ogg, audio/webm
        <br />
        Maximum size: {formatFileSize(MAX_FILE_SIZE)}
      </Typography>

      {/* iOS Safari: Research-based label approach instead of programmatic click */}
      <form>
        <label 
          htmlFor="ios-safari-file-input"
          style={{
            display: 'inline-block',
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
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            touchAction: 'manipulation'
          }}
          onClick={() => {
            console.log('🍎 iOS Safari: Label clicked - delegating to native input');
            addDebugLog('Label clicked - using native browser behavior');
          }}
        >
          Choose Audio File
        </label>
        {/* Research-based iOS Safari fix: MIME types only + label association */}
        <input
          id="ios-safari-file-input"
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/flac,audio/ogg,audio/webm"
          multiple={false}
          onChange={handleInputChange}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            opacity: 0
          }}
        />
      </form>

      {/* Debug information for iOS Safari */}
      <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.7 }}>
        iOS Safari • Research-Based: MIME Types + Label Triggering • Can I Use Data
      </Typography>
    </Paper>
    </>
  );
};