/**
 * Shared utility functions for formatting summary text
 * Used by both FormattedSummaryText component and email generation
 */

export interface FormattedSection {
  type: 'header' | 'subheader' | 'paragraph' | 'list' | 'listItem';
  content: string;
  items?: string[]; // For list type
}

/**
 * Parse raw summary text into structured sections
 */
export const parseSummaryText = (rawText: string): FormattedSection[] => {
  const lines = rawText.split('\n').filter(line => line.trim() !== '');
  const sections: FormattedSection[] = [];

  // If we have very few lines (like a single paragraph), try to break it up intelligently
  if (lines.length <= 2 && lines[0] && lines[0].length > 300) {
    return parseUnstructuredParagraph(lines[0]);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;

    // Headers (lines ending with colon or lines that are all caps with common header words)
    if (line.endsWith(':') || 
        /^(OVERVIEW|SUMMARY|KEY POINTS|DECISIONS|ACTION ITEMS|NEXT STEPS|MAIN TOPICS|DISCUSSION POINTS|CONCLUSION|RECOMMENDATIONS):?\s*$/i.test(line)) {
      sections.push({
        type: 'header',
        content: line.replace(/[:]*$/, '')
      });
      continue;
    }

    // Bullet points (lines starting with -, •, *, or numbers)
    if (/^[\-\•\*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      // Check if this starts a list
      const listItems = [line.replace(/^[\-\•\*]\s|^\d+\.\s/, '')];
      let j = i + 1;
      
      // Collect consecutive bullet points
      while (j < lines.length && (/^[\-\•\*]\s/.test(lines[j].trim()) || /^\d+\.\s/.test(lines[j].trim()))) {
        listItems.push(lines[j].trim().replace(/^[\-\•\*]\s|^\d+\.\s/, ''));
        j++;
      }
      
      // If we have multiple items, create a list
      if (listItems.length > 1 || sections.length > 0) {
        sections.push({
          type: 'list',
          content: '',
          items: listItems
        });
        i = j - 1; // Skip the processed items
      } else {
        // Single bullet point, treat as regular paragraph
        sections.push({
          type: 'paragraph',
          content: line
        });
      }
      continue;
    }

    // Subheadings (lines that are bold in markdown style **text**)
    if (/^\*\*.*\*\*$/.test(line)) {
      sections.push({
        type: 'subheader',
        content: line.replace(/^\*\*|\*\*$/g, '')
      });
      continue;
    }

    // Regular paragraphs
    if (line.length > 20) { // Assume longer lines are paragraphs
      sections.push({
        type: 'paragraph',
        content: line
      });
    } else {
      // Short lines - might be titles or subheadings
      sections.push({
        type: 'subheader',
        content: line
      });
    }
  }

  return sections;
};

/**
 * Convert parsed sections to plain text for email
 */
export const sectionsToPlainText = (sections: FormattedSection[]): string => {
  return sections.map(section => {
    switch (section.type) {
      case 'header':
        return `\n${section.content.toUpperCase()}\n${'='.repeat(section.content.length)}\n`;
      
      case 'subheader':
        return `\n${section.content}\n${'-'.repeat(section.content.length)}\n`;
      
      case 'paragraph':
        return `\n${section.content}\n`;
      
      case 'list':
        if (section.items) {
          return '\n' + section.items.map(item => `• ${item}`).join('\n') + '\n';
        }
        return '';
      
      default:
        return `\n${section.content}\n`;
    }
  }).join('');
};

/**
 * Convert parsed sections to HTML for email
 */
export const sectionsToHtml = (sections: FormattedSection[]): string => {
  return sections.map(section => {
    switch (section.type) {
      case 'header':
        return `<h2 style="color: #1976d2; margin-top: 20px; margin-bottom: 10px;">${section.content}</h2>`;
      
      case 'subheader':
        return `<h3 style="margin-top: 15px; margin-bottom: 8px;">${section.content}</h3>`;
      
      case 'paragraph':
        return `<p style="line-height: 1.6; margin-bottom: 12px;">${section.content}</p>`;
      
      case 'list':
        if (section.items) {
          const listItems = section.items.map(item => `<li style="margin-bottom: 4px;">${item}</li>`).join('');
          return `<ul style="margin: 10px 0; padding-left: 20px;">${listItems}</ul>`;
        }
        return '';
      
      default:
        return `<p style="line-height: 1.6; margin-bottom: 12px;">${section.content}</p>`;
    }
  }).join('');
};

/**
 * Format summary text for email (plain text version)
 */
export const formatSummaryForEmail = (rawText: string): string => {
  const sections = parseSummaryText(rawText);
  return sectionsToPlainText(sections);
};

/**
 * Format summary text for email (HTML version)
 */
export const formatSummaryForEmailHtml = (rawText: string): string => {
  const sections = parseSummaryText(rawText);
  return sectionsToHtml(sections);
};

/**
 * Formats action items for email display
 */
export const formatActionItemsForEmail = (actionItems: any[], speakerMappings: any[]): string => {
  if (!actionItems || actionItems.length === 0) {
    return '';
  }

  // Group action items by speaker
  const groupedActionItems: { [speakerId: string]: { speakerName: string; items: any[] } } = {};
  
  actionItems.forEach(item => {
    const speakerId = item.assignedTo || 'Unassigned';
    
    if (!groupedActionItems[speakerId]) {
      const speakerMapping = speakerMappings.find(m => m.speakerId === speakerId);
      const speakerName = speakerMapping?.name || (speakerId === 'Unassigned' ? 'Unassigned' : speakerId);
      
      groupedActionItems[speakerId] = {
        speakerName,
        items: []
      };
    }
    
    groupedActionItems[speakerId].items.push(item);
  });

  let actionItemsText = '';
  if (Object.keys(groupedActionItems).length > 0) {
    Object.entries(groupedActionItems).forEach(([, group]) => {
      actionItemsText += `\n**${group.speakerName}:**\n`;
      group.items.forEach(item => {
        actionItemsText += `  • ${item.description}\n`;
      });
    });
  }

  return actionItemsText;
};

/**
 * Parse an unstructured paragraph into logical sections
 */
const parseUnstructuredParagraph = (text: string): FormattedSection[] => {
  const sections: FormattedSection[] = [];
  
  // Split on sentence boundaries but keep logical groupings
  // Look for topic transition indicators
  const sentences = text.split(/\. (?=[A-Z])/);
  let currentParagraph = '';
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i] + (i < sentences.length - 1 ? '.' : '');
    
    // Check if this sentence indicates a topic change
    const isTopicTransition = /^(The |Additionally, |Furthermore, |In terms of |Operational |Technical |Risks |Finally, |Other |Particular )/i.test(sentence.trim());
    
    if (isTopicTransition && currentParagraph.trim()) {
      // Save the current paragraph and start a new one
      sections.push({
        type: 'paragraph',
        content: currentParagraph.trim()
      });
      currentParagraph = sentence;
    } else {
      currentParagraph += (currentParagraph ? ' ' : '') + sentence;
    }
    
    // Also break on very long paragraphs (>400 chars)
    if (currentParagraph.length > 400 && sentence.endsWith('.')) {
      sections.push({
        type: 'paragraph',
        content: currentParagraph.trim()
      });
      currentParagraph = '';
    }
  }
  
  // Add any remaining content
  if (currentParagraph.trim()) {
    sections.push({
      type: 'paragraph',
      content: currentParagraph.trim()
    });
  }
  
  // If we didn't break it up much, just return the original as paragraphs
  if (sections.length <= 1) {
    // Try breaking on very obvious transition words
    const parts = text.split(/(?=The meeting also|Additionally|Furthermore|In terms of|Operational considerations|Technical aspects|Risks identified|Finally)/i);
    
    return parts.filter(part => part.trim()).map(part => ({
      type: 'paragraph' as const,
      content: part.trim()
    }));
  }
  
  return sections;
};

/**
 * Clean raw transcript text by removing speaker labels and formatting for readability
 */
export const formatTranscriptText = (rawTranscript: string): string => {
  if (!rawTranscript) return '';
  
  // Split into lines and process each line
  const lines = rawTranscript.split('\n').filter(line => line.trim() !== '');
  const cleanedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Remove speaker labels (e.g., "Speaker 1:", "Speaker 2:", etc.)
    const cleanedLine = trimmedLine.replace(/^(Speaker\s+\d+:|SPEAKER_\d+:|Guest-\d+:)\s*/i, '');
    
    if (cleanedLine.trim()) {
      cleanedLines.push(cleanedLine.trim());
    }
  }
  
  // Join lines with proper spacing, adding paragraph breaks for longer gaps
  return cleanedLines.join(' ');
};