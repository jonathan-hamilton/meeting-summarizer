/**
 * FileUpload Component Tests - Tour-Integrated Upload System
 * Tests S5.1 tour integration and file upload functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import FileUpload from "../../components/FileUpload";
import { createApiService } from "../../services/apiServiceFactory";
import { useTourStore } from "../../stores/tourStore";
import { useSpeakerSessionStore } from "../../stores/speakerSessionStore";
import { renderWithProviders } from "../utils/TestProviders";

// Mock the stores
vi.mock("../../stores/tourStore", () => ({
  useTourStore: vi.fn(),
}));

vi.mock("../../stores/speakerSessionStore", () => ({
  useSpeakerSessionStore: vi.fn(),
}));

// Mock API service factory
vi.mock("../../services/apiServiceFactory", () => ({
  createApiService: vi.fn(),
}));

const mockUseTourStore = useTourStore as unknown as ReturnType<typeof vi.fn>;
const mockUseSpeakerSessionStore = useSpeakerSessionStore as unknown as ReturnType<typeof vi.fn>;
const mockCreateApiService = createApiService as unknown as ReturnType<typeof vi.fn>;

describe("FileUpload Component - Tour Integration", () => {
  const mockTourStore = {
    isActive: false,
    currentStep: 0,
    getTotalSteps: vi.fn().mockReturnValue(18),
    isActionDisabledDuringTour: vi.fn().mockReturnValue(false),
    triggerStepAction: vi.fn(),
    isCurrentStep: vi.fn().mockReturnValue(false),
  };

  const mockSpeakerSessionStore = {
    setTranscript: vi.fn(),
    setAudioFile: vi.fn(),
    setSpeakers: vi.fn(),
    clearSession: vi.fn(),
    setTranscriptionStats: vi.fn(),
    setProcessingTime: vi.fn(),
    transcript: "",
    audioFile: null,
    speakers: [],
    isUploading: false,
    setIsUploading: vi.fn(),
  };

  const mockApiService = {
    uploadFile: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTourStore.mockReturnValue(mockTourStore);
    mockUseSpeakerSessionStore.mockReturnValue(mockSpeakerSessionStore);
    mockCreateApiService.mockReturnValue(mockApiService);
  });

  describe("Basic Upload Functionality", () => {
    it("renders upload interface correctly", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("SELECT FILE")).toBeInTheDocument();
      expect(screen.getByText("Select an audio file to transcribe")).toBeInTheDocument();
    });

    it("triggers file selection when SELECT FILE is clicked", async () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("SELECT FILE");
      fireEvent.click(selectButton);
      
      // Should trigger file input click
      const fileInput = screen.getByRole("button", { hidden: true });
      expect(fileInput).toBeInTheDocument();
    });

    it("handles file selection and starts transcription", async () => {
      const mockFile = new File(["audio content"], "test.mp3", { type: "audio/mp3" });
      const mockTranscriptionResult = {
        transcript: "Test transcript",
        speakers: ["Speaker 1", "Speaker 2"],
        stats: { confidence: 0.95, duration: 120 },
      };

      mockApiService.uploadFile.mockResolvedValue(mockTranscriptionResult);

      renderWithProviders(<FileUpload />);
      
      const fileInput = screen.getByLabelText(/select.*file/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(mockSpeakerSessionStore.setIsUploading).toHaveBeenCalledWith(true);
      });

      await waitFor(() => {
        expect(mockApiService.uploadFile).toHaveBeenCalledWith(mockFile);
      });

      await waitFor(() => {
        expect(mockSpeakerSessionStore.setTranscript).toHaveBeenCalledWith("Test transcript");
        expect(mockSpeakerSessionStore.setSpeakers).toHaveBeenCalledWith(["Speaker 1", "Speaker 2"]);
        expect(mockSpeakerSessionStore.setIsUploading).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Tour Integration - S5.1 Feature", () => {
    it("disables upload when tour is active but not on step 1", () => {
      mockTourStore.isActive = true;
      mockTourStore.currentStep = 2;
      mockTourStore.isActionDisabledDuringTour.mockReturnValue(true);

      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("SELECT FILE");
      expect(selectButton).toBeDisabled();
    });

    it("enables upload when tour is on step 1", () => {
      mockTourStore.isActive = true;
      mockTourStore.currentStep = 1;
      mockTourStore.isCurrentStep.mockImplementation((step) => step === 1);
      mockTourStore.isActionDisabledDuringTour.mockReturnValue(false);

      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("SELECT FILE");
      expect(selectButton).not.toBeDisabled();
    });

    it("triggers tour step action on file selection", async () => {
      mockTourStore.isActive = true;
      mockTourStore.currentStep = 1;
      mockTourStore.isCurrentStep.mockImplementation((step) => step === 1);

      const mockFile = new File(["audio content"], "test.mp3", { type: "audio/mp3" });
      
      renderWithProviders(<FileUpload />);
      
      const fileInput = screen.getByLabelText(/select.*file/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(mockTourStore.triggerStepAction).toHaveBeenCalledWith("file-select");
    });

    it("shows tour-specific messaging during tour", () => {
      mockTourStore.isActive = true;
      mockTourStore.currentStep = 1;
      mockTourStore.isCurrentStep.mockImplementation((step) => step === 1);

      renderWithProviders(<FileUpload />);
      
      // Should show tour-specific instructions
      expect(screen.getByText(/select.*mock.*audio.*file/i)).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("shows loading state during upload", () => {
      mockSpeakerSessionStore.isUploading = true;

      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("UPLOADING...")).toBeInTheDocument();
      expect(screen.getByText("UPLOADING...")).toBeDisabled();
    });

    it("disables interactions during upload", () => {
      mockSpeakerSessionStore.isUploading = true;

      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("UPLOADING...");
      expect(selectButton).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("handles transcription service errors gracefully", async () => {
      const mockFile = new File(["audio content"], "test.mp3", { type: "audio/mp3" });
      
      mockApiService.uploadFile.mockRejectedValue(
        new Error("Transcription failed")
      );

      renderWithProviders(<FileUpload />);
      
      const fileInput = screen.getByLabelText(/select.*file/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      await waitFor(() => {
        expect(mockSpeakerSessionStore.setIsUploading).toHaveBeenCalledWith(false);
      });

      // Should display error state
      expect(screen.getByText(/error.*occurred/i)).toBeInTheDocument();
    });

    it("validates file types", () => {
      const mockFile = new File(["text content"], "test.txt", { type: "text/plain" });
      
      renderWithProviders(<FileUpload />);
      
      const fileInput = screen.getByLabelText(/select.*file/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(screen.getByText(/please.*select.*audio.*file/i)).toBeInTheDocument();
      expect(mockApiService.uploadFile).not.toHaveBeenCalled();
    });

    it("handles empty file selection", () => {
      renderWithProviders(<FileUpload />);
      
      const fileInput = screen.getByLabelText(/select.*file/i);
      fireEvent.change(fileInput, { target: { files: [] } });

      expect(mockApiService.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      renderWithProviders(<FileUpload />);
      
      const fileInput = screen.getByLabelText(/select.*audio.*file/i);
      expect(fileInput).toHaveAttribute("accept", "audio/*");
    });

    it("supports keyboard navigation", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("SELECT FILE");
      expect(selectButton).toHaveAttribute("tabIndex", "0");
    });
  });
});
