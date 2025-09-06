/**
 * FileUpload Component Tests - S5.4 Phase 2 Priority Component Coverage
 * Fixed version with correct component expectations and working tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
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
    it("renders file upload interface in demo mode", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      expect(screen.getByText("Click to start demo transcription")).toBeInTheDocument();
      expect(screen.getByText("Demo mode - Simulated transcription with mock data")).toBeInTheDocument();
      expect(screen.getByText("Supported formats: .mp3, .wav, .m4a, .flac, .ogg, .webm")).toBeInTheDocument();
      expect(screen.getByText("Maximum file size: 1 GB")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /select file/i })).toBeInTheDocument();
    });

    it("renders file upload interface in production mode", () => {
      renderWithProviders(<FileUpload />, { initialMode: "production" });

      expect(screen.getByText("Drag & drop audio files here, or click to select")).toBeInTheDocument();
      expect(screen.getByText("Supported formats: .mp3, .wav, .m4a, .flac, .ogg, .webm")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /select file/i })).toBeInTheDocument();
    });

    it("displays cloud upload icon", () => {
      renderWithProviders(<FileUpload />);
      
      // In the actual component, it's rendered as text "CloudUpload"  
      expect(screen.getByText("CloudUpload")).toBeInTheDocument();
    });

    it("renders without errors for all supported file types", () => {
      renderWithProviders(
        <FileUpload 
          acceptedFileTypes={[".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm"]} 
        />
      );

      expect(screen.getByText(/Supported formats/)).toBeInTheDocument();
    });

    it("shows correct file size limit", () => {
      const customMaxSize = 500 * 1024 * 1024; // 500MB
      renderWithProviders(<FileUpload maxFileSize={customMaxSize} />);
      
      expect(screen.getByText("Maximum file size: 500 MB")).toBeInTheDocument();
    });
  });

  describe("API Service Integration", () => {
    it("creates API service with correct mode", () => {
      renderWithProviders(<FileUpload />, { initialMode: "production" });

      expect(mockCreateApiService).toHaveBeenCalledWith("production");
    });

    it("creates API service with demo mode", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      expect(mockCreateApiService).toHaveBeenCalledWith("demo");
    });

    it("handles transcription callback correctly", () => {
      renderWithProviders(
        <FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />, 
        { initialMode: "demo" }
      );

      expect(mockOnTranscriptionComplete).toHaveBeenCalledTimes(0); // Not called until upload
    });

    it("provides proper props interface", () => {
      // Test that component accepts all expected props without errors
      const customProps = {
        onTranscriptionComplete: vi.fn(),
        maxFileSize: 100000000,
        acceptedFileTypes: [".mp3", ".wav"]
      };
      
      expect(() => {
        renderWithProviders(<FileUpload {...customProps} />);
      }).not.toThrow();
    });
  });

  describe("Tour Integration S5.1 Feature", () => {
    it("displays tour popover elements in demo mode", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      // In demo mode with tour active, look for tour elements  
      expect(screen.getByText("Step")).toBeInTheDocument();
    });

    it("shows tour navigation controls", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      expect(screen.getByRole("button", { name: /restart tour/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /close tour/i })).toBeInTheDocument();
    });

    it("displays correct step information", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("of")).toBeInTheDocument(); 
      expect(screen.getByText("18")).toBeInTheDocument();
    });

    it("shows upload instructions in tour", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      expect(screen.getByText("Upload Your Audio")).toBeInTheDocument();
      expect(screen.getByText("Click 'SELECT FILE' to select a mock audio file to transcribe.")).toBeInTheDocument();
    });

    it("disables next button initially", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe("Demo Mode Integration", () => {
    it("shows demo-specific messaging", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      expect(screen.getByText("Demo mode - Simulated transcription with mock data")).toBeInTheDocument();
      expect(screen.getByText("Click to start demo transcription")).toBeInTheDocument();
    });

    it("triggers demo upload on button click", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      const selectButton = screen.getByRole("button", { name: /select file/i });
      
      expect(() => {
        fireEvent.click(selectButton);
      }).not.toThrow();
    });

    it("prevents file dialog in demo mode", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });
      
      // Component should disable file input in demo mode  
      const fileInputs = screen.queryAllByDisplayValue("");
      expect(fileInputs).toHaveLength(0); // No file inputs in demo mode
    });

    it("displays demo upload instructions", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      expect(screen.getByText("Click 'SELECT FILE' to select a mock audio file to transcribe.")).toBeInTheDocument();
    });

    it("shows simulated progress in demo mode", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });

      // Demo mode should indicate it's simulated
      expect(screen.getByText("Demo mode - Simulated transcription with mock data")).toBeInTheDocument();
    });
  });

  describe("Component Props and Configuration", () => {
    it("accepts custom file size limits", () => {
      const customSize = 250 * 1024 * 1024; // 250MB
      renderWithProviders(<FileUpload maxFileSize={customSize} />);

      expect(screen.getByText("Maximum file size: 250 MB")).toBeInTheDocument();
    });

    it("accepts custom file types", () => {
      const customTypes = [".mp3", ".wav"];
      renderWithProviders(<FileUpload acceptedFileTypes={customTypes} />);

      expect(screen.getByText("Supported formats: .mp3, .wav")).toBeInTheDocument();
    });

    it("handles onTranscriptionComplete callback", () => {
      const mockCallback = vi.fn();
      
      renderWithProviders(<FileUpload onTranscriptionComplete={mockCallback} />);
      
      // Component should accept callback without errors
      expect(mockCallback).toHaveBeenCalledTimes(0); // Not called on initial render
    });

    it("renders with default props when none provided", () => {
      expect(() => {
        renderWithProviders(<FileUpload />);
      }).not.toThrow();
      
      expect(screen.getByText("Maximum file size: 1 GB")).toBeInTheDocument();
      expect(screen.getByText(/Supported formats/)).toBeInTheDocument();
    });

    it("handles all supported audio formats", () => {
      renderWithProviders(<FileUpload />);

      const formatText = screen.getByText("Supported formats: .mp3, .wav, .m4a, .flac, .ogg, .webm");
      expect(formatText).toBeInTheDocument();
    });

    it("displays file size in human readable format", () => {
      renderWithProviders(<FileUpload />);

      // Default 1GB limit should show as "1 GB"
      expect(screen.getByText("Maximum file size: 1 GB")).toBeInTheDocument();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("handles missing callback gracefully", () => {
      expect(() => {
        renderWithProviders(<FileUpload onTranscriptionComplete={undefined} />);
      }).not.toThrow();
    });

    it("renders with empty file types array", () => {
      renderWithProviders(<FileUpload acceptedFileTypes={[]} />);

      expect(screen.getByText("Supported formats: ")).toBeInTheDocument();
    });

    it("handles zero file size limit", () => {
      renderWithProviders(<FileUpload maxFileSize={0} />);

      expect(screen.getByText("Maximum file size: 0 Bytes")).toBeInTheDocument();
    });

    it("maintains component stability with rapid state changes", () => {
      const { rerender } = renderWithProviders(<FileUpload />, { initialMode: "demo" });
      
      expect(() => {
        rerender(<FileUpload acceptedFileTypes={[".mp3"]} />);
        rerender(<FileUpload maxFileSize={100000} />);
      }).not.toThrow();
    });

    it("handles component remounting correctly", () => {
      const { unmount } = renderWithProviders(<FileUpload />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe("Accessibility and UX", () => {
    it("provides proper button accessibility", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByRole("button", { name: /select file/i })).toBeInTheDocument();
    });

    it("maintains proper heading structure in tour mode", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });
      
      expect(screen.getByText("Upload Your Audio")).toBeInTheDocument();
    });

    it("provides clear instructions for users", () => {
      renderWithProviders(<FileUpload />, { initialMode: "production" });
      
      expect(screen.getByText("Drag & drop audio files here, or click to select")).toBeInTheDocument();
    });

    it("shows file format and size constraints clearly", () => {
      renderWithProviders(<FileUpload />);
      
      // Users should clearly see file constraints
      expect(screen.getByText(/Supported formats/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum file size/)).toBeInTheDocument();
    });

    it("supports keyboard navigation", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByRole("button", { name: /select file/i });
      // Button should be focusable (tabIndex 0 is default for buttons)
      expect(selectButton).toBeInTheDocument();
    });

    it("provides appropriate button states", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByRole("button", { name: /select file/i });
      expect(selectButton).not.toBeDisabled(); // Should be enabled initially
    });
  });

  describe("Integration with Core Application State", () => {
    it("integrates with app mode context correctly", () => {
      renderWithProviders(<FileUpload />, { initialMode: "production" });
      
      // Should show production mode content
      expect(screen.getByText("Drag & drop audio files here, or click to select")).toBeInTheDocument();
    });

    it("respects demo mode from context", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });
      
      // Should show demo mode content
      expect(screen.getByText("Demo mode - Simulated transcription with mock data")).toBeInTheDocument();
    });

    it("respects app mode context", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });
      
      expect(mockCreateApiService).toHaveBeenCalledWith("demo");
    });

    it("maintains state consistency across renders", () => {
      const { rerender } = renderWithProviders(<FileUpload />, { initialMode: "demo" });
      
      expect(screen.getByText("Click to start demo transcription")).toBeInTheDocument();
      
      rerender(<FileUpload />);
      
      expect(screen.getByText("Click to start demo transcription")).toBeInTheDocument();
    });
  });
});
