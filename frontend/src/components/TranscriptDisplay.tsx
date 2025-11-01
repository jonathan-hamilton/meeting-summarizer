import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Tooltip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Collapse,
} from "@mui/material";
import {
  PictureAsPdf,
  Person,
  Schedule,
  Error,
  Email,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import type { TranscriptionResponse, SpeakerMapping } from "../types";
import { SpeakerMappingComponent } from "./SpeakerMapping";
import { useEmailStore } from "../stores/emailStore";

// Lazy load heavy dialogs to reduce bundle size (S8.6 Performance Optimization)
const SpeakerMappingDialog = React.lazy(() => import("./SpeakerMappingDialog").then(m => ({ default: m.SpeakerMappingDialog })));
const EmailCompositionDialog = React.lazy(() => import("./EmailCompositionDialog"));

import SummaryDisplay from "./SummaryDisplay";
import { TranscriptSpeakerSegment } from "./TranscriptSpeakerSegment";
import { sessionManager } from "../services/sessionManager";

import { useSpeakerSessionStore, useActiveSpeakers } from "../stores/speakerSessionStore";
import { useSessionManagement } from "../hooks/useSessionManagement";
import { ConfirmTranscriptionDeleteDialog } from "./dialogs/ConfirmTranscriptionDeleteDialog";
// import { useAppMode } from "../contexts/AppModeContext"; // Available for future use
import { apiService } from "../services/apiService";
import { emailService } from "../services/emailService";

interface TranscriptDisplayProps {
  transcription: TranscriptionResponse;
  loading?: boolean;
  speakerMappings?: SpeakerMapping[]; // Optional external speaker mappings
  aiSummaryRef?: React.RefCallback<HTMLElement>; // Optional ref for scroll positioning
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcription,
  loading = false,
  aiSummaryRef,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [forceUpdate, setForceUpdate] = useState(0);
  const [speakerMappingDialogOpen, setSpeakerMappingDialogOpen] =
    useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [showAllMetadata, setShowAllMetadata] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // S6.5 Phase 3: Email dialog state using Zustand store
  const { openDialog: openEmailDialog, closeDialog: closeEmailDialog } = useEmailStore();
  const location = useLocation();

  // Email button ref for direct event listener attachment
  const emailButtonRef = useRef<HTMLButtonElement>(null);

  // Centralized store state and actions
  const storeSpeakerMappings = useSpeakerSessionStore(state => state.speakerMappings);
  const storeCurrentSegments = useSpeakerSessionStore(state => state.currentSegments);
  const storeTranscriptionId = useSpeakerSessionStore(state => state.transcriptionId);
  const initializeSessionWithAutoLoad = useSpeakerSessionStore(state => state.initializeSessionWithAutoLoad);
  const reassignSegment = useSpeakerSessionStore(state => state.reassignSegment);
  const saveSpeakerMappingsToApi = useSpeakerSessionStore(state => state.saveSpeakerMappingsToApi);
  
  // Use current segments from store (reflects reassignments), fallback to original transcription
  const speakerSegments = storeCurrentSegments.length > 0 ? storeCurrentSegments : (transcription.speakerSegments || []);
  
  // Simplified initialization - the store handles all the complexity
  const initializeForTranscript = useCallback(async (transcriptionId: string) => {
    const rawSegments = transcription.speakerSegments || [];
    
    // Transform API segments (capitalized properties) to store format (lowercase properties)
    const segmentsForStore = rawSegments.map(segment => {
      const apiSegment = segment as any;
      return {
        speaker: apiSegment.Speaker || segment.speaker,
        text: apiSegment.Text || segment.text,
        start: apiSegment.Start || segment.start,
        end: apiSegment.End || segment.end,
        confidence: apiSegment.Confidence || segment.confidence
      };
    });
    
    // Use the new reactive method that handles loading automatically
    return await initializeSessionWithAutoLoad(transcriptionId, segmentsForStore);
  }, [transcription.speakerSegments, initializeSessionWithAutoLoad]);
  
  // Centralized store hooks
  const activeSpeakers = useActiveSpeakers();

  // Session management for privacy controls
  // Session management for privacy controls (currently unused but kept for future use)
  const { privacyControls: _privacyControls } = useSessionManagement();

  // App mode management
  // const { mode } = useAppMode(); // Available for future use

  // Memoize extracted unique speakers from original transcript segments (not modified ones)
  const allDetectedSpeakers = useMemo(() => {
    const speakers = transcription.speakerSegments
      ? Array.from(new Set(transcription.speakerSegments.map((s) => (s as any).Speaker || s.speaker)))
      : [];
    
    return speakers;
  }, [transcription.speakerSegments, transcription.transcriptionId]);

  // Memoize effective speaker mappings
  const effectiveSpeakerMappings = useMemo(() => {
    return storeSpeakerMappings;
  }, [storeSpeakerMappings]);

  // Memoize detected speakers with fallback - derive from store mappings
  const storeDetectedSpeakers = useMemo(() => {
    return storeSpeakerMappings.map(mapping => mapping.speakerId);
  }, [storeSpeakerMappings]);

  const detectedSpeakers = useMemo(() => {
    return storeDetectedSpeakers.length > 0
      ? storeDetectedSpeakers
      : allDetectedSpeakers;
  }, [storeDetectedSpeakers, allDetectedSpeakers]);

  // Calculate currently active speakers from current segments (after reassignments)
  // Use the store's getActiveSpeakers method which correctly excludes "Unassigned" speakers
  const currentlyActiveSpeakers = useMemo(() => {
    const storeActiveSpeakers = activeSpeakers; // Use store's method that excludes "Unassigned"
    return storeActiveSpeakers;
  }, [activeSpeakers, speakerSegments]);

  // Memoize detected speakers filtered by currently active speakers (speakers with segments)
  const filteredDetectedSpeakers = useMemo(() => {
    const result = storeDetectedSpeakers.length > 0
      ? storeDetectedSpeakers.filter(speakerId => currentlyActiveSpeakers.includes(speakerId))
      : currentlyActiveSpeakers;
    return result;
  }, [storeDetectedSpeakers, currentlyActiveSpeakers]);

  // Memoize current active speakers (excluding deleted ones)
  const currentActiveSpeakers = useMemo(() => {
    const baseSpeakers = detectedSpeakers;
    
    // Only filter out speakers if:
    // 1. We have mappings AND 
    // 2. There are fewer mappings than detected speakers (indicating deletions)
    if (storeSpeakerMappings.length > 0 && storeSpeakerMappings.length < detectedSpeakers.length) {
      // Filter to only include speakers that have mappings (excludes deleted speakers)
      return baseSpeakers.filter(speakerId => {
        return storeSpeakerMappings.some(mapping => mapping.speakerId === speakerId);
      });
    }
    
    return baseSpeakers;
  }, [detectedSpeakers, storeSpeakerMappings]);

  // Memoize session overrides
  const sessionOverrides = useMemo(() => {
    return sessionManager.getOverrides();
  }, [forceUpdate]);

  // Simple reactive initialization - when transcript changes, initialize the session
  useEffect(() => {
    if (transcription.transcriptionId && storeTranscriptionId !== transcription.transcriptionId) {
      // Clear session overrides for new transcriptions
      sessionManager.clearSpeakerOverrides();
      initializeForTranscript(transcription.transcriptionId);
    }
  }, [transcription.transcriptionId, storeTranscriptionId, initializeForTranscript]);

  // Create stable event handler using refs to avoid stale closures
  const stableEmailHandler = useCallback(() => {
    openEmailDialog({
      transcriptData: {
        transcriptionId: transcription.transcriptionId,
        fileName: transcription.fileName,
        speakerSegments: speakerSegments,
        transcribedText: transcription.transcribedText || ''
      },
      speakerMappings: storeSpeakerMappings,
    });
  }, [openEmailDialog, transcription.transcriptionId, transcription.fileName, transcription.transcribedText, speakerSegments, storeSpeakerMappings]);

  // Direct event listener for email button to bypass React synthetic events
  useEffect(() => {
    const button = emailButtonRef.current;
    if (button) {
      const handleDirectClick = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        stableEmailHandler();
      };

      // Add a unique identifier to track button instances
      const buttonId = `email-button-${Date.now()}-${Math.random()}`;
      button.setAttribute('data-button-id', buttonId);
      
      button.addEventListener('click', handleDirectClick, true); // Use capture phase

      return () => {
        if (button && button.removeEventListener) {
          button.removeEventListener('click', handleDirectClick, true);
        }
      };
    }
  }, [stableEmailHandler]); // Only depend on the stable handler

  // Memoize transcript structure invalidation (for confidence score strikethrough)
  const isTranscriptStructureInvalidated = useMemo(() => {
    // Check if any speaker segments have been reassigned (structural change)
    const originalSegments = transcription.speakerSegments || [];
    const currentSegments = speakerSegments;
    
    const hasSegmentReassignments = currentSegments.some((segment, index) => {
      const originalSegment = originalSegments[index];
      return originalSegment && segment.speaker !== originalSegment.speaker;
    });

    // Check for session overrides (dropdown reassignments)
    const hasSessionOverrides = Object.keys(sessionOverrides).length > 0;

    // Check if speakers have been deleted (fewer active speakers than original)
    const originalSpeakerCount = allDetectedSpeakers.length;
    const currentActiveSpeakerCount = currentActiveSpeakers.length;
    const hasSpeakerDeletions = currentActiveSpeakerCount < originalSpeakerCount;

    // Confidence is invalidated by structural changes, NOT by name/role assignments
    return hasSegmentReassignments || hasSessionOverrides || hasSpeakerDeletions;
  }, [
    transcription.speakerSegments,
    speakerSegments,
    sessionOverrides,
    allDetectedSpeakers.length,
    currentActiveSpeakers.length,
  ]);

  // Memoize speaker mapping statistics
  const speakerMappingStats = useMemo(() => {
    // Use currentlyActiveSpeakers (speakers with actual segments after reassignments) as the base
    const totalActiveSpeakers = currentlyActiveSpeakers.length;
    
    // Count speakers with custom names (name different from speaker ID)
    const mappedCount = currentlyActiveSpeakers.filter((speakerId: string) => {
      const mapping = storeSpeakerMappings.find(m => m.speakerId === speakerId);
      // Consider mapped only if has a custom name (different from speaker ID)
      return mapping && mapping.name && mapping.name.trim() !== "" && mapping.name !== speakerId;
    }).length;

    return {
      mappedCount: mappedCount,
      totalCount: totalActiveSpeakers,
      isFullyMapped: mappedCount === totalActiveSpeakers && totalActiveSpeakers > 0,
    };
  }, [currentlyActiveSpeakers, storeSpeakerMappings]);

  // Memoize event handlers
  const handleSpeakerMappingsChanged = useCallback(() => {
    setForceUpdate((prev) => prev + 1);
  }, []);

  const handleSpeakerMappingsSaved = useCallback(async (savedMappings: SpeakerMapping[]) => {
    try {
      // Save mappings to API via store - the store handles all synchronization
      const success = await saveSpeakerMappingsToApi(savedMappings);
      
      if (success) {
        // Store automatically updates its state, no manual synchronization needed
        console.log('Speaker mappings saved successfully');
      }
      
    } catch (error) {
      console.error('Failed to save speaker mappings to API:', error);
      // Don't prevent dialog from closing even if API fails
    }
    
    setSpeakerMappingDialogOpen(false);
    setForceUpdate((prev) => prev + 1);
  }, [saveSpeakerMappingsToApi]);

  const handleSpeakerSegmentChange = useCallback(
    (segmentIndex: number, newSpeaker: string) => {
      // Use store action for reassignment instead of local state
      reassignSegment(segmentIndex, newSpeaker);
      setForceUpdate((prev) => prev + 1);
    },
    [reassignSegment]
  );

  // Handle confirmed deletion - reset page to original state
  const handleConfirmDelete = useCallback(() => {
    setDeleteConfirmationOpen(false);
    // Reset the page to its original state by refreshing
    window.location.reload();
  }, []);

  // Handle cancel deletion
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmationOpen(false);
  }, []);



  // Memoize utility functions
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes < 1) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    let len = bytes;
    let order = 0;
    while (len >= 1024 && order < sizes.length - 1) {
      order++;
      len = len / 1024;
    }
    // Use same formatting as backend (0.## format)
    return `${(Math.round(len * 100) / 100).toFixed(2)} ${sizes[order]}`;
  }, []);



  // PDF download handler
  const handleDownloadPdf = useCallback(async () => {
    if (!transcription.transcriptionId) {
      console.error('No transcription ID available for PDF download');
      return;
    }

    setIsDownloadingPdf(true);
    try {
      await apiService.downloadTranscriptPdf(transcription.transcriptionId);
    } catch (error) {
      console.error('PDF download failed:', error);
      // You might want to show a toast notification here
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [transcription.transcriptionId]);

  // S6.5 Phase 3: Email functionality
  const isAppPage = location.pathname === '/app';
  const isTranscriptPage = location.pathname.startsWith('/transcript');
  const shouldShowEmailButton = isAppPage || isTranscriptPage;
  
  const handleEmailTranscript = useCallback(() => {
    // Open dialog with transcript context
    openEmailDialog({
      transcriptData: {
        transcriptionId: transcription.transcriptionId,
        fileName: transcription.fileName,
        speakerSegments: speakerSegments,
        transcribedText: transcription.transcribedText || ''
      },
      speakerMappings: storeSpeakerMappings,
      transcriptOnly: true,
      includeTranscriptDefault: true
    });
  }, [location.pathname, shouldShowEmailButton, openEmailDialog, transcription, speakerSegments, storeSpeakerMappings]);



  const handleEmailSend = useCallback(async (emailData: any) => {
    try {
      const result = await emailService.emailTranscript(transcription.transcriptionId, {
        recipients: emailData.recipients,
        subject: emailData.subject,
        includeTranscript: emailData.includeTranscript !== false // default to true
      });
      
      if (!result.success) {
        console.error('❌ Failed to send transcript email:', result.message);
      }
    } catch (error) {
      console.error('❌ Error sending transcript email:', error);
    } finally {
      closeEmailDialog();
    }
  }, [transcription.transcriptionId]);

  if (loading) {
    return (
      <Card sx={{ mb: 2, width: "100%" }}>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            py={4}
          >
            <CircularProgress size={40} sx={{ mr: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Processing transcription...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (transcription.status === "Failed" || transcription.errorMessage) {
    return (
      <Card sx={{ mb: 2, width: "100%" }}>
        <CardContent>
          <Alert severity="error" icon={<Error />}>
            <Typography variant="h6" gutterBottom>
              Transcription Failed
            </Typography>
            <Typography variant="body2">
              {transcription.errorMessage ||
                "An unknown error occurred during transcription."}
            </Typography>
          </Alert>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>File:</strong> {transcription.fileName} (
              {formatFileSize(transcription.fileSize)})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Processing Time:</strong> {transcription.processingTimeMs}
              ms
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="transcript-display" sx={{ mb: 2, width: "100%" }}>
      <CardContent>
        {/* Header with file info and metadata */}
        <Box sx={{ mb: 3, position: 'relative' }}>
          {/* File name - larger and more prominent on mobile */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: isMobile ? 3 : 2 }}>
            <Typography 
              variant={isMobile ? "h4" : "h5"} 
              component="h3"
              sx={{
                fontWeight: isMobile ? 600 : 500,
                textAlign: 'center',
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              {transcription.fileName}
            </Typography>
          </Box>

          {/* Essential metadata - always visible */}
          <Stack 
            direction={isMobile ? "column" : "row"} 
            spacing={isMobile ? 1 : 1} 
            flexWrap={isMobile ? "nowrap" : "wrap"} 
            sx={{ mb: 2 }}
          >
            <Chip
              icon={<Schedule />}
              label={`Processed in ${(transcription.processingTimeMs / 1000).toFixed(1)}s`}
              size={isMobile ? "medium" : "small"}
              variant="outlined"
              sx={{
                fontSize: isMobile ? '0.875rem' : '0.75rem',
                height: isMobile ? 40 : 32,
              }}
            />
            <Chip
              label={formatFileSize(transcription.fileSize)}
              size={isMobile ? "medium" : "small"}
              variant="outlined"
              sx={{
                fontSize: isMobile ? '0.875rem' : '0.75rem',
                height: isMobile ? 40 : 32,
              }}
            />
            {transcription.duration && (
              <Chip
                label={`Duration ${formatTime(transcription.duration)}`}
                size={isMobile ? "medium" : "small"}
                variant="outlined"
                sx={{
                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                  height: isMobile ? 40 : 32,
                }}
              />
            )}
            <Chip
              icon={<Person />}
              label={`${speakerMappingStats.mappedCount}/${speakerMappingStats.totalCount} speakers named`}
              size={isMobile ? "medium" : "small"}
              variant="outlined"
              color={speakerMappingStats.isFullyMapped ? "success" : "default"}
              sx={{
                fontSize: isMobile ? '0.875rem' : '0.75rem',
                height: isMobile ? 40 : 32,
              }}
            />
            {transcription.confidenceScore && (
              <Chip
                label={`${Math.round(transcription.confidenceScore * 100)}% confidence`}
                size={isMobile ? "medium" : "small"}
                variant="outlined"
                sx={{
                  fontSize: isMobile ? '0.875rem' : '0.75rem',
                  height: isMobile ? 40 : 32,
                  textDecoration: isTranscriptStructureInvalidated ? "line-through" : "none",
                  opacity: isTranscriptStructureInvalidated ? 0.7 : 1,
                }}
                title={
                  isTranscriptStructureInvalidated
                    ? "Original confidence - invalidated by transcript modifications"
                    : "Original transcription confidence"
                }
              />
            )}
          </Stack>

          {/* Additional metadata - collapsible on mobile */}
          {isMobile ? (
            <>
              <Collapse in={showAllMetadata} timeout={300}>
                <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
                  {transcription.detectedLanguage && (
                    <Chip
                      label={transcription.detectedLanguage.toUpperCase()}
                      size="medium"
                      variant="outlined"
                      sx={{
                        fontSize: '0.875rem',
                        height: 40,
                      }}
                    />
                  )}
                </Stack>
              </Collapse>
              
              {(transcription.confidenceScore || transcription.detectedLanguage) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Button
                    onClick={() => setShowAllMetadata(!showAllMetadata)}
                    startIcon={showAllMetadata ? <ExpandLess /> : <ExpandMore />}
                    variant="text"
                    size="medium"
                    sx={{
                      minHeight: 44,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    {showAllMetadata ? 'Show Less Info' : 'Show More Info'}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            // Desktop: show all metadata inline as before
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {transcription.detectedLanguage && (
                <Chip
                  label={transcription.detectedLanguage.toUpperCase()}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Speaker Mapping Section */}
        {filteredDetectedSpeakers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <SpeakerMappingComponent
              transcriptionId={transcription.transcriptionId}
              detectedSpeakers={filteredDetectedSpeakers}
              onMappingsChanged={handleSpeakerMappingsChanged}
              onMappingsSaved={handleSpeakerMappingsSaved}
            />
          </Box>
        )}

        {/* Speaker segments display */}
        {speakerSegments && speakerSegments.length > 0 ? (
          <>
            <Box
              id="transcript-display"
              component="section"
              role="region"
              aria-labelledby="transcript-heading"
              aria-describedby="transcript-description"
            >
            <Box sx={{ 
              position: 'relative',
              mb: isMobile ? 3 : 2,
              ...(isMobile ? {} : { minHeight: '60px' }) // Ensure space for buttons on desktop
            }}>
              {/* Centered text content */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                ...(isMobile ? { mb: 2 } : {})
              }}>
                <Typography 
                  id="transcript-heading"
                  variant={isMobile ? "h5" : "h6"} 
                  component="h4"
                  sx={{
                    fontWeight: isMobile ? 600 : 500,
                    mb: 0,
                    textAlign: 'center',
                  }}
                >
                  Transcript
                </Typography>
                <Typography 
                  id="transcript-description"
                  variant={isMobile ? "body1" : "body2"}
                  color="text.secondary"
                  sx={{ 
                    lineHeight: isMobile ? 1.5 : 1.2,
                    fontSize: isMobile ? '0.875rem' : '0.75rem',
                    textAlign: 'center',
                  }}
                >
                  Interactive meeting transcript with speaker segments.{isMobile ? '' : ' Use arrow keys to navigate between segments.'}
                </Typography>
              </Box>
              
              {/* Action buttons - absolutely positioned on desktop */}
              <Box sx={{ 
                display: 'flex', 
                gap: isMobile ? 2 : 1,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                ...(isMobile ? {} : {
                  position: 'absolute',
                  top: 0,
                  right: 0,
                })
              }}>
                <Tooltip title={isDownloadingPdf ? "Generating PDF..." : "Download Transcript as PDF"}>
                  <span>
                    <IconButton
                      size={isMobile ? "medium" : "small"}
                      onClick={handleDownloadPdf}
                      disabled={isDownloadingPdf}
                      color={isDownloadingPdf ? "primary" : "default"}
                      aria-label="Download Transcript as PDF"
                      aria-describedby="download-pdf-tooltip"
                      sx={{
                        minHeight: isMobile ? 44 : 'auto',
                        minWidth: isMobile ? 44 : 'auto',
                        border: isMobile ? '1px solid' : 'none',
                        borderColor: isMobile ? 'divider' : 'transparent',
                        '&:hover': isMobile ? {
                          borderColor: 'primary.main',
                          bgcolor: 'primary.50',
                        } : {},
                      }}
                    >
                      {isDownloadingPdf ? (
                        <CircularProgress size={isMobile ? 20 : 16} />
                      ) : (
                        <PictureAsPdf fontSize={isMobile ? "medium" : "small"} />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
                {/* Email button - shown on /app and /transcript pages */}
                {shouldShowEmailButton && (
                  <Tooltip title="Email Transcript">
                    <span>
                      <Button
                        variant="contained"
                        size={isMobile ? "medium" : "small"}
                        startIcon={<Email />}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEmailTranscript();
                        }}
                        sx={{ 
                          minHeight: isMobile ? 44 : 'auto',
                          fontSize: isMobile ? '0.875rem' : '0.75rem',
                          textTransform: 'none',
                          fontWeight: 500,
                        }}
                        aria-label="Email Transcript"
                      >
                        Email
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Speaker segments */}
            <Box sx={{ 
              maxHeight: "400px", 
              overflowY: "auto", 
              padding: 2,
              backgroundColor: "background.default",
              borderRadius: 1,
              border: 1,
              borderColor: "divider"
            }}>
              
              {speakerSegments.map((segment, index) => {
                return (
                <Box 
                  key={`${index}-${forceUpdate}`} 
                  sx={{ mb: 2 }}
                >
                  <TranscriptSpeakerSegment
                    segment={segment}
                    index={index}
                    speakerMappings={effectiveSpeakerMappings}
                    showReassignControls={true}
                    onSpeakerChange={handleSpeakerSegmentChange}
                    isTranscriptStructureInvalidated={isTranscriptStructureInvalidated}
                  />
                </Box>
                );
              })}
            </Box>
          </Box>
          </>
        ) : transcription.transcribedText ? (
          /* Fallback to simple text display */
          <>
            {(() => {
              console.log('📝 USING FALLBACK RENDER PATH - Simple text display');
              return null;
            })()}
            <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" component="h4">
                Transcript
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title={isDownloadingPdf ? "Generating PDF..." : "Download Transcript as PDF"}>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    color={isDownloadingPdf ? "primary" : "default"}
                    aria-label="Download Transcript as PDF"
                    aria-describedby="download-pdf-tooltip"
                  >
                    {isDownloadingPdf ? (
                      <CircularProgress size={16} />
                    ) : (
                      <PictureAsPdf fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              {/* Email button - shown on /app and /transcript pages (fallback section) */}
              {shouldShowEmailButton && (
                <Tooltip title="Email Transcript">
                  <span>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        console.log('🚨🚨🚨 FALLBACK CLICK EVENT FIRED 🚨🚨🚨');
                        console.log('Event:', e);
                        console.log('Current target:', e.currentTarget);
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('About to call handleEmailTranscript...');
                        handleEmailTranscript();
                        console.log('Called handleEmailTranscript');
                      }}
                      aria-label="Email Transcript"
                      sx={{ 
                        backgroundColor: 'green !important',
                        color: 'white !important',
                        border: '3px solid orange !important',
                        '&:hover': { backgroundColor: 'darkgreen !important' }
                      }}
                    >
                      📧 FALLBACK
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Stack>

            <Typography
              variant="body1"
              component="section"
              role="region"
              aria-label="Meeting transcript content"
              tabIndex={0}
              sx={{
                lineHeight: 1.6,
                userSelect: "text",
                cursor: "text",
                maxHeight: "400px",
                overflowY: "auto",
                p: 2,
                backgroundColor: "action.hover",
                borderRadius: 1,
              }}
            >
              {transcription.transcribedText}
            </Typography>
          </Box>
          </>
        ) : (
          <Alert severity="info">
            <Typography variant="body2">
              No transcript content available.
            </Typography>
          </Alert>
        )}

        {/* AI-Powered Meeting Summary Section */}
        {transcription.transcribedText && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <SummaryDisplay
              transcriptionId={transcription.transcriptionId}
              transcriptText={transcription.transcribedText || ""}
              speakerMappings={effectiveSpeakerMappings}
              detectedSpeakers={allDetectedSpeakers}
              aiSummaryRef={aiSummaryRef}
              fileName={transcription.fileName}
              speakerSegments={speakerSegments}
            />
          </Box>
        )}

        {/* Footer with timestamp */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Created: {new Date(transcription.createdAt).toLocaleString()}
            {transcription.completedAt && (
              <>
                {" "}
                | Completed:{" "}
                {new Date(transcription.completedAt).toLocaleString()}
              </>
            )}
          </Typography>
        </Box>
      </CardContent>

      {/* Speaker Mapping Dialog */}
      <Suspense fallback={<div>Loading speaker dialog...</div>}>
        <SpeakerMappingDialog
          open={speakerMappingDialogOpen}
          onClose={() => setSpeakerMappingDialogOpen(false)}
          transcriptionId={transcription.transcriptionId}
          existingMappings={storeSpeakerMappings || []}
          detectedSpeakers={detectedSpeakers}
          onMappingsSaved={handleSpeakerMappingsSaved}
        />
      </Suspense>

      {/* Transcription Delete Confirmation Dialog */}
      <ConfirmTranscriptionDeleteDialog
        open={deleteConfirmationOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Email Composition Dialog - for transcript emails on /app and /transcript pages */}
      {shouldShowEmailButton && (
        <>
          <Suspense fallback={<div>Loading email dialog...</div>}>
            <EmailCompositionDialog
              onSend={handleEmailSend}
            />
          </Suspense>
        </>
      )}
    </Card>
  );
};

export default TranscriptDisplay;
