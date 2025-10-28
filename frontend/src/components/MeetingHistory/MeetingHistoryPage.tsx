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
  Tooltip,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme,
  Stack,
} from '@mui/material';
import { useAuthStore } from '../../stores/authStore';
import { useUploadQueueStore } from '../../stores/uploadQueueStore';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useMeetingHistoryStore } from '../../stores/meetingHistoryStore';
import type { MeetingListItem } from '../../types/meeting';

// Smooth progress component that uses centralized upload queue state when available
const SmoothProgressIndicator: React.FC<{ 
  meeting: MeetingListItem; 
  targetProgress?: number; 
}> = ({ meeting, targetProgress }) => {
  const { uploadFiles } = useUploadQueueStore();
  
  // Check if this meeting is currently being processed in the upload queue
  const activeUpload = uploadFiles.find(f => f.transcriptionJobId === meeting.id);
  
  // Use real-time progress from upload queue if available, otherwise use database progress
  const realTimeProgress = activeUpload?.progress ?? meeting.progressPercentage ?? 0;
  const [smoothProgress, setSmoothProgress] = useState(realTimeProgress);
  const target = targetProgress ?? realTimeProgress;
  
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
      <Typography variant="caption" color="text.secondary">
        {Math.round(smoothProgress)}%
      </Typography>
    </Box>
  );
};
import { apiService } from '../../services/apiService';

const MeetingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  
  // Track upload queue changes for real-time status updates - MUST be at top level
  const uploadFiles = useUploadQueueStore(state => state.uploadFiles);
  
  // Use individual selectors for better performance and reliability - MUST be at top level
  const meetings = useMeetingHistoryStore(state => state.meetings);
  const currentPage = useMeetingHistoryStore(state => state.currentPage);
  const totalPages = useMeetingHistoryStore(state => state.totalPages);
  const searchQuery = useMeetingHistoryStore(state => state.searchQuery);
  const sortBy = useMeetingHistoryStore(state => state.sortBy);
  const sortDirection = useMeetingHistoryStore(state => state.sortDirection);
  const isLoading = useMeetingHistoryStore(state => state.isLoading);
  const error = useMeetingHistoryStore(state => state.error);
  
  // All action selectors must also be at top level before any conditional returns
  const loadMeetings = useMeetingHistoryStore(state => state.loadMeetings);
  const deleteMeeting = useMeetingHistoryStore(state => state.deleteMeeting);
  const setPage = useMeetingHistoryStore(state => state.setPage);
  const setSearchQuery = useMeetingHistoryStore(state => state.setSearchQuery);
  const setSorting = useMeetingHistoryStore(state => state.setSorting);
  const clearError = useMeetingHistoryStore(state => state.clearError);
  
  // Show nothing if user is not authenticated - let the main app handle auth UI
  if (!isAuthLoading && !isAuthenticated) {
    return null;
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingListItem | null>(null);

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
      console.log(`Downloading PDF for meeting: ${meeting.title || meeting.originalFileName}`);
      console.log(`Meeting ID: ${meeting.id}`);
      console.log('Meeting object:', meeting);
      
      // Use PDF download instead of text download
      await apiService.downloadTranscriptPdf(meeting.id);
      console.log('PDF download initiated successfully');
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('PDF download failed. Please try again.');
    }
  };

  const handleSortClick = (column: string) => {
    const newDirection = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSorting(column, newDirection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': 
      case 'completed': return 'success';
      case 'Failed': 
      case 'error': return 'error';
      case 'Cancelled':
      case 'cancelled': return 'warning';
      case 'Transcribing': 
      case 'processing': return 'info';
      case 'Uploaded': 
      case 'Transcribed': 
      case 'uploading': 
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  // Helper function to get real-time status from upload queue or fallback to database status
  const getRealTimeStatus = (meeting: MeetingListItem): string => {
    const activeUpload = uploadFiles.find(f => f.transcriptionJobId === meeting.id);
    
    if (activeUpload) {
      // Map upload queue status to display status
      switch (activeUpload.status) {
        case 'pending': return 'Uploaded';
        case 'uploading': return 'Uploading';
        case 'processing': 
          // Use stage for more specific status if available
          if (activeUpload.currentStage === 'transcription') return 'Transcribing';
          return 'Processing';
        case 'completed': return 'Completed';
        case 'error': return 'Failed';
        case 'cancelled': return 'Cancelled';
        default: return activeUpload.status;
      }
    }
    
    // Fallback to database status
    return meeting.status;
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

  const formatDateMobile = (dateString: string) => {
    const date = new Date(dateString);
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mobile card component for meeting items
  const MeetingCard: React.FC<{ meeting: MeetingListItem }> = ({ meeting }) => {
    const realTimeStatus = getRealTimeStatus(meeting);
    
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 1 }}>
          <Stack spacing={2}>
            {/* Status Chip at the top */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Chip
                label={realTimeStatus}
                color={getStatusColor(realTimeStatus) as any}
                variant={realTimeStatus === 'Completed' ? 'filled' : 'outlined'}
                size="small"
              />
            </Box>

            {/* Filename on its own line */}
            <Box>
              <Link 
                component="button"
                variant="body1" 
                fontWeight="medium"
                onClick={() => handleViewMeeting(meeting)}
                sx={{ 
                  textAlign: 'left',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  wordBreak: 'break-word',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                {meeting.originalFileName}
              </Link>
            </Box>

            {/* Progress indicator for processing states */}
            {(realTimeStatus === 'Transcribing' || realTimeStatus === 'Processing' || realTimeStatus === 'Uploading') && (
              <SmoothProgressIndicator 
                meeting={meeting} 
                targetProgress={meeting.progressPercentage}
              />
            )}

            {/* Meeting Details */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Duration</Typography>
                <Typography variant="body2">{meeting.formattedDuration}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Speakers</Typography>
                <Typography variant="body2">{meeting.speakerCount}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">File Size</Typography>
                <Typography variant="body2">{meeting.formattedFileSize}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Uploaded</Typography>
                <Typography variant="body2">{formatDateMobile(meeting.createdAt)}</Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
        
        <CardActions sx={{ pt: 0, px: 2, pb: 2, justifyContent: 'center', gap: 1 }}>
          <Button
            size="small"
            startIcon={<PdfIcon />}
            onClick={() => handleDownloadClick(meeting)}
            disabled={meeting.status !== 'Completed'}
            variant="outlined"
          >
            Export PDF
          </Button>
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteClick(meeting)}
            color="error"
            variant="outlined"
          >
            Delete
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
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

      {/* Meetings Display - Responsive Table/Cards */}
      {!isLoading && (
        <>
          {isMobile ? (
            /* Mobile Card Layout */
            <Box>
              {!meetings || meetings.length === 0 ? (
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchQuery 
                        ? 'No meetings found matching your search criteria.' 
                        : 'No meetings yet. Upload and process your first audio file to get started!'}
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                (meetings || []).map((meeting: MeetingListItem) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))
              )}
            </Box>
          ) : (
            /* Desktop Table Layout */
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
                              {meeting.originalFileName}
                            </Link>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const realTimeStatus = getRealTimeStatus(meeting);
                            return (
                              <>
                                <Chip
                                  label={realTimeStatus}
                                  color={getStatusColor(realTimeStatus) as any}
                                  variant={realTimeStatus === 'Completed' ? 'filled' : 'outlined'}
                                />
                                {(realTimeStatus === 'Transcribing' || realTimeStatus === 'Processing' || realTimeStatus === 'Uploading') && (
                                  <SmoothProgressIndicator 
                                    meeting={meeting} 
                                    targetProgress={meeting.progressPercentage}
                                  />
                                )}
                              </>
                            );
                          })()}
                        </TableCell>
                        <TableCell>{meeting.formattedDuration}</TableCell>
                        <TableCell>{meeting.speakerCount}</TableCell>
                        <TableCell>{meeting.formattedFileSize}</TableCell>
                        <TableCell>{formatDate(meeting.createdAt)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Export transcript as PDF">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadClick(meeting)}
                                disabled={meeting.status !== 'Completed'}
                              >
                                <PdfIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete meeting">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(meeting)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
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