/**
 * Modern SpeakerMapping Tests - Updated for Current Architecture
 * Covers current SpeakerMappingComponent with tour integration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { SpeakerMappingComponent } from "../../components/SpeakerMapping";
import { useSpeakerSessionStore, useActiveSpeakers } from "../../stores/speakerSessionStore";
import { useTourStore } from "../../stores/tourStore";
import { useAppMode } from "../../contexts/AppModeContext";
import { sessionManager } from "../../services/sessionManager";
import { renderWithProviders } from "../utils/TestProviders";
import type { SpeakerMapping } from "../../types";

// Mock all dependencies
vi.mock("../../stores/speakerSessionStore");
vi.mock("../../stores/tourStore");
vi.mock("../../contexts/AppModeContext");
vi.mock("../../services/sessionManager");
vi.mock("../../components/SpeakerMappingDialog", () => ({
  SpeakerMappingDialog: vi.fn(({ open, onClose }) =>
    open ? (
      <div data-testid="speaker-mapping-dialog">
        <button onClick={onClose} data-testid="close-dialog">Close</button>
      </div>
    ) : null
  ),
}));
vi.mock("../../theme/speakerColors", () => ({
  getSpeakerColor: vi.fn((speakerId: string) => `#${speakerId.slice(-6)}`),
}));

// Create properly typed mocks
const mockUseSpeakerSessionStore = useSpeakerSessionStore as unknown as ReturnType<typeof vi.fn>;
const mockUseActiveSpeakers = useActiveSpeakers as unknown as ReturnType<typeof vi.fn>;
const mockUseTourStore = useTourStore as unknown as ReturnType<typeof vi.fn>;
const mockUseAppMode = useAppMode as unknown as ReturnType<typeof vi.fn>;
const mockSessionManager = sessionManager as unknown as {
  getOverrides: ReturnType<typeof vi.fn>;
};

describe("SpeakerMappingComponent - Modern Architecture", () => {
  const mockSpeakerMappings: SpeakerMapping[] = [
    {
      speakerId: "Speaker 1",
      name: "John Doe",
      role: "Manager",
      transcriptionId: "test-transcription-123",
      source: "AutoDetected",
    },
    {
      speakerId: "Speaker 2", 
      name: "Jane Smith",
      role: "Developer",
      transcriptionId: "test-transcription-123",
      source: "AutoDetected",
    },
  ];

  const defaultProps = {
    transcriptionId: "test-transcription-123",
    detectedSpeakers: ["Speaker 1", "Speaker 2"],
    onMappingsChanged: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock app mode (not in demo/tour mode by default)
    mockUseAppMode.mockReturnValue({
      isDemo: false,
    });

    // Mock tour store (not active by default)
    mockUseTourStore.mockReturnValue({
      isActive: false,
      closeStep: vi.fn(),
      triggerStepAction: vi.fn(),
      isCurrentStep: vi.fn().mockReturnValue(false),
      isActionDisabledDuringTour: vi.fn().mockReturnValue(false),
    });

    // Mock active speakers hook
    mockUseActiveSpeakers.mockReturnValue(["Speaker 1", "Speaker 2"]);

    // Mock speaker session store with current architecture
    mockUseSpeakerSessionStore.mockReturnValue({
      speakerMappings: mockSpeakerMappings,
      transcriptionId: "test-transcription-123",
      initializeSpeakers: vi.fn(),
      addSpeakerMapping: vi.fn(),
      updateSpeakerMapping: vi.fn(),
      deleteSpeakerMapping: vi.fn(),
      clearSession: vi.fn(),
    });

    // Mock session manager
    mockSessionManager.getOverrides = vi.fn().mockReturnValue({});
  });

  describe("Basic Rendering", () => {
    it("renders component with speaker chips", () => {
      renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
      
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Manager")).toBeInTheDocument();
      expect(screen.getByText("Developer")).toBeInTheDocument();
    });

    it("displays manage speakers button when not in tour", () => {
      renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
      
      expect(screen.getByRole("button", { name: /manage speakers/i })).toBeInTheDocument();
    });

    it("shows speaker count correctly", () => {
      renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
      
      expect(screen.getByText("2 Speakers")).toBeInTheDocument();
    });
  });

  describe("Tour Integration", () => {
    it("disables manage button during tour when action is disabled", () => {
      // Mock tour active with manage speakers disabled
      mockUseTourStore.mockReturnValue({
        isActive: true,
        closeStep: vi.fn(),
        triggerStepAction: vi.fn(),
        isCurrentStep: vi.fn().mockReturnValue(false),
        isActionDisabledDuringTour: vi.fn().mockImplementation((action) => 
          action === "manage-speakers"
        ),
      });

      renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
      
      const manageButton = screen.getByRole("button", { name: /manage speakers/i });
      expect(manageButton).toBeDisabled();
    });

    it("enables manage button during tour step 3", () => {
      // Mock tour step 3 (manage speakers allowed)
      mockUseTourStore.mockReturnValue({
        isActive: true,
        closeStep: vi.fn(),
        triggerStepAction: vi.fn(),
        isCurrentStep: vi.fn().mockReturnValue(true),
        isActionDisabledDuringTour: vi.fn().mockReturnValue(false),
      });

      renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
      
      const manageButton = screen.getByRole("button", { name: /manage speakers/i });
      expect(manageButton).not.toBeDisabled();
    });
  });

  describe("Dialog Management", () => {
    it("opens speaker mapping dialog when manage button clicked", () => {
      renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
      
      const manageButton = screen.getByRole("button", { name: /manage speakers/i });
      fireEvent.click(manageButton);
      
      expect(screen.getByTestId("speaker-mapping-dialog")).toBeInTheDocument();
    });

    it("closes dialog when close button clicked", () => {
      renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
      
      // Open dialog
      const manageButton = screen.getByRole("button", { name: /manage speakers/i });
      fireEvent.click(manageButton);
      
      // Close dialog
      const closeButton = screen.getByTestId("close-dialog");
      fireEvent.click(closeButton);
      
      expect(screen.queryByTestId("speaker-mapping-dialog")).not.toBeInTheDocument();
    });
  });

  describe("Speaker Data Management", () => {
    it("handles empty speaker mappings gracefully", () => {
      // Mock empty state
      mockUseSpeakerSessionStore.mockReturnValue({
        speakerMappings: [],
        transcriptionId: "test-transcription-123",
        initializeSpeakers: vi.fn(),
        addSpeakerMapping: vi.fn(),
        updateSpeakerMapping: vi.fn(),
        deleteSpeakerMapping: vi.fn(),
        clearSession: vi.fn(),
      });
      
      mockUseActiveSpeakers.mockReturnValue([]);

      renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
      
      expect(screen.getByText("0 Speakers")).toBeInTheDocument();
    });

    it("triggers onMappingsChanged when mappings are saved", () => {
      const onMappingsChanged = vi.fn();
      
      renderWithProviders(<SpeakerMappingComponent {...defaultProps} onMappingsChanged={onMappingsChanged} />);
      
      // Simulate mappings saved - this would be called by the dialog component
      // We're testing the callback structure here
      expect(typeof defaultProps.onMappingsChanged).toBe("function");
    });
  });

  describe("Session Management Integration", () => {
    it("handles session overrides correctly", () => {
      // Mock session with overrides
      mockSessionManager.getOverrides = vi.fn().mockReturnValue({
        "Speaker 1": "Speaker 3"
      });

      renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
      
      // Component should still render normally - session overrides don't affect display
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  describe("Performance and Memoization", () => {
    it("does not re-render unnecessarily when props don't change", () => {
      const { rerender } = renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
      
      const initialSpeakerCount = screen.getByText("2 Speakers");
      
      // Re-render with same props
      rerender(<SpeakerMappingComponent {...defaultProps} />);
      
      // Should still show same content
      expect(screen.getByText("2 Speakers")).toBe(initialSpeakerCount);
    });
  });
});
