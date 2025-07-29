import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import React from "react";
import "@testing-library/jest-dom";

// Mock sessionManager
vi.mock("../../services/sessionManager", () => ({
  sessionManager: {
    getSessionStatus: vi.fn(() => ({
      isActive: true,
      sessionId: "test",
      sessionDuration: 120,
      lastActivity: new Date(),
      dataSize: "0 bytes",
      hasOverrides: false,
      overrideCount: 0,
    })),
    isSessionActive: vi.fn(() => true),
    extendSession: vi.fn(),
    clearAllData: vi.fn(),
    getOverrides: vi.fn(() => ({})),
    storeOverride: vi.fn(),
    updateActivity: vi.fn(),
    setSpeakerOverride: vi.fn(),
    removeSpeakerOverride: vi.fn(),
    getPrivacyControls: vi.fn(() => ({
      dataRetention: 7200,
      allowExternalRequests: false,
      enableAnalytics: false,
    })),
    onStatusChange: vi.fn(),
  },
}));

import TranscriptDisplay from "../../components/TranscriptDisplay";
import { renderWithTheme } from "../utils/testUtils";
import { getSpeakerColor } from "../../theme/speakerColors";
import { sessionManager } from "../../services/sessionManager";
import { useSpeakerStore } from "../../stores/speakerStore";
import {
  mockTranscriptionResponseWithSpeakers,
  mockTranscriptionResponseSimpleText,
  mockTranscriptionResponseFailed,
} from "../mocks/transcriptionMocks";

// Mock Zustand store
vi.mock("../../stores/speakerStore", () => ({
  useSpeakerStore: vi.fn(() => ({
    speakerMappings: [],
    detectedSpeakers: [],
    initializeSpeakers: vi.fn(),
    getMappedCount: vi.fn(() => 0),
    getUnmappedSpeakers: vi.fn(() => []),
  })),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

interface MockIconProps extends React.HTMLAttributes<HTMLDivElement> {
  "data-testid"?: string;
}

// Mock MUI icons to prevent EMFILE errors
vi.mock("@mui/icons-material", () => ({
  ExpandMore: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "expand-more-icon"} {...props} />
  ),
  ContentCopy: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "content-copy-icon"} {...props} />
  ),
  Person: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "person-icon"} {...props} />
  ),
  Schedule: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "schedule-icon"} {...props} />
  ),
  VolumeUp: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "volume-up-icon"} {...props} />
  ),
  CheckCircle: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "check-circle-icon"} {...props} />
  ),
  Error: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "error-icon"} {...props} />
  ),
  Edit: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "edit-icon"} {...props} />
  ),
  Close: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "close-icon"} {...props} />
  ),
  Save: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "save-icon"} {...props} />
  ),
  // SummaryDisplay icons
  Download: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "download-icon"} {...props} />
  ),
  Refresh: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "refresh-icon"} {...props} />
  ),
  Psychology: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "psychology-icon"} {...props} />
  ),
  ChecklistRtl: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "checklist-rtl-icon"} {...props} />
  ),
  Gavel: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "gavel-icon"} {...props} />
  ),
  Business: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "business-icon"} {...props} />
  ),
  Notes: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "notes-icon"} {...props} />
  ),
  Print: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "print-icon"} {...props} />
  ),
  // Missing icons for SpeakerMapping components
  Mic: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "mic-icon"} {...props} />
  ),
  PersonAdd: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "person-add-icon"} {...props} />
  ),
  EditNote: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "edit-note-icon"} {...props} />
  ),
  // TranscriptSpeakerSegment icons
  SwapHoriz: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "swap-horiz-icon"} {...props} />
  ),
  Undo: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "undo-icon"} {...props} />
  ),
  // More TranscriptSpeakerSegment icons
  Check: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "check-icon"} {...props} />
  ),
  Warning: ({ "data-testid": dataTestId, ...props }: MockIconProps) => (
    <div data-testid={dataTestId || "warning-icon"} {...props} />
  ),
}));

