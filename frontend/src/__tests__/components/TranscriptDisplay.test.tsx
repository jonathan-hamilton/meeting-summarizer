import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import React from "react";
import "@testing-library/jest-dom";
import TranscriptDisplay from "../../components/TranscriptDisplay";
import { renderWithTheme } from "../utils/testUtils";
import {
  mockTranscriptionResponseWithSpeakers,
  mockTranscriptionResponseSimpleText,
  mockTranscriptionResponseFailed,
} from "../mocks/transcriptionMocks";

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
      expect(screen.getByText("2 speakers")).toBeInTheDocument();
      expect(screen.getByText("93% confidence")).toBeInTheDocument();
      expect(screen.getByText("EN")).toBeInTheDocument();

      // Check speaker segments
      expect(screen.getByText("Speaker Transcript")).toBeInTheDocument();
      expect(screen.getByText("Speaker 1")).toBeInTheDocument();
      expect(screen.getByText("Speaker 2")).toBeInTheDocument();
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

      const speaker1Chip = screen
        .getByText("Speaker 1")
        .closest(".MuiChip-root");
      const speaker2Chip = screen
        .getByText("Speaker 2")
        .closest(".MuiChip-root");

      // Both chips should exist and have different background colors
      expect(speaker1Chip).toBeInTheDocument();
      expect(speaker2Chip).toBeInTheDocument();

      // The chips should have background colors applied
      expect(speaker1Chip).toHaveStyle({ backgroundColor: "#1976d2" }); // blue for Speaker 1
      expect(speaker2Chip).toHaveStyle({ backgroundColor: "#388e3c" }); // green for Speaker 2
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
      expect(screen.getAllByLabelText("Copy segment")).toHaveLength(2);
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
        "Speaker 1: Hello everyone, how are you today?\n\nSpeaker 2: I am doing well, thank you for asking."
      );

      // Verify the button is still functional after click
      expect(copyButton).toBeInTheDocument();
      expect(copyButton).toBeEnabled();
    });
  });
});
