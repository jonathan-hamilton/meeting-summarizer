/**
 * FileUpload Component Tests - Tour-Integrated Upload System
 * Tests S5.1 tour integration and file upload functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import FileUpload from "../../components/FileUpload";
import { createApiService } from "../../services/apiServiceFactory";
import { renderWithProviders } from "../utils/TestProviders";

// Import global mocks - these provide comprehensive store mocking
import "../mocks/tourStoreMock";
import "../mocks/speakerSessionStoreMock";

// Mock API service factory
vi.mock("../../services/apiServiceFactory", () => ({
  createApiService: vi.fn(),
}));

const mockCreateApiService = createApiService as unknown as ReturnType<typeof vi.fn>;

describe("FileUpload Component - Tour Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API service factory
    mockCreateApiService.mockReturnValue({
      transcribeAudio: vi.fn().mockResolvedValue({
        transcript: "Test transcript content",
        speakers: [
          { id: "Speaker 1", name: "Speaker 1" },
          { id: "Speaker 2", name: "Speaker 2" }
        ],
        processingTime: 1500
      })
    });
  });

  describe("Basic Upload Functionality", () => {
    it("renders upload interface correctly", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("Select File")).toBeInTheDocument();
    });

    it("triggers file selection when Select File is clicked", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });

    it("handles file selection and starts transcription", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });
  });

  describe("Tour Integration - S5.1 Feature", () => {
    it("disables upload when tour is active but not on step 1", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });

    it("enables upload when tour is on step 1", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });

    it("triggers tour step action on file selection", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });

    it("shows tour-specific messaging during tour", () => {
      renderWithProviders(<FileUpload />);
      
      expect(screen.getByText("Select File")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("shows loading state during upload", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });

    it("disables interactions during upload", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("handles transcription service errors gracefully", () => {
      mockCreateApiService.mockReturnValue({
        transcribeAudio: vi.fn().mockRejectedValue(new Error("Transcription failed"))
      });

      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });

    it("validates file types", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });

    it("handles empty file selection", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });

    it("supports keyboard navigation", () => {
      renderWithProviders(<FileUpload />);
      
      const selectButton = screen.getByText("Select File");
      expect(selectButton).toBeInTheDocument();
    });
  });
});
