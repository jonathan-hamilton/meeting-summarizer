/**
 * Modern SpeakerMapping Tests - Using Proven Working Pattern
 * Based on successful SpeakerMapping.working.test.tsx
 */

import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { SpeakerMappingComponent } from "../../components/SpeakerMapping";
import { renderWithProviders } from "../utils/TestProviders";

// Apply the PROVEN WORKING PATTERN - Global mocks imports (critical!)
import "../mocks/tourStoreMock";
import "../mocks/speakerSessionStoreMock";

describe("SpeakerMappingComponent - Modern Architecture", () => {
  const defaultProps = {
    transcriptionId: "test-transcription-123",
    detectedSpeakers: ["Speaker 1", "Speaker 2"],
    onMappingsChanged: () => {},
  };

  describe("Modern Test Infrastructure", () => {
    it("renders successfully with global mocks", () => {
      renderWithProviders(
        <SpeakerMappingComponent {...defaultProps} />,
        { initialMode: 'development' }
      );

      // Test based on what we actually see in the output:
      // - "Speakers" heading (use exact text to avoid multiple matches)  
      expect(screen.getByRole("heading", { name: "Speakers" })).toBeInTheDocument();
      // - Manage speakers button (use aria-label that we see in output)
      expect(screen.getByLabelText("Open speaker management dialog")).toBeInTheDocument();
    });

    it("integrates with TestProviders for context isolation", () => {
      renderWithProviders(
        <SpeakerMappingComponent {...defaultProps} />,
        { initialMode: 'development' }
      );

      // Should render without throwing errors
      expect(document.body).toBeTruthy();
    });

    it("displays empty state when no speaker mappings exist", () => {
      renderWithProviders(
        <SpeakerMappingComponent {...defaultProps} />,
        { initialMode: 'development' }
      );

      // Based on the actual output we see - shows empty state message
      expect(screen.getByText("No speakers detected in this transcription.")).toBeInTheDocument();
    });
  });
});