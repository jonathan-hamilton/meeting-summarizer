import React from 'react';
import { Typography, Box, List, ListItem, ListItemText } from '@mui/material';
import { parseSummaryText, type FormattedSection } from '../utils/summaryFormatting';

interface FormattedSummaryTextProps {
  text: string;
}

const FormattedSummaryText: React.FC<FormattedSummaryTextProps> = ({ text }) => {
  // Use the shared parsing utility
  const sections = parseSummaryText(text);
  
  // Debug logging
  console.log('FormattedSummaryText - Input text length:', text.length);
  console.log('FormattedSummaryText - Sections count:', sections.length);
  console.log('FormattedSummaryText - First 200 chars:', text.substring(0, 200));

  const renderSection = (section: FormattedSection, key: number): React.ReactNode => {
    switch (section.type) {
      case 'header':
        return (
          <Typography key={key} variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
            {section.content}
          </Typography>
        );

      case 'subheader':
        return (
          <Typography key={key} variant="subtitle1" sx={{ mt: 1.5, mb: 0.5, fontWeight: 'bold' }}>
            {section.content}
          </Typography>
        );

      case 'paragraph':
        return (
          <Typography key={key} variant="body1" paragraph sx={{ lineHeight: 1.6, mb: 1.5 }}>
            {section.content}
          </Typography>
        );

      case 'list':
        if (section.items) {
          return (
            <List key={key} dense sx={{ mt: 1, mb: 1, pl: 2 }}>
              {section.items.map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                  <ListItemText 
                    primary={item}
                    sx={{ 
                      '& .MuiTypography-root': { 
                        fontSize: '0.95rem',
                        lineHeight: 1.5
                      } 
                    }}
                  />
                </ListItem>
              ))}
            </List>
          );
        }
        return null;

      default:
        return (
          <Typography key={key} variant="body1" sx={{ fontWeight: 'medium', mt: 1, mb: 0.5 }}>
            {section.content}
          </Typography>
        );
    }
  };

  return (
    <Box>
      {sections.length > 0 ? (
        sections.map((section, index) => renderSection(section, index))
      ) : (
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {text}
        </Typography>
      )}
    </Box>
  );
};

export default FormattedSummaryText;