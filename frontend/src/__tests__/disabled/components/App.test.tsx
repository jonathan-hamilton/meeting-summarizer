import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../../../App";
import type { TranscriptionResponse } from "../../../types";

interface FileUploadProps {
  onTranscriptionComplete?: (result: TranscriptionResponse) => void;
}

interface TranscriptDisplayProps {
  transcription: TranscriptionResponse;
}

// Mock the components that have complex dependencies
vi.mock("../../../components/HealthCheck", () => ({
  HealthCheck: () => (
    <div data-testid="health-check">Health Check Component</div>
  ),
}));

vi.mock("../../../components/FileUpload", () => ({
  default: ({ onTranscriptionComplete }: FileUploadProps) => (
    <div data-testid="file-upload">
      <button
        onClick={() =>
          onTranscriptionComplete?.({
            transcriptionId: "test-123",
            fileName: "test.mp3",
            fileSize: 1024,
            status: "completed",
            transcribedText: "Test transcription",
            speakerSegments: [],
            processingTimeMs: 1000,
            createdAt: "2024-01-01T00:00:00Z",
          })
        }
        data-testid="mock-upload-btn"
      >
        Mock Upload
      </button>
    </div>
  ),
}));

vi.mock("../../../components/TranscriptDisplay", () => ({
  default: ({ transcription }: TranscriptDisplayProps) => (
    <div data-testid="transcript-display">
      <span data-testid="transcript-text">{transcription.transcribedText}</span>
    </div>
  ),
}));

// Mock the demo component import
vi.mock("../../../demo/TranscriptDisplayDemo", () => ({
  default: () => <div data-testid="demo-component">Demo Component</div>,
}));

describe("App Component - Critical Test Coverage - S2.1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render the app with all main components", () => {
      render(<App />);

      expect(screen.getByText("Meeting Summarizer")).toBeInTheDocument();
      expect(
        screen.getByText("AI-Powered Meeting Transcription and Summarization")
      ).toBeInTheDocument();
      expect(screen.getByTestId("health-check")).toBeInTheDocument();
      expect(screen.getByTestId("file-upload")).toBeInTheDocument();
    });

    it("should render the app bar with title and theme toggle", () => {
      render(<App />);

      // Check for the app bar title
      const titles = screen.getAllByText("Meeting Summarizer");
      expect(titles.length).toBeGreaterThan(0);

      // Check for theme toggle button (brightness icon)
      const themeToggle = screen.getByRole("button");
      expect(themeToggle).toBeInTheDocument();
    });

    it("should render upload section", () => {
      render(<App />);

      expect(screen.getByText("Upload Audio File")).toBeInTheDocument();
      expect(screen.getByTestId("file-upload")).toBeInTheDocument();
    });
  });

  describe("Theme Functionality", () => {
    it("should toggle theme when clicking theme button", () => {
      render(<App />);

      const themeToggle = screen.getByRole("button");

      // Click to toggle theme
      fireEvent.click(themeToggle);

      // The component should still be rendered after theme toggle
      expect(screen.getByText("Meeting Summarizer")).toBeInTheDocument();
    });
  });

  describe("Transcription Workflow", () => {
    it("should display transcription results when upload completes", () => {
      render(<App />);

      // Initially no transcription results
      expect(
        screen.queryByText("Transcription Results")
      ).not.toBeInTheDocument();

      // Simulate successful upload
      const uploadButton = screen.getByTestId("mock-upload-btn");
      fireEvent.click(uploadButton);

      // Check that transcription results section appears
      expect(screen.getByText("Transcription Results")).toBeInTheDocument();
      expect(screen.getByTestId("transcript-display")).toBeInTheDocument();
      expect(screen.getByTestId("transcript-text")).toHaveTextContent(
        "Test transcription"
      );
    });

    it("should handle multiple transcription results", () => {
      render(<App />);

      const uploadButton = screen.getByTestId("mock-upload-btn");

      // First upload
      fireEvent.click(uploadButton);
      expect(screen.getByText("Transcription Results")).toBeInTheDocument();

      // Second upload (should add to the list)
      fireEvent.click(uploadButton);

      // Should still show results section
      expect(screen.getByText("Transcription Results")).toBeInTheDocument();
    });
  });

  describe("State Management", () => {
    it("should maintain state through interactions", () => {
      render(<App />);

      // Theme toggle
      const themeToggle = screen.getByRole("button");
      fireEvent.click(themeToggle);

      // Upload file
      const uploadButton = screen.getByTestId("mock-upload-btn");
      fireEvent.click(uploadButton);

      // Both should still work
      expect(screen.getByText("Meeting Summarizer")).toBeInTheDocument();
      expect(screen.getByText("Transcription Results")).toBeInTheDocument();
    });
  });
});
