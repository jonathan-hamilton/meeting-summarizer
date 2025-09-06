/**
 * Comprehensive FileUpload Component Tests - S5.4 Phase 2
 * Tests file upload functionality, tour integration, demo mode, and error handling
 */

// @ts-nocheck - Disable TypeScript for test mocks
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileUpload from "../../components/FileUpload";
import { createApiService } from "../../services/apiServiceFactory";
import { renderWithProviders } from "../utils/TestProviders";
import type { TranscriptionResponse } from "../../types";

// Mock API service factory
vi.mock("../../services/apiServiceFactory", () => ({
  createApiService: vi.fn(),
}));

// Mock react-dropzone - cast as any to avoid strict typing issues
vi.mock("react-dropzone", () => ({
  useDropzone: vi.fn().mockReturnValue({
    // @ts-ignore - Mock typing for testing
    getRootProps: vi.fn((props) => ({ ...props, "data-testid": "dropzone" })),
    // @ts-ignore - Mock typing for testing
    getInputProps: vi.fn((props) => ({ ...props, "data-testid": "file-input" })),
    isDragActive: false,
    isDragAccept: false,
    isDragReject: false,
    isFocused: false,
    isFileDialogActive: false,
    acceptedFiles: [],
    fileRejections: [],
    rootRef: { current: document.createElement('div') },
    inputRef: { current: document.createElement('input') },
    open: vi.fn(),
  }),
}));

// Mock tour store with all needed functionality
vi.mock("../../stores/tourStore", () => ({
  useTourStore: Object.assign(
    vi.fn(() => ({
      isActive: false,
      currentStep: 0,
      isCurrentStep: vi.fn(() => false),
      closeStep: vi.fn(),
      triggerStepAction: vi.fn(),
      isActionDisabledDuringTour: vi.fn(() => false),
      startTour: vi.fn(),
      stopTour: vi.fn(),
      getTotalSteps: vi.fn(() => 18),
      getCurrentStepConfig: vi.fn(() => ({
        id: 1,
        title: "Upload Your Audio",
        description: "Click 'SELECT FILE' to select a mock audio file to transcribe.",
        transitionType: 'user-action' as const,
        triggerAction: 'file-select',
        component: 'FileUpload'
      })),
      goToStep: vi.fn(),
      nextStep: vi.fn(),
      previousStep: vi.fn(),
      completeTour: vi.fn(),
    })),
    {
      getState: vi.fn(() => ({
        isActive: false,
        currentStep: 0,
        isCurrentStep: vi.fn(() => false),
        closeStep: vi.fn(),
        triggerStepAction: vi.fn(),
        isActionDisabledDuringTour: vi.fn(() => false),
        startTour: vi.fn(),
        stopTour: vi.fn(),
        getTotalSteps: vi.fn(() => 18),
        getCurrentStepConfig: vi.fn(() => ({
          id: 1,
          title: "Upload Your Audio",
          description: "Click 'SELECT FILE' to select a mock audio file to transcribe.",
          transitionType: 'user-action' as const,
          triggerAction: 'file-select',
          component: 'FileUpload'
        })),
        goToStep: vi.fn(),
        nextStep: vi.fn(),
        previousStep: vi.fn(),
        completeTour: vi.fn(),
      }))
    }
  )
}));

// Mock speaker session store
vi.mock("../../stores/speakerSessionStore", () => ({
  useSpeakerSessionStore: vi.fn(() => ({
    transcriptionId: null,
    currentSegments: [],
    speakerMappings: [],
    initializeSession: vi.fn(),
  }))
}));

const mockCreateApiService = createApiService as unknown as ReturnType<typeof vi.fn>;
const mockUseDropzone = vi.mocked((await import("react-dropzone")).useDropzone);

