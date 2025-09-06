/**
 * SpeakerMapping Performance Tests - Using Proven Working Pattern
 * Based on successful SpeakerMapping.working.test.tsx
 */

import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { SpeakerMappingComponent } from "../../components/SpeakerMapping";
import { renderWithProviders } from "../utils/TestProviders";

// Apply the PROVEN WORKING PATTERN - Global mocks imports (critical!)
import "../mocks/tourStoreMock";
import "../mocks/speakerSessionStoreMock";

describe("SpeakerMappingComponent - Performance Tests", () => {
  const defaultProps = {
    transcriptionId: "test-transcription-123",
    detectedSpeakers: ["Speaker 1", "Speaker 2"],
    onMappingsChanged: () => {},
  };

  describe("Basic Performance", () => {
    it("renders efficiently with multiple speakers", () => {
      const startTime = Date.now();
      
      renderWithProviders(
        <SpeakerMappingComponent {...defaultProps} />,
        { initialMode: 'development' }
      );

      const renderTime = Date.now() - startTime;
      
      // Should render within reasonable time (under 100ms)
      expect(renderTime).toBeLessThan(100);
      
      // Should still render content correctly - use specific heading to avoid multiple matches
      expect(screen.getByRole("heading", { name: "Speakers" })).toBeInTheDocument();
    });

    it("handles empty state efficiently", () => {
      const emptyProps = {
        ...defaultProps,
        detectedSpeakers: [],
      };

      renderWithProviders(
        <SpeakerMappingComponent {...emptyProps} />,
        { initialMode: 'development' }
      );

      // Should render without errors - test for the heading
      expect(screen.getByRole("heading", { name: "Speakers" })).toBeInTheDocument();
    });

    it("maintains performance with larger speaker lists", () => {
      const largeSpeakerList = Array.from({ length: 10 }, (_, i) => `Speaker ${i + 1}`);
      const largeProps = {
        ...defaultProps,
        detectedSpeakers: largeSpeakerList,
      };

      const startTime = Date.now();
      
      renderWithProviders(
        <SpeakerMappingComponent {...largeProps} />,
        { initialMode: 'development' }
      );

      const renderTime = Date.now() - startTime;
      
      // Should still render efficiently with more speakers
      expect(renderTime).toBeLessThan(200);
      expect(screen.getByRole("heading", { name: "Speakers" })).toBeInTheDocument();
    });
  });
});
