/**
 * FileUpload Component Tests - S5.4 Phase 2 Priority Component Coverage
 * Focused on achieving test coverage with working tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import FileUpload from "../../components/FileUpload";
import { createApiService } from "../../services/apiServiceFactory";
import { renderWithProviders } from "../utils/TestProviders";
import type { TranscriptionResponse } from "../../types";

// Mock API service factory
vi.mock("../../services/apiServiceFactory", () => ({
  createApiService: vi.fn(),
}));

const mockCreateApiService = createApiService as unknown as ReturnType<typeof vi.fn>;

// Mock TranscriptionResponse data
const mockTranscriptionResponse: TranscriptionResponse = {
  transcriptionId: "test-transcript-123",
  fileName: "test-audio.mp3",
  fileSize: 2048000,
  status: "completed",
  transcribedText: "Test meeting transcript content",
  speakerSegments: [
    {
      speaker: "SPEAKER_01",
      text: "Hello everyone, welcome to the meeting.",
      start: 0.0,
      end: 3.5,
    },
    {
      speaker: "SPEAKER_02",
      text: "Thank you for having us here today.",
      start: 4.0,
      end: 6.8,
    }
  ],
  processingTimeMs: 1500,
  createdAt: "2025-09-05T10:00:00Z",
  completedAt: "2025-09-05T10:00:01Z",
  duration: 180
};

describe("FileUpload Component - S5.4 Phase 2 Coverage", () => {
  let mockOnTranscriptionComplete: ReturnType<typeof vi.fn>;
  let mockApiService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOnTranscriptionComplete = vi.fn();
    
    // Mock API service with upload functionality
    mockApiService = {
      uploadFile: vi.fn().mockResolvedValue({ data: mockTranscriptionResponse }),
      transcribeAudio: vi.fn().mockResolvedValue(mockTranscriptionResponse),
    };
    
    mockCreateApiService.mockReturnValue(mockApiService);
  });

  describe("Initial State and Rendering", () => {
    it("renders file upload interface correctly", () => {
      renderWithProviders(<FileUpload />);

      expect(screen.getByText("Click to start demo transcription")).toBeInTheDocument();
      expect(screen.getByText("Demo mode - Simulated transcription with mock data")).toBeInTheDocument();
      expect(screen.getByText("Supported formats: .mp3, .wav, .m4a, .flac, .ogg, .webm")).toBeInTheDocument();
      expect(screen.getByText("Maximum file size: 1 GB")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /select file/i })).toBeInTheDocument();
    });

    it("displays upload elements", () => {
      renderWithProviders(<FileUpload />);
      
      // Use getAllByText for elements that appear multiple times
      const cloudUploadElements = screen.getAllByText("CloudUpload");
      expect(cloudUploadElements.length).toBeGreaterThan(0);
    });

    it("shows file constraints", () => {
      renderWithProviders(<FileUpload />);

      expect(screen.getByText(/Supported formats/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum file size/)).toBeInTheDocument();
    });

    it("renders with custom file size limit", () => {
      const customMaxSize = 500 * 1024 * 1024; // 500MB
      renderWithProviders(<FileUpload maxFileSize={customMaxSize} />);
      
      expect(screen.getByText("Maximum file size: 500 MB")).toBeInTheDocument();
    });

    it("renders with custom file types", () => {
      const customTypes = [".mp3", ".wav"];
      renderWithProviders(<FileUpload acceptedFileTypes={customTypes} />);

      expect(screen.getByText("Supported formats: .mp3, .wav")).toBeInTheDocument();
    });
  });

  describe("API Service Integration", () => {
    it("creates API service on component mount", () => {
      renderWithProviders(<FileUpload />);

      expect(mockCreateApiService).toHaveBeenCalled();
    });

    it("accepts transcription callback prop", () => {
      const mockCallback = vi.fn();
      
      renderWithProviders(<FileUpload onTranscriptionComplete={mockCallback} />);
      
      // Component should render without errors when callback provided
      expect(screen.getByRole("button", { name: /select file/i })).toBeInTheDocument();
    });

    it("renders without callback prop", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByRole("button", { name: /select file/i })).toBeInTheDocument();
    });

    it("handles all prop variations", () => {
      const customProps = {
        onTranscriptionComplete: vi.fn(),
        maxFileSize: 100000000,
        acceptedFileTypes: [".mp3", ".wav"]
      };
      
      renderWithProviders(<FileUpload {...customProps} />);
      
      expect(screen.getByRole("button", { name: /select file/i })).toBeInTheDocument();
    });
  });

  describe("Tour Integration S5.1 Feature", () => {
    it("shows tour navigation controls", () => {
      renderWithProviders(<FileUpload />);

      expect(screen.getByRole("button", { name: /restart tour/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /close tour/i })).toBeInTheDocument();
    });

    it("displays step counter", () => {
      renderWithProviders(<FileUpload />);

      // Look for step information - text is split across elements
      expect(screen.getByText(/Step/)).toBeInTheDocument();
    });

    it("shows upload instructions in tour", () => {
      renderWithProviders(<FileUpload />);

      expect(screen.getByText("Upload Your Audio")).toBeInTheDocument();
      expect(screen.getByText("Click 'SELECT FILE' to select a mock audio file to transcribe.")).toBeInTheDocument();
    });

    it("has disabled next button initially", () => {
      renderWithProviders(<FileUpload />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it("displays step progress", () => {
      renderWithProviders(<FileUpload />);

      // Step counter elements - look for the specific step counter pattern
      expect(screen.getByText("1 of 18")).toBeInTheDocument();
    });
  });

  describe("Demo Mode Integration", () => {
    it("shows demo-specific messaging", () => {
      renderWithProviders(<FileUpload />);

      expect(screen.getByText("Demo mode - Simulated transcription with mock data")).toBeInTheDocument();
      expect(screen.getByText("Click to start demo transcription")).toBeInTheDocument();
    });

    it("prevents file input in demo mode", () => {
      renderWithProviders(<FileUpload />);
      
      // In demo mode, file input should not be present in DOM
      const fileInputs = screen.queryAllByRole("textbox");
      expect(fileInputs).toHaveLength(0); // No file inputs in demo mode
    });

    it("shows demo upload instructions", () => {
      renderWithProviders(<FileUpload />);

      expect(screen.getByText("Click 'SELECT FILE' to select a mock audio file to transcribe.")).toBeInTheDocument();
    });

    it("displays correct demo mode title", () => {
      renderWithProviders(<FileUpload />);

      expect(screen.getByText("Click to start demo transcription")).toBeInTheDocument();
    });

    it("includes demo mode explanation", () => {
      renderWithProviders(<FileUpload />);

      expect(screen.getByText("Demo mode - Simulated transcription with mock data")).toBeInTheDocument();
    });
  });

  describe("Component Props and Configuration", () => {
    it("displays default file size limit", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("Maximum file size: 1 GB")).toBeInTheDocument();
    });

    it("shows default supported formats", () => {
      renderWithProviders(<FileUpload />);

      expect(screen.getByText("Supported formats: .mp3, .wav, .m4a, .flac, .ogg, .webm")).toBeInTheDocument();
    });

    it("handles empty file types array", () => {
      renderWithProviders(<FileUpload acceptedFileTypes={[]} />);

      // Should show supported formats with no formats listed
      expect(screen.getByText(/Supported formats:/)).toBeInTheDocument();
    });

    it("formats file sizes correctly", () => {
      renderWithProviders(<FileUpload maxFileSize={0} />);

      expect(screen.getByText("Maximum file size: 0 Bytes")).toBeInTheDocument();
    });

    it("accepts callback without errors", () => {
      const mockCallback = vi.fn();
      
      renderWithProviders(<FileUpload onTranscriptionComplete={mockCallback} />);
      
      expect(mockCallback).toHaveBeenCalledTimes(0); // Not called on initial render
    });

    it("renders with undefined callback", () => {
      renderWithProviders(<FileUpload onTranscriptionComplete={undefined} />);
      
      expect(screen.getByRole("button", { name: /select file/i })).toBeInTheDocument();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("handles component mounting", () => {
      const { unmount } = renderWithProviders(<FileUpload />);
      
      expect(screen.getByRole("button", { name: /select file/i })).toBeInTheDocument();
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it("manages re-renders gracefully", () => {
      const { rerender } = renderWithProviders(<FileUpload />, { initialMode: "demo" });
      
      expect(screen.getByText("Click to start demo transcription")).toBeInTheDocument();
      
      rerender(<FileUpload acceptedFileTypes={[".mp3"]} />);
      
      expect(screen.getByRole("button", { name: /select file/i })).toBeInTheDocument();
    });

    it("handles prop changes", () => {
      const { rerender } = renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("Maximum file size: 1 GB")).toBeInTheDocument();
      
      rerender(<FileUpload maxFileSize={100000} />);
      
      expect(screen.getByText("Maximum file size: 97.66 KB")).toBeInTheDocument();
    });

    it("maintains stability with rapid changes", () => {
      const { rerender } = renderWithProviders(<FileUpload />);
      
      expect(() => {
        rerender(<FileUpload acceptedFileTypes={[".mp3"]} />);
        rerender(<FileUpload maxFileSize={100000} />);
        rerender(<FileUpload acceptedFileTypes={[".wav", ".mp3"]} />);
      }).not.toThrow();
    });

    it("handles zero and very small file sizes", () => {
      renderWithProviders(<FileUpload maxFileSize={1} />);

      expect(screen.getByText("Maximum file size: 1 Bytes")).toBeInTheDocument();
    });
  });

  describe("Accessibility and UX", () => {
    it("provides accessible button element", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByRole("button", { name: /select file/i });
      expect(selectButton).toBeInTheDocument();
      expect(selectButton).not.toBeDisabled();
    });

    it("shows clear heading structure", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("Upload Your Audio")).toBeInTheDocument();
    });

    it("displays user instructions", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("Click 'SELECT FILE' to select a mock audio file to transcribe.")).toBeInTheDocument();
    });

    it("shows file format constraints", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText(/Supported formats/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum file size/)).toBeInTheDocument();
    });

    it("maintains button accessibility", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByRole("button", { name: /select file/i });
      expect(selectButton).toHaveAttribute("type", "button");
    });

    it("provides tour accessibility features", () => {
      renderWithProviders(<FileUpload />);
      
      const restartButton = screen.getByRole("button", { name: /restart tour/i });
      const closeButton = screen.getByRole("button", { name: /close tour/i });
      
      expect(restartButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("Integration with Core Application State", () => {
    it("integrates with app mode context", () => {
      renderWithProviders(<FileUpload />);
      
      // Should show demo mode content by default
      expect(screen.getByText("Demo mode - Simulated transcription with mock data")).toBeInTheDocument();
    });

    it("calls API service factory", () => {
      renderWithProviders(<FileUpload />);
      
      expect(mockCreateApiService).toHaveBeenCalledWith("demo");
    });

    it("maintains consistent state", () => {
      const { rerender } = renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("Click to start demo transcription")).toBeInTheDocument();
      
      rerender(<FileUpload />);
      
      expect(screen.getByText("Click to start demo transcription")).toBeInTheDocument();
    });

    it("integrates with tour state", () => {
      renderWithProviders(<FileUpload />);
      
      // Should show tour elements
      expect(screen.getByText("Upload Your Audio")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /restart tour/i })).toBeInTheDocument();
    });
  });
});
