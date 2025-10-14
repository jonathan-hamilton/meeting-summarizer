import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import TranscriptDisplay from './TranscriptDisplay';
import apiService from '../services/apiService';
import { useAuthStore } from '../stores/authStore';
import type { TranscriptionResponse } from '../types';

const TranscriptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [transcription, setTranscription] = useState<TranscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No meeting ID provided');
      setLoading(false);
      return;
    }

    // Wait for auth initialization to complete
    if (isAuthLoading) {
      return;
    }

    // Check if user is authenticated - handled in render logic below
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchTranscript = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to get the meeting details
        const response = await apiService.getMeetingById(id);
        
        if (!response.success || !response.data) {
          throw new Error('Meeting not found');
        }

        const meeting = response.data;
        
        // Parse transcription JSON if available
        let parsedTranscription = null;
        let speakerSegments = [];
        let transcribedText = '';
        
        if (meeting.transcriptionJson) {
          try {
            parsedTranscription = JSON.parse(meeting.transcriptionJson);
            // Handle different possible structures of transcription data
            if (parsedTranscription.Segments) {
              speakerSegments = parsedTranscription.Segments;
            } else if (parsedTranscription.segments) {
              speakerSegments = parsedTranscription.segments;
            } else if (Array.isArray(parsedTranscription)) {
              speakerSegments = parsedTranscription;
            }
            
            if (parsedTranscription.Text) {
              transcribedText = parsedTranscription.Text;
            } else if (parsedTranscription.text) {
              transcribedText = parsedTranscription.text;
            } else if (speakerSegments.length > 0) {
              // Build full text from segments
              transcribedText = speakerSegments.map((segment: any) => segment.text).join(' ');
            }
          } catch (parseError) {
            console.warn('Failed to parse transcription JSON:', parseError);
          }
        }
        
        // Convert meeting data to TranscriptionResponse format
        const transcriptionResponse: TranscriptionResponse = {
          transcriptionId: meeting.id,
          fileName: meeting.originalFileName || meeting.title,
          fileSize: meeting.fileSizeBytes || 0,
          status: meeting.status,
          transcribedText: transcribedText,
          speakerSegments: speakerSegments,
          processingTimeMs: 0, // Not available from meeting endpoint
          createdAt: meeting.createdAt,
          completedAt: meeting.completedAt,
          duration: meeting.durationSeconds,
          speakerCount: meeting.speakerCount,
          hasSpeakerDiarization: speakerSegments.length > 0 && speakerSegments.some((s: any) => s.speaker),
        };

        setTranscription(transcriptionResponse);
        
      } catch (err) {
        console.error('❌ Failed to fetch transcript:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transcript');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [id, isAuthenticated, isAuthLoading]);

  const handleBack = () => {
    navigate('/history');
  };

  // Show nothing if user is not authenticated - let the main app handle auth UI
  if (!isAuthLoading && !isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '400px',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading transcript...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to History
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!transcription) {
    return (
      <Box sx={{ p: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to History
        </Button>
        <Alert severity="warning">
          Transcript not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to History
      </Button>
      
      <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {transcription.fileName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Meeting ID: {transcription.transcriptionId}
        </Typography>
      </Paper>

      <TranscriptDisplay
        transcription={transcription}
        loading={false}
      />
    </Box>
  );
};

export default TranscriptPage;