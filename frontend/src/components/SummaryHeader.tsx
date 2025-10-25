import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Email,
  Schedule,
  Assignment,
  Person,
  PictureAsPdf,
} from '@mui/icons-material';
import type { MeetingSummary } from '../types';

interface SummaryHeaderProps {
  summary: MeetingSummary;
  totalActionItems: number;
  speakerCount: number; // Add actual speaker count prop
  onShareClick: () => void;
  onPdfDownload: () => void;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  summary,
  totalActionItems,
  speakerCount,
  onShareClick,
  onPdfDownload,
}) => {
  // Mobile detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
      {/* Header with title only */}
      <Stack 
        direction="row" 
        alignItems="center" 
        spacing={2} 
        sx={{ mb: 2 }}
      >
        <CheckCircle color="success" />
        <Typography 
          variant={isMobile ? "h6" : "h6"}
          sx={{
            fontWeight: isMobile ? 600 : 500,
            textAlign: isMobile ? 'center' : 'left',
          }}
        >
          Summary Generated
        </Typography>
      </Stack>

      {/* Metadata Chips */}
      <Stack 
        direction={isMobile ? "column" : "row"} 
        spacing={isMobile ? 1 : 1} 
        alignItems={isMobile ? "center" : "flex-start"}
        flexWrap="wrap"
        sx={{ mb: 2 }}
      >
        <Chip
          icon={<Schedule />}
          label={`${(summary.generation.processingTimeMs / 1000).toFixed(1)}s`}
          variant="outlined"
          size={isMobile ? "medium" : "small"}
          sx={{
            height: isMobile ? 40 : 'auto',
            minWidth: isMobile ? 150 : 'auto',
            '& .MuiChip-label': {
              px: isMobile ? 2 : 1,
              fontSize: isMobile ? '0.875rem' : '0.75rem',
            },
          }}
        />
        <Chip
          icon={<Assignment />}
          label={`${totalActionItems} action items`}
          variant="outlined"
          size={isMobile ? "medium" : "small"}
          sx={{
            height: isMobile ? 40 : 'auto',
            minWidth: isMobile ? 150 : 'auto',
            '& .MuiChip-label': {
              px: isMobile ? 2 : 1,
              fontSize: isMobile ? '0.875rem' : '0.75rem',
            },
          }}
        />
        <Chip
          icon={<Person />}
          label={`${speakerCount} speakers`}
          variant="outlined"
          size={isMobile ? "medium" : "small"}
          sx={{
            height: isMobile ? 40 : 'auto',
            minWidth: isMobile ? 150 : 'auto',
            '& .MuiChip-label': {
              px: isMobile ? 2 : 1,
              fontSize: isMobile ? '0.875rem' : '0.75rem',
            },
          }}
        />
      </Stack>
        
      {/* Action buttons - now below the chips */}
      <Box sx={{ 
        display: 'flex', 
        gap: isMobile ? 2 : 1,
        flexDirection: isMobile ? 'row' : 'row',
        justifyContent: isMobile ? 'center' : 'flex-start',
        alignItems: 'center',
        width: isMobile ? '100%' : 'auto',
        mb: 1,
      }}>
        <Tooltip title="Download summary as PDF">
          <span>
            <IconButton
              size={isMobile ? "medium" : "small"}
              onClick={onPdfDownload}
              aria-label="Download summary as PDF"
              aria-describedby="pdf-download-tooltip"
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
              <PictureAsPdf fontSize={isMobile ? "medium" : "small"} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Share via email">
          <span>
            <Button
              variant="contained"
              size={isMobile ? "medium" : "small"}
              startIcon={<Email />}
              onClick={onShareClick}
              sx={{ 
                minHeight: isMobile ? 44 : 'auto',
                fontSize: isMobile ? '0.875rem' : '0.75rem',
                textTransform: 'none',
                fontWeight: 500,
              }}
              aria-label="Share summary via email"
            >
              Email
            </Button>
          </span>
        </Tooltip>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
        Generated: {new Date(summary.generation.generatedAt).toLocaleString()}
      </Typography>
    </Paper>
  );
};

export default SummaryHeader;
