import { render } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { ReactElement } from "react";

/**
 * Renders a component wrapped with Material-UI ThemeProvider
 * This ensures consistent theming for all component tests
 */
export const renderWithTheme = (component: ReactElement) => {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

/**
 * Creates a theme with custom options for testing
 */
export const renderWithCustomTheme = (
  component: ReactElement,
  themeOptions = {}
) => {
  const theme = createTheme(themeOptions);
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

/**
 * Test IDs for components - helps with consistent element selection
 */
export const testIds = {
  transcriptDisplay: {
    loadingSpinner: "transcript-loading-spinner",
    errorAlert: "transcript-error-alert",
    speakerChip: "speaker-chip",
    copyButton: "copy-button",
    segmentCopyButton: "segment-copy-button",
  },
  fileUpload: {
    dropzone: "file-upload-dropzone",
    uploadButton: "upload-button",
    progressBar: "upload-progress",
  },
} as const;
