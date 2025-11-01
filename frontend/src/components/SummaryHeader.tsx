import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Assignment,
  Person,
} from '@mui/icons-material';
import type { MeetingSummary } from '../types';

interface SummaryHeaderProps {
  summary: MeetingSummary;
  totalActionItems: number;
  speakerCount: number; // Add actual speaker count prop
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  summary,
  totalActionItems,
  speakerCount,
}) => {
  // Mobile detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
      {/* Header with Summary Generated text and metadata chips on same line */}
      <Stack 
        direction={isMobile ? "column" : "row"} 
        alignItems={isMobile ? "center" : "center"}
        justifyContent={isMobile ? "center" : "space-between"}
        spacing={isMobile ? 2 : 1}
        sx={{ mb: 2 }}
      >
        {/* Metadata Chips */}
        <Stack 
          direction={isMobile ? "column" : "row"} 
          spacing={isMobile ? 1 : 1} 
          alignItems="center"
          flexWrap="wrap"
        >
          <Chip
            icon={<Schedule />}
            label={`${(summary.generation.processingTimeMs / 1000).toFixed(1)}s`}
            variant="outlined"
            size={isMobile ? "medium" : "small"}
            sx={{
              fontSize: isMobile ? '0.875rem' : '0.75rem',
              height: isMobile ? 40 : 32,
            }}
          />
          <Chip
            icon={<Assignment />}
            label={`${totalActionItems} action items`}
            variant="outlined"
            size={isMobile ? "medium" : "small"}
            sx={{
              fontSize: isMobile ? '0.875rem' : '0.75rem',
              height: isMobile ? 40 : 32,
            }}
          />
          <Chip
            icon={<Person />}
            label={`${speakerCount} speakers`}
            variant="outlined"
            size={isMobile ? "medium" : "small"}
            sx={{
              fontSize: isMobile ? '0.875rem' : '0.75rem',
              height: isMobile ? 40 : 32,
            }}
          />
        </Stack>

        {/* Summary Status Chip */}
        <Chip
          icon={<CheckCircle />}
          label="Completed"
          color="success"
          variant="filled"
          size={isMobile ? "medium" : "small"}
          sx={{
            fontSize: isMobile ? '0.875rem' : '0.75rem',
            height: isMobile ? 40 : 32,
          }}
        />
      </Stack>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
        Generated: {new Date(summary.generation.generatedAt).toLocaleString()}
      </Typography>
    </Paper>
  );
};

export default SummaryHeader;
