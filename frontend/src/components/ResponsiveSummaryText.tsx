import React, { useState } from 'react';
import { Box, Button, useTheme, useMediaQuery, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import FormattedSummaryText from './FormattedSummaryText';

interface ResponsiveSummaryTextProps {
  text: string;
  mobilePreviewLength?: number;
}

const ResponsiveSummaryText: React.FC<ResponsiveSummaryTextProps> = ({ 
  text, 
  mobilePreviewLength = 200 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isExpanded, setIsExpanded] = useState(false);

  // On desktop, always show full text
  if (!isMobile) {
    return <FormattedSummaryText text={text} />;
  }

  // On mobile, show abbreviated version with expand/collapse
  const shouldTruncate = text.length > mobilePreviewLength;
  const previewText = shouldTruncate 
    ? text.substring(0, mobilePreviewLength).trim() + '...'
    : text;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Box>
      {/* Show preview or full text based on expanded state */}
      <Collapse in={!isExpanded} timeout={300}>
        <Box sx={{ display: !isExpanded ? 'block' : 'none' }}>
          <FormattedSummaryText text={previewText} />
        </Box>
      </Collapse>
      
      <Collapse in={isExpanded} timeout={300}>
        <Box sx={{ display: isExpanded ? 'block' : 'none' }}>
          <FormattedSummaryText text={text} />
        </Box>
      </Collapse>

      {/* Show expand/collapse button only if text is long enough */}
      {shouldTruncate && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            onClick={handleToggle}
            startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
            variant="outlined"
            size="medium"
            sx={{
              minHeight: 44,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ResponsiveSummaryText;