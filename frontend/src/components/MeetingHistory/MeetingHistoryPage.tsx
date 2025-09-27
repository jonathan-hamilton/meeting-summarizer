import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Pagination,
  CircularProgress,
  Alert,
  Grid,
  Link,
} from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useMeetingHistoryStore } from '../../stores/meetingHistoryStore';
import { useMeetingHistorySignalR } from '../../hooks/useMeetingHistorySignalR';
import type { MeetingListItem } from '../../types/meeting';

// Smooth progress component to prevent jarring updates during real-time progress
const SmoothProgressIndicator: React.FC<{ 
  meeting: MeetingListItem; 
  targetProgress?: number; 
}> = ({ meeting, targetProgress }) => {
  const [smoothProgress, setSmoothProgress] = useState(meeting.progressPercentage || 0);
  const target = targetProgress ?? meeting.progressPercentage ?? 0;
  
  useEffect(() => {
    if (Math.abs(target - smoothProgress) <= 1) {
      setSmoothProgress(target);
      return;
    }
    
    const animationFrame = requestAnimationFrame(() => {
      setSmoothProgress(prev => {
        const diff = target - prev;
        const increment = Math.abs(diff) > 5 ? Math.sign(diff) * 2 : Math.sign(diff);
        return prev + increment;
      });
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [target, smoothProgress]);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
      <CircularProgress 
        size={16} 
        sx={{ mr: 1 }}
        variant="determinate"
        value={smoothProgress}
      />
      <Typography variant="caption">
        {Math.round(smoothProgress)}%
      </Typography>
    </Box>
  );
};
import { apiService } from '../../services/apiService';

const MeetingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  
  // Show nothing if user is not authenticated - let the main app handle auth UI
  if (!isAuthLoading && !isAuthenticated) {
    return null;
  }
  
  // Use individual selectors for better performance and reliability
  const meetings = useMeetingHistoryStore(state => state.meetings);
  const currentPage = useMeetingHistoryStore(state => state.currentPage);
  const totalPages = useMeetingHistoryStore(state => state.totalPages);
  const searchQuery = useMeetingHistoryStore(state => state.searchQuery);
  const sortBy = useMeetingHistoryStore(state => state.sortBy);
  const sortDirection = useMeetingHistoryStore(state => state.sortDirection);
  const isLoading = useMeetingHistoryStore(state => state.isLoading);
  const error = useMeetingHistoryStore(state => state.error);
  
  const loadMeetings = useMeetingHistoryStore(state => state.loadMeetings);
  const deleteMeeting = useMeetingHistoryStore(state => state.deleteMeeting);
  const setPage = useMeetingHistoryStore(state => state.setPage);
  const setSearchQuery = useMeetingHistoryStore(state => state.setSearchQuery);
  const setSorting = useMeetingHistoryStore(state => state.setSorting);
  const clearError = useMeetingHistoryStore(state => state.clearError);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingListItem | null>(null);

  // Enable SignalR real-time updates
  useMeetingHistorySignalR();

  // Load data on component mount
  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleDeleteClick = (meeting: MeetingListItem) => {
    setMeetingToDelete(meeting);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (meetingToDelete) {
      await deleteMeeting(meetingToDelete.id);
      setDeleteDialogOpen(false);
      setMeetingToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMeetingToDelete(null);
  };

  const handleViewMeeting = (meeting: MeetingListItem) => {
    console.log('Navigating to meeting:', meeting.id);
    navigate(`/transcript/${meeting.id}`);
  };

  const handleDownloadClick = async (meeting: MeetingListItem) => {
    try {
      console.log(`Downloading transcript for meeting: ${meeting.title || meeting.originalFileName}`);
      console.log(`Meeting ID: ${meeting.id}`);
      console.log('Meeting object:', meeting);
      
      // Debug: Check current session state for transcription ID
      const sessionState = (window as any).useSpeakerSessionStore?.getState?.();
      if (sessionState) {
        console.log('Current session transcriptionId:', sessionState.transcriptionId);
        console.log('Session speaker mappings:', sessionState.speakerMappings);
      }
      
      await apiService.downloadMeetingTranscript(meeting.id);
      console.log('Download initiated successfully');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleSortClick = (column: string) => {
    const newDirection = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSorting(column, newDirection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Failed': return 'error';
      case 'Transcribing': 
      case 'Summarizing': return 'info';
      case 'Uploaded': 
      case 'Transcribed': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Meeting History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your processed meetings
        </Typography>
      </Box>



      {/* Filters and Search */}
      <Box mb={3}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchQuery && (
                  <IconButton onClick={() => setSearchQuery('')} size="small">
                    <ClearIcon />
                  </IconButton>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Meetings Table */}
      {!isLoading && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'title'}
                    direction={sortBy === 'title' ? sortDirection : 'asc'}
                    onClick={() => handleSortClick('title')}
                  >
                    Title / Filename
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'duration'}
                    direction={sortBy === 'duration' ? sortDirection : 'asc'}
                    onClick={() => handleSortClick('duration')}
                  >
                    Duration
                  </TableSortLabel>
                </TableCell>
                <TableCell>Speakers</TableCell>
                <TableCell>File Size</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'uploadedAt'}
                    direction={sortBy === 'uploadedAt' ? sortDirection : 'asc'}
                    onClick={() => handleSortClick('uploadedAt')}
                  >
                    Uploaded
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!meetings || meetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchQuery 
                        ? 'No meetings found matching your search criteria.' 
                        : 'No meetings yet. Upload and process your first audio file to get started!'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (meetings || []).map((meeting: MeetingListItem) => (
                  <TableRow key={meeting.id} hover>
                    <TableCell>
                      <Box>
                        <Link 
                          component="button"
                          variant="body2" 
                          fontWeight="medium"
                          onClick={() => handleViewMeeting(meeting)}
                          sx={{ 
                            textAlign: 'left',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {meeting.title || meeting.originalFileName}
                        </Link>
                        {meeting.title && meeting.title !== meeting.originalFileName && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {meeting.originalFileName}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={meeting.status}
                        color={getStatusColor(meeting.status) as any}
                        size="small"
                      />
                      {(meeting.status === 'Transcribing' || meeting.status === 'Summarizing') && (
                        <SmoothProgressIndicator meeting={meeting} />
                      )}
                    </TableCell>
                    <TableCell>{meeting.formattedDuration || '—'}</TableCell>
                    <TableCell>{meeting.speakerCount}</TableCell>
                    <TableCell>{meeting.formattedFileSize}</TableCell>
                    <TableCell>
                      <div>{formatDate(meeting.createdAt)}</div>
                      <small style={{color: '#666', fontSize: '10px'}}>Raw: {meeting.createdAt}</small>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {meeting.status === 'Completed' && (
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleDownloadClick(meeting)}
                            title="Download meeting results"
                          >
                            <DownloadIcon />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(meeting)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setPage(page)}
            color="primary"
          />
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Meeting</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{meetingToDelete?.title || meetingToDelete?.originalFileName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MeetingHistoryPage;