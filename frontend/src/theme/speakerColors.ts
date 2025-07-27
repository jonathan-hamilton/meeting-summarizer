/**
 * Speaker Color Utilities
 * Centralized color management for speaker visualization across components
 */

/**
 * 10 distinct colors for speaker identification
 * Colors are chosen for high contrast and accessibility
 */
export const SPEAKER_COLORS = [
  "#1976d2", // Blue
  "#d32f2f", // Red
  "#388e3c", // Green
  "#f57c00", // Orange
  "#7b1fa2", // Purple
  "#00796b", // Teal
  "#5d4037", // Brown
  "#616161", // Grey
  "#e91e63", // Pink
  "#ff5722", // Deep Orange
] as const;

/**
 * Generate a consistent color for a speaker based on their ID
 * Uses a simple hash function to ensure the same speaker always gets the same color
 * 
 * @param speakerId - The unique identifier for the speaker
 * @returns A hex color string
 */
export const getSpeakerColor = (speakerId: string): string => {
  // Generate a consistent color based on speaker ID
  let hash = 0;
  for (let i = 0; i < speakerId.length; i++) {
    hash = speakerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SPEAKER_COLORS.length;
  return SPEAKER_COLORS[index];
};

/**
 * Get all available speaker colors
 * Useful for displaying color palettes or legends
 */
export const getAllSpeakerColors = (): readonly string[] => {
  return SPEAKER_COLORS;
};

/**
 * Get the number of available speaker colors
 * Useful for validation or UI logic
 */
export const getSpeakerColorCount = (): number => {
  return SPEAKER_COLORS.length;
};