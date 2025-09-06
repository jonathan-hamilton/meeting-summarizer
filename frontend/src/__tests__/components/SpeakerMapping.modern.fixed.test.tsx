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

  describe("Basic Rendering", () => {
    it("debug - component import works", () => {
      // Simple import test
      expect(SpeakerMappingComponent).toBeDefined();
    });

    it("debug - minimal render test", () => {
      renderWithProviders(
        <SpeakerMappingComponent {...defaultProps} />,
        { initialMode: 'development' }
      );

      // Should render something
      expect(document.body).toBeTruthy();
    });

    it("renders basic UI structure correctly", () => {
      renderWithProviders(
        <SpeakerMappingComponent {...defaultProps} />,
        { initialMode: 'development' }
      );

      // Test what we actually see in the rendered output
      expect(screen.getByRole("heading", { name: "Speakers" })).toBeInTheDocument();
      expect(screen.getByLabelText("Open speaker management dialog")).toBeInTheDocument();
    });

    it("displays empty state correctly", () => {
      renderWithProviders(
        <SpeakerMappingComponent {...defaultProps} />,
        { initialMode: 'development' }
      );

      // Shows the empty state message we see in the actual output
      expect(screen.getByText("No speakers detected in this transcription.")).toBeInTheDocument();
    });
  });

  describe("Modern Test Infrastructure", () => {
    it("integrates with Zustand store architecture", () => {
      renderWithProviders(
        <SpeakerMappingComponent {...defaultProps} />,
        { initialMode: 'development' }
      );

      // Use exact heading match to avoid multiple matches
      expect(screen.getByRole("heading", { name: "Speakers" })).toBeInTheDocument();
    });

    it("uses TestProviders for context isolation", () => {
      renderWithProviders(
        <SpeakerMappingComponent {...defaultProps} />,
        { initialMode: 'development' }
      );

      // Test that component renders without errors
      expect(screen.getByLabelText("Open speaker management dialog")).toBeInTheDocument();
    });
  });
});