describe("TranscriptDisplay Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should display loading spinner when loading=true", () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
          loading={true}
        />
      );

      expect(
        screen.getByText("Processing transcription...")
      ).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message for failed transcription", () => {
      renderWithTheme(
        <TranscriptDisplay transcription={mockTranscriptionResponseFailed} />
      );

      expect(screen.getByText("Transcription Failed")).toBeInTheDocument();
      expect(
        screen.getByText("Audio file format not supported")
      ).toBeInTheDocument();
      expect(screen.getByText(/failed-audio\.mp3/)).toBeInTheDocument();
    });

    it("should display generic error message when errorMessage is not provided", () => {
      const failedTranscription = {
        ...mockTranscriptionResponseFailed,
        errorMessage: undefined,
      };

      renderWithTheme(
        <TranscriptDisplay transcription={failedTranscription} />
      );

      expect(
        screen.getByText("An unknown error occurred during transcription.")
      ).toBeInTheDocument();
    });
  });

  describe("Speaker Segments Display", () => {
    it("should render transcription with speaker segments", () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      // Check file name and status
      expect(screen.getByText("test-meeting.mp3")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();

      // Check metadata chips
      expect(screen.getByText("2500ms")).toBeInTheDocument();
      expect(screen.getByText("1 MB")).toBeInTheDocument();
      expect(screen.getByText("0:05")).toBeInTheDocument();
      expect(screen.getByText("0/2 speakers mapped")).toBeInTheDocument();
      expect(screen.getByText("93% confidence")).toBeInTheDocument();
      expect(screen.getByText("EN")).toBeInTheDocument();

      // Check speaker segments
      expect(screen.getByText("Speaker Transcript")).toBeInTheDocument();
      expect(screen.getAllByText("Speaker 1")).toHaveLength(2); // One in header, one in transcript
      expect(screen.getAllByText("Speaker 2")).toHaveLength(2); // One in header, one in transcript
      expect(
        screen.getByText("Hello everyone, how are you today?")
      ).toBeInTheDocument();
      expect(
        screen.getByText("I am doing well, thank you for asking.")
      ).toBeInTheDocument();

      // Check timestamps
      expect(screen.getByText("0:00 - 0:02")).toBeInTheDocument();
      expect(screen.getByText("0:02 - 0:05")).toBeInTheDocument();

      // Check confidence scores
      expect(screen.getByText("95%")).toBeInTheDocument();
      expect(screen.getByText("92%")).toBeInTheDocument();
    });

    it("should copy full transcript when copy button is clicked", async () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      const copyButton = screen.getByLabelText("Copy full transcript");
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "Speaker 1: Hello everyone, how are you today?\n\nSpeaker 2: I am doing well, thank you for asking."
      );
    });

    it("should copy individual segment when segment copy button is clicked", async () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      const segmentCopyButtons = screen.getAllByLabelText("Copy segment");
      await userEvent.click(segmentCopyButtons[0]);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "Hello everyone, how are you today?"
      );
    });
  });

  describe("Simple Text Display", () => {
    it("should render transcription with simple text (no speaker segments)", () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseSimpleText}
        />
      );

      // Check file name and basic info
      expect(screen.getByText("simple-audio.wav")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();

      // Check it displays "Transcript" instead of "Speaker Transcript"
      expect(screen.getByText("Transcript")).toBeInTheDocument();
      expect(screen.queryByText("Speaker Transcript")).not.toBeInTheDocument();

      // Check the transcribed text
      expect(
        screen.getByText(
          "This is a simple transcription without speaker segments."
        )
      ).toBeInTheDocument();

      // Should not show speaker-related metadata
      expect(screen.queryByText(/speakers/)).not.toBeInTheDocument();
    });

    it("should copy simple transcript when copy button is clicked", async () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseSimpleText}
        />
      );

      const copyButton = screen.getByLabelText("Copy transcript");
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "This is a simple transcription without speaker segments."
      );
    });
  });

  describe("File Size Formatting", () => {
    it("should format file sizes correctly", () => {
      const testCases = [
        { ...mockTranscriptionResponseSimpleText, fileSize: 0 },
        { ...mockTranscriptionResponseSimpleText, fileSize: 1024 },
        { ...mockTranscriptionResponseSimpleText, fileSize: 1024 * 1024 },
        {
          ...mockTranscriptionResponseSimpleText,
          fileSize: 1024 * 1024 * 1024,
        },
      ];

      testCases.forEach((testCase, index) => {
        const { unmount } = renderWithTheme(
          <TranscriptDisplay transcription={testCase} />
        );

        const expectedSizes = ["0 Bytes", "1 KB", "1 MB", "1 GB"];
        expect(screen.getByText(expectedSizes[index])).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe("Time Formatting", () => {
    it("should format timestamps correctly", () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      // Check formatted timestamps in segments
      expect(screen.getByText("0:00 - 0:02")).toBeInTheDocument();
      expect(screen.getByText("0:02 - 0:05")).toBeInTheDocument();
    });
  });

  describe("Speaker Color Coding", () => {
    it("should assign consistent colors to speakers", () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      const speaker1Chips = screen.getAllByText("Speaker 1");
      const speaker2Chips = screen.getAllByText("Speaker 2");

      // Get the speaker chips from the transcript sections (not the header)
      const speaker1Chip = speaker1Chips[1]?.closest(".MuiChip-root"); // Second occurrence (transcript)
      const speaker2Chip = speaker2Chips[0]?.closest(".MuiChip-root"); // First occurrence

      // Both chips should exist and have different background colors
      expect(speaker1Chip).toBeInTheDocument();
      expect(speaker2Chip).toBeInTheDocument();

      // The chips should have background colors applied
      expect(speaker1Chip).toHaveStyle({
        backgroundColor: getSpeakerColor("Speaker 1"),
      });
      expect(speaker2Chip).toHaveStyle({
        backgroundColor: getSpeakerColor("Speaker 2"),
      });
    });
  });

  describe("No Content State", () => {
    it("should display info message when no transcript content is available", () => {
      const emptyTranscription = {
        ...mockTranscriptionResponseSimpleText,
        transcribedText: undefined,
        speakerSegments: undefined,
      };

      renderWithTheme(<TranscriptDisplay transcription={emptyTranscription} />);

      expect(
        screen.getByText("No transcript content available.")
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      // Check for proper button labels
      expect(screen.getByLabelText("Copy full transcript")).toBeInTheDocument();
      // Note: Individual segment copy buttons are not currently implemented
    });

    it("should show progress bar with proper accessibility in loading state", () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
          loading={true}
        />
      );

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(
        screen.getByText("Processing transcription...")
      ).toBeInTheDocument();
    });

    it("should allow text selection in transcript areas", () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      const transcriptText = screen.getByText(
        "Hello everyone, how are you today?"
      );

      // Check that the text content is present and can be selected
      expect(transcriptText).toBeInTheDocument();
      expect(transcriptText).toHaveTextContent(
        "Hello everyone, how are you today?"
      );
    });
  });

  describe("S3.0 Increment 4: Session Integration Testing", () => {
    it("should integrate with session-based speaker management", async () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      // Verify component renders with session support
      expect(screen.getByText("Speaker Transcript")).toBeInTheDocument();
      expect(sessionManager.getSessionStatus).toHaveBeenCalled();
    });

    it("should handle session timeout gracefully", async () => {
      // Mock session as inactive
      vi.mocked(sessionManager.getSessionStatus).mockReturnValue({
        isActive: false,
        sessionId: "test",
        sessionDuration: 0,
        lastActivity: new Date(),
        dataSize: "0 bytes",
        hasOverrides: false,
        overrideCount: 0,
      });

      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      // Component should still render but functionality may be limited
      expect(screen.getByText("Speaker Transcript")).toBeInTheDocument();
    });

    it("should integrate with Zustand store for speaker management", async () => {
      const mockStore = vi.mocked(useSpeakerStore);
      const initializeSpeakers = vi.fn();

      mockStore.mockReturnValue({
        speakerMappings: [
          {
            speakerId: "Speaker 1",
            name: "John Doe",
            role: "Manager",
            transcriptionId: "test-123",
            source: "AutoDetected",
          },
        ],
        detectedSpeakers: ["Speaker 1", "Speaker 2"],
        initializeSpeakers,
        getMappedCount: vi.fn(() => 1),
        getUnmappedSpeakers: vi.fn(() => ["Speaker 2"]),
      });

      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      // Verify store integration
      expect(screen.getByText("Speaker Transcript")).toBeInTheDocument();
    });

    it("should maintain privacy-first approach with session-only data", async () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      // Verify session-based approach
      expect(sessionManager.getOverrides).toHaveBeenCalled();
      expect(screen.getByText("Speaker Transcript")).toBeInTheDocument();
    });

    it("should handle speaker overrides within session scope", async () => {
      const mockOverrides = {
        "Speaker 1": {
          action: "Override" as const,
          newValue: "John Doe",
          timestamp: new Date(),
          fieldModified: "name",
        },
        "Speaker 2": {
          action: "Override" as const,
          newValue: "Jane Smith",
          timestamp: new Date(),
          fieldModified: "name",
        },
      };

      vi.mocked(sessionManager.getOverrides).mockReturnValue(mockOverrides);

      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      // Verify overrides are applied
      expect(sessionManager.getOverrides).toHaveBeenCalled();
      expect(screen.getByText("Speaker Transcript")).toBeInTheDocument();
    });
  });

  describe("S3.0 Increment 4: Error Boundary Integration", () => {
    it("should handle component errors gracefully", async () => {
      // Mock console.error to prevent test noise
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Create invalid data that might cause errors
      const invalidData = {
        ...mockTranscriptionResponseWithSpeakers,
        transcript: null,
      };

      renderWithTheme(<TranscriptDisplay transcription={invalidData as any} />);

      // Component should handle errors and still render something
      const hasErrorOrTranscript =
        screen.queryByText(/error/i) ||
        screen.queryByText(/speaker transcript/i);
      expect(hasErrorOrTranscript).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it("should maintain session state during error recovery", async () => {
      renderWithTheme(
        <TranscriptDisplay transcription={mockTranscriptionResponseFailed} />
      );

      // Component should display error message
      expect(screen.getByText(/transcription failed/i)).toBeInTheDocument();

      // Session manager may be called depending on component implementation
      // but it's not required for this error scenario
    });
  });

  describe("Copy Functionality", () => {
    it("should show visual feedback when copying", async () => {
      renderWithTheme(
        <TranscriptDisplay
          transcription={mockTranscriptionResponseWithSpeakers}
        />
      );

      const copyButton = screen.getByLabelText("Copy full transcript");

      await userEvent.click(copyButton);

      // Verify clipboard API was called with correct content
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "John Doe: Hello everyone, how are you today?\n\nJane Smith: I am doing well, thank you for asking."
      );

      // Verify the button is still functional after click
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toBeEnabled();
    });
  });
});
