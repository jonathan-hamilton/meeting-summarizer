import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import FileUpload from "../../components/FileUpload";
import { apiService } from "../../services/apiService";
import type { TranscriptionResponse } from "../../types";

// Mock the API service
vi.mock("../../services/apiService", () => ({
  apiService: {
    uploadFile: vi.fn(),
  },
}));

// Mock Material-UI icons to avoid rendering issues in tests
vi.mock("@mui/icons-material", () => ({
  CloudUpload: () => <div data-testid="cloud-upload-icon" />,
  AudioFile: () => <div data-testid="audio-file-icon" />,
  Delete: () => <div data-testid="delete-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Error: () => <div data-testid="error-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Psychology: () => <div data-testid="psychology-icon" />,
  Done: () => <div data-testid="done-icon" />,
}));

const mockTranscriptionResponse: TranscriptionResponse = {
  transcriptionId: "test-id-123",
  fileName: "test-audio.mp3",
  fileSize: 1024,
  status: "completed",
  processingTimeMs: 5000,
  createdAt: "2025-01-19T12:00:00Z",
  transcribedText: "This is a test transcription with speaker diarization.",
  speakerSegments: [
    {
      speaker: "Speaker 1",
      text: "This is a test transcription",
      start: 0,
      end: 3.5,
      confidence: 0.95,
    },
    {
      speaker: "Speaker 2",
      text: "with speaker diarization.",
      start: 3.5,
      end: 6.0,
      confidence: 0.92,
    },
  ],
  speakerCount: 2,
  confidenceScore: 0.935,
  hasSpeakerDiarization: true,
};