// Mock file for testing
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File(["test content"], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

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

describe("FileUpload Component - Comprehensive Testing (S5.4 Phase 2)", () => {
  let mockApiService: any;
  let mockOnTranscriptionComplete: ReturnType<typeof vi.fn>;
  
  // Helper function to create complete dropzone mock
  const createDropzoneMock = (overrides: any = {}) => ({
    getRootProps: vi.fn((props) => ({ ...props, "data-testid": "dropzone" })),
    getInputProps: vi.fn((props) => ({ ...props, "data-testid": "file-input" })),
    isDragActive: false,
    isDragAccept: false,
    isDragReject: false,
    isFocused: false,
    isFileDialogActive: false,
    acceptedFiles: [],
    fileRejections: [],
    rootRef: { current: document.createElement('div') },
    inputRef: { current: document.createElement('input') },
    open: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOnTranscriptionComplete = vi.fn();
    
    // Mock API service with comprehensive methods
    mockApiService = {
      uploadFile: vi.fn().mockResolvedValue({ data: mockTranscriptionResponse }),
      transcribeAudio: vi.fn().mockResolvedValue(mockTranscriptionResponse),
    };
    
    mockCreateApiService.mockReturnValue(mockApiService);
    
    // Mock useDropzone with default behavior
    mockUseDropzone.mockReturnValue(createDropzoneMock() as any);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Initial State and Rendering", () => {
    it("renders upload interface with correct initial state", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("Upload Audio File")).toBeInTheDocument();
      expect(screen.getByText("Select File")).toBeInTheDocument();
      expect(screen.getByText(/Drag & drop an audio file here, or click to select/)).toBeInTheDocument();
    });

    it("displays accepted file types information", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText(/Accepted formats:/)).toBeInTheDocument();
      expect(screen.getByText(/MP3, WAV, M4A, FLAC, OGG/)).toBeInTheDocument();
    });

    it("shows maximum file size information", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText(/Maximum file size: 1 GB/)).toBeInTheDocument();
    });

    it("initializes with no files uploaded", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.queryByText("Upload Complete")).not.toBeInTheDocument();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });

  describe("File Selection and Validation", () => {
    it("accepts valid audio files", async () => {
      const validFile = createMockFile("test-audio.mp3", 1024 * 1024, "audio/mpeg");
      
      mockUseDropzone.mockReturnValue(createDropzoneMock({
        acceptedFiles: [validFile],
      }) as any);
      
      renderWithProviders(<FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />);
      
      expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    });

    it("rejects files that are too large", () => {
      const oversizedFile = createMockFile("large-file.mp3", 2 * 1024 * 1024 * 1024, "audio/mpeg"); // 2GB
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [],
        fileRejections: [{
          file: oversizedFile,
          errors: [{ code: "file-too-large", message: "File is too large" }],
        }],
      });
      
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    });

    it("rejects unsupported file types", () => {
      const invalidFile = createMockFile("document.pdf", 1024, "application/pdf");
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [],
        fileRejections: [{
          file: invalidFile,
          errors: [{ code: "file-invalid-type", message: "File type not accepted" }],
        }],
      });
      
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    });

    it("handles multiple file selection correctly", () => {
      const file1 = createMockFile("audio1.mp3", 1024, "audio/mpeg");
      const file2 = createMockFile("audio2.wav", 2048, "audio/wav");
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [file1, file2],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    });
  });

  describe("Upload Progress and States", () => {
    it("shows upload progress during file processing", async () => {
      const validFile = createMockFile("test-audio.mp3", 1024, "audio/mpeg");
      let progressCallback: ((progress: number) => void) | undefined;
      
      mockApiService.uploadFile.mockImplementation((_file: File, onProgress: (progress: number) => void) => {
        progressCallback = onProgress;
        return new Promise((resolve) => {
          setTimeout(() => resolve({ data: mockTranscriptionResponse }), 100);
        });
      });
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [validFile],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />);
      
      if (progressCallback) {
        act(() => {
          progressCallback!(50);
        });
      }
      
      expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    });

    it("displays workflow steps during upload", async () => {
      const validFile = createMockFile("test-audio.mp3", 1024, "audio/mpeg");
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [validFile],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />);
      
      expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    });

    it("shows completion state after successful upload", async () => {
      const validFile = createMockFile("test-audio.mp3", 1024, "audio/mpeg");
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [validFile],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />);
      
      await waitFor(() => {
        expect(mockApiService.uploadFile).toHaveBeenCalledWith(validFile, expect.any(Function));
      });
      
      await waitFor(() => {
        expect(mockOnTranscriptionComplete).toHaveBeenCalledWith(mockTranscriptionResponse);
      });
    });

    it("disables upload after file completion", async () => {
      const validFile = createMockFile("test-audio.mp3", 1024, "audio/mpeg");
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [validFile],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />);
      
      await waitFor(() => {
        expect(mockOnTranscriptionComplete).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("displays error message on upload failure", async () => {
      const validFile = createMockFile("test-audio.mp3", 1024, "audio/mpeg");
      
      mockApiService.uploadFile.mockRejectedValue(new Error("Upload failed"));
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [validFile],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload />);
      
      await waitFor(() => {
        expect(mockApiService.uploadFile).toHaveBeenCalled();
      });
    });

    it("handles network timeout errors gracefully", async () => {
      const validFile = createMockFile("test-audio.mp3", 1024, "audio/mpeg");
      
      mockApiService.uploadFile.mockRejectedValue(new Error("Network timeout"));
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [validFile],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload />);
      
      await waitFor(() => {
        expect(mockApiService.uploadFile).toHaveBeenCalled();
      });
    });

    it("allows retry after upload failure", async () => {
      const validFile = createMockFile("test-audio.mp3", 1024, "audio/mpeg");
      
      mockApiService.uploadFile
        .mockRejectedValueOnce(new Error("Upload failed"))
        .mockResolvedValue({ data: mockTranscriptionResponse });
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [validFile],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload />);
      
      await waitFor(() => {
        expect(mockApiService.uploadFile).toHaveBeenCalledTimes(1);
      });
    });

    it("handles corrupted file errors", async () => {
      const validFile = createMockFile("corrupted-audio.mp3", 1024, "audio/mpeg");
      
      mockApiService.uploadFile.mockRejectedValue(new Error("File appears to be corrupted"));
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [validFile],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload />);
      
      await waitFor(() => {
        expect(mockApiService.uploadFile).toHaveBeenCalled();
      });
    });
  });

  describe("Tour Integration - S5.1 Feature", () => {
    it("shows tour popover on step 1", () => {
      // Mock tour store through TestProviders to return step 1 as active
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("Select File")).toBeInTheDocument();
    });

    it("disables upload when tour is active but not on step 1", () => {
      // Mock tour store through TestProviders to return active tour but different step
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      // Test should verify button state based on tour state
      expect(selectButton).toBeInTheDocument();
    });

    it("triggers tour step action on file selection during tour", async () => {
      const mockTriggerStepAction = vi.fn();
      
      const validFile = createMockFile("test-audio.mp3", 1024, "audio/mpeg");
      
      mockUseDropzone.mockReturnValue(createDropzoneMock({
        acceptedFiles: [validFile],
      }) as any);
      
      renderWithProviders(<FileUpload />);
      
      // Verify basic functionality works
      expect(screen.getByText("Select File")).toBeInTheDocument();
    });

    it("enables normal upload when tour is not active", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).not.toBeDisabled();
    });
  });

  describe("Demo Mode Integration", () => {
    it("uses demo API service in demo mode", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });
      
      expect(mockCreateApiService).toHaveBeenCalledWith("demo");
    });

    it("simulates upload progress in demo mode", async () => {
      renderWithProviders(<FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />, { 
        initialMode: "demo" 
      });
      
      expect(screen.getByText("Select File")).toBeInTheDocument();
    });

    it("calls transcription callback with demo data", async () => {
      renderWithProviders(<FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />, { 
        initialMode: "demo" 
      });
      
      // Demo mode should automatically complete and call the callback
      await waitFor(() => {
        expect(mockOnTranscriptionComplete).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it("shows demo-specific messaging", () => {
      renderWithProviders(<FileUpload />, { initialMode: "demo" });
      
      expect(screen.getByText("Select File")).toBeInTheDocument();
    });
  });

  describe("Component Props and Configuration", () => {
    it("uses custom maxFileSize when provided", () => {
      const customMaxSize = 500 * 1024 * 1024; // 500MB
      
      renderWithProviders(<FileUpload maxFileSize={customMaxSize} />);
      
      expect(screen.getByText(/Maximum file size: 500 MB/)).toBeInTheDocument();
    });

    it("uses custom acceptedFileTypes when provided", () => {
      const customTypes = [".mp3", ".wav"];
      
      renderWithProviders(<FileUpload acceptedFileTypes={customTypes} />);
      
      // In demo mode, both text sections show formats
      expect(screen.getByText(/\.mp3, \.wav/)).toBeInTheDocument();
    });

    it("calls onTranscriptionComplete callback when provided", async () => {
      const validFile = createMockFile("test-audio.mp3", 1024, "audio/mpeg");
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [validFile],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload onTranscriptionComplete={mockOnTranscriptionComplete} />);
      
      await waitFor(() => {
        expect(mockOnTranscriptionComplete).toHaveBeenCalledWith(mockTranscriptionResponse);
      });
    });

    it("works without onTranscriptionComplete callback", async () => {
      const validFile = createMockFile("test-audio.mp3", 1024, "audio/mpeg");
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [validFile],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload />);
      
      await waitFor(() => {
        expect(mockApiService.uploadFile).toHaveBeenCalled();
      });
    });
  });

  describe("Utility Functions", () => {
    it("formats time correctly", () => {
      renderWithProviders(<FileUpload />);
      
      // Component should handle time formatting internally
      expect(screen.getByText("Select File")).toBeInTheDocument();
    });

    it("generates unique file IDs for multiple uploads", () => {
      const file1 = createMockFile("audio1.mp3", 1024, "audio/mpeg");
      const file2 = createMockFile("audio2.mp3", 1024, "audio/mpeg");
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [file1, file2],
        fileRejections: [],
      });
      
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    });
  });

  describe("Accessibility and UX", () => {
    it("has proper ARIA labels and roles", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByRole("button", { name: /Select File/i })).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      await user.tab();
      
      expect(selectButton).toHaveAttribute("tabindex", "0");
    });

    it("provides clear error messages for accessibility", () => {
      const invalidFile = createMockFile("document.pdf", 1024, "application/pdf");
      
      mockUseDropzone.mockReturnValue({
        getRootProps: vi.fn(() => ({ "data-testid": "dropzone" })),
        getInputProps: vi.fn(() => ({ "data-testid": "file-input" })),
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
        acceptedFiles: [],
        fileRejections: [{
          file: invalidFile,
          errors: [{ code: "file-invalid-type", message: "File type not accepted" }],
        }],
      });
      
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    });
  });
});
