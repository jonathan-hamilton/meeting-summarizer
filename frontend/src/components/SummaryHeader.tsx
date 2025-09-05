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
  ContentCopy,
  Schedule,
  Assignment,
  Person,
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
        
        {/* Action Buttons */}
        <Tooltip title="Share via email">
          <Button
            variant="contained"
            size="small"
            startIcon={<Email />}
            onClick={() => {
              onShareClick();
              triggerStepAction('open-email-dialog');
            }}
            sx={{ mr: 1 }}
            disabled={isActionDisabledDuringTour('share-summary')}
          >
            Share
          </Button>
        </Tooltip>

        {/* Step 13 Tour Popover - Share via Email */}
        <TourPopover
          open={isDemo && isTourActive && isCurrentStep(13)}
          step={13}
          onClose={() => onCloseStep(13)}
          position={{ top: '50px', right: '190px' }}
          maxWidth="300px"
        />

        <Tooltip title="Copy full summary">
          <IconButton
            onClick={onCopyClick}
            size="small"
            disabled={isActionDisabledDuringTour('copy-summary')}
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>

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
