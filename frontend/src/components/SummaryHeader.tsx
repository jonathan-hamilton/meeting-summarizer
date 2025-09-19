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
} from '@mui/material';
import {
  CheckCircle,
  Email,
  Schedule,
  Assignment,
  Person,
  PictureAsPdf,
} from '@mui/icons-material';
import TourPopover from './TourPopover';
import { useTourStore } from '../stores/tourStore';
import type { MeetingSummary } from '../types';

interface SummaryHeaderProps {
  summary: MeetingSummary;
  totalActionItems: number;
  isDemo: boolean;
  isTourActive: boolean;
  isCurrentStep: (step: number) => boolean;
  onShareClick: () => void;
  onCopyClick: () => void;
  onCloseStep: (step: number) => void;
  triggerStepAction: (action: string) => void;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  summary,
  totalActionItems,
  isDemo,
  isTourActive,
  isCurrentStep,
  onShareClick,
  onCopyClick,
  onCloseStep,
  triggerStepAction,
}) => {
  // Tour control integration
  const isActionDisabledDuringTour = useTourStore(state => state.isActionDisabledDuringTour);
  
  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <CheckCircle color="success" />
        <Typography variant="h6">Summary Generated</Typography>
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Action Buttons - Copy first, then Email */}
        <Tooltip title="Download summary as PDF">
          <span>
            <IconButton
              onClick={onCopyClick}
              size="small"
              disabled={isActionDisabledDuringTour('copy-summary')}
              aria-label="Download summary as PDF"
              aria-describedby="copy-summary-tooltip"
            >
              <PictureAsPdf fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Share via email">
          <span>
            <Button
              variant="contained"
              size="small"
              startIcon={<Email />}
              onClick={() => {
                onShareClick();
                triggerStepAction('open-email-dialog');
              }}
              sx={{ ml: 1 }}
              disabled={isActionDisabledDuringTour('share-summary')}
              aria-label="Share summary via email"
              aria-describedby="share-email-tooltip"
            >
              Email
            </Button>
          </span>
        </Tooltip>

        {/* Step 13 Tour Popover - Share via Email */}
        <TourPopover
          open={isDemo && isTourActive && isCurrentStep(13)}
          step={13}
          onClose={() => onCloseStep(13)}
          position={{ top: '50px', right: '190px' }}
          maxWidth="300px"
        />

        {/* Step 12 Tour Popover - Copy Summary */}
        <TourPopover
          open={isDemo && isTourActive && isCurrentStep(12)}
          step={12}
          onClose={() => onCloseStep(12)}
          position={{ top: '150px', right: '10px' }}
          maxWidth="300px"
        />
      </Stack>

      {/* Metadata Chips */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip
          icon={<Schedule />}
          label={`${summary.generation.processingTimeMs}ms`}
          variant="outlined"
          size="small"
        />
        <Chip
          icon={<Assignment />}
          label={`${totalActionItems} action items`}
          variant="outlined"
          size="small"
        />
        <Chip
          icon={<Person />}
          label={`${summary.actionItemsByRole.length} speakers`}
          variant="outlined"
          size="small"
        />
      </Stack>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
        Generated: {new Date(summary.generation.generatedAt).toLocaleString()}
      </Typography>
    </Paper>
  );
};

export default SummaryHeader;