describe("FileUpload Component - S1.3 Integration Tests", () => {
  const mockOnTranscriptionComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the file upload dropzone", () => {
    render(
      <FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    expect(
      screen.getByText(/drag & drop audio files here/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/supported formats:/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum file size:/i)).toBeInTheDocument();
  });

  it("should show supported file formats", () => {
    render(<FileUpload />);

    expect(
      screen.getByText(/\.mp3, \.wav, \.m4a, \.flac, \.ogg/)
    ).toBeInTheDocument();
  });

  it("should show maximum file size", () => {
    render(<FileUpload />);

    expect(screen.getByText(/500 MB/)).toBeInTheDocument();
  });

  it("should accept custom file types and size limits", () => {
    render(
      <FileUpload
        acceptedFileTypes={[".mp3", ".wav"]}
        maxFileSize={100 * 1024 * 1024} // 100MB
      />
    );

    expect(screen.getByText(/\.mp3, \.wav/)).toBeInTheDocument();
    expect(screen.getByText(/100 MB/)).toBeInTheDocument();
  });

  it("should handle successful file upload and transcription workflow", async () => {
    const mockApiResponse = {
      data: mockTranscriptionResponse,
      success: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockApiService = apiService as any;
    mockApiService.uploadFile.mockImplementation(
      (_file: File, progressCallback: (progress: number) => void) => {
        // Simulate upload progress
        setTimeout(() => progressCallback(50), 100);
        setTimeout(() => progressCallback(90), 200);
        setTimeout(() => progressCallback(100), 300);

        return Promise.resolve(mockApiResponse);
      }
    );

    render(
      <FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    // Create a test file
    const testFile = new File(["test audio content"], "test-audio.mp3", {
      type: "audio/mp3",
    });

    // Get the file input and simulate file drop
    const fileInput = screen
      .getByRole("button", { name: /select files/i })
      .parentElement?.querySelector('input[type="file"]');

    if (fileInput) {
      Object.defineProperty(fileInput, "files", {
        value: [testFile],
        writable: false,
      });

      fireEvent.change(fileInput);
    }

    // Wait for upload queue to appear
    await waitFor(() => {
      expect(screen.getByText(/upload queue \(1\)/i)).toBeInTheDocument();
    });

    // Check that file appears in queue
    expect(screen.getByText("test-audio.mp3")).toBeInTheDocument();

    // Wait for upload to complete
    await waitFor(
      () => {
        expect(
          screen.getByText(/transcription completed/i)
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify the callback was called
    expect(mockOnTranscriptionComplete).toHaveBeenCalledWith(
      mockTranscriptionResponse
    );

    // Check workflow stepper completion
    expect(screen.getByText("Complete")).toBeInTheDocument();

    // Check success message shows processing time and speaker count
    expect(screen.getByText(/completed in 5000ms/)).toBeInTheDocument();
    expect(screen.getByText(/detected 2 speakers/i)).toBeInTheDocument();
  });

  it("should handle upload errors gracefully", async () => {
    const mockError = new Error("Upload failed: Network error");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockApiService = apiService as any;
    mockApiService.uploadFile.mockRejectedValue(mockError);

    render(
      <FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    // Create a test file
    const testFile = new File(["test audio content"], "test-audio.mp3", {
      type: "audio/mp3",
    });

    const fileInput = screen
      .getByRole("button", { name: /select files/i })
      .parentElement?.querySelector('input[type="file"]');

    if (fileInput) {
      Object.defineProperty(fileInput, "files", {
        value: [testFile],
        writable: false,
      });

      fireEvent.change(fileInput);
    }

    // Wait for error to appear
    await waitFor(() => {
      expect(
        screen.getByText(/upload failed: network error/i)
      ).toBeInTheDocument();
    });

    // Verify error status in workflow
    expect(screen.getByText("error")).toBeInTheDocument();

    // Verify callback was not called on error
    expect(mockOnTranscriptionComplete).not.toHaveBeenCalled();
  });

  it("should show queue summary with status counts", async () => {
    render(
      <FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    // Simulate adding multiple files with different statuses
    const testFile1 = new File(["test 1"], "test1.mp3", { type: "audio/mp3" });
    const testFile2 = new File(["test 2"], "test2.mp3", { type: "audio/mp3" });

    const fileInput = screen
      .getByRole("button", { name: /select files/i })
      .parentElement?.querySelector('input[type="file"]');

    if (fileInput) {
      Object.defineProperty(fileInput, "files", {
        value: [testFile1, testFile2],
        writable: false,
      });

      fireEvent.change(fileInput);
    }

    // Wait for upload queue to appear
    await waitFor(() => {
      expect(screen.getByText(/upload queue \(2\)/i)).toBeInTheDocument();
    });

    // Check that both files appear
    expect(screen.getByText("test1.mp3")).toBeInTheDocument();
    expect(screen.getByText("test2.mp3")).toBeInTheDocument();
  });

  it("should allow removing files from queue", async () => {
    render(
      <FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    const testFile = new File(["test"], "test.mp3", { type: "audio/mp3" });

    const fileInput = screen
      .getByRole("button", { name: /select files/i })
      .parentElement?.querySelector('input[type="file"]');

    if (fileInput) {
      Object.defineProperty(fileInput, "files", {
        value: [testFile],
        writable: false,
      });

      fireEvent.change(fileInput);
    }

    // Wait for file to appear
    await waitFor(() => {
      expect(screen.getByText("test.mp3")).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteButton);

    // Verify file was removed
    await waitFor(() => {
      expect(screen.queryByText("test.mp3")).not.toBeInTheDocument();
    });
  });

  it("should show workflow stepper with correct steps", async () => {
    render(
      <FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    const testFile = new File(["test"], "test.mp3", { type: "audio/mp3" });

    const fileInput = screen
      .getByRole("button", { name: /select files/i })
      .parentElement?.querySelector('input[type="file"]');

    if (fileInput) {
      Object.defineProperty(fileInput, "files", {
        value: [testFile],
        writable: false,
      });

      fireEvent.change(fileInput);
    }

    // Wait for workflow stepper to appear
    await waitFor(() => {
      expect(screen.getByText("File Selected")).toBeInTheDocument();
      expect(screen.getByText("Uploading")).toBeInTheDocument();
      expect(
        screen.getByText("Processing & Transcription")
      ).toBeInTheDocument();
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });
  });
});
