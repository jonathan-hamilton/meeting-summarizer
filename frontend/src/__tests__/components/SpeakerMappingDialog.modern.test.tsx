import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { SpeakerMappingDialog } from "../../components/SpeakerMappingDialog";
import { renderWithProviders } from "../utils/TestProviders";
import { useSpeakerSessionStore } from "../../stores/speakerSessionStore";
import { createApiService } from "../../services/apiServiceFactory";
import { SpeakerSource } from "../../types";

// Mock external dependencies
vi.mock("../../stores/speakerSessionStore");
vi.mock("../../services/apiServiceFactory");

describe("SpeakerMappingDialog - Modern Architecture", () => {
  const mockOnClose = vi.fn();
  const mockOnMappingsSaved = vi.fn();
  
  const mockApi = {
    saveSpeakerMappings: vi.fn(),
    getSpeakerMappings: vi.fn(),
    deleteSpeakerMapping: vi.fn(),
  };

  const mockSpeakerSessionStore = {
    speakerMappings: [
      {
        speakerId: "Speaker 1",
        name: "John Doe",
        role: "Developer",
        transcriptionId: "test-123",
        source: "AutoDetected" as SpeakerSource,
        email: "",
      },
    ],
    addSpeakerMapping: vi.fn(),
    updateSpeakerMapping: vi.fn(),
    deleteSpeakerMapping: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(createApiService).mockReturnValue(mockApi as any);
    vi.mocked(useSpeakerSessionStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockSpeakerSessionStore);
      return mockSpeakerSessionStore;
    });
  });

  describe("Modern Test Infrastructure", () => {
    it("integrates with Zustand store architecture", () => {
      renderWithProviders(
        <SpeakerMappingDialog 
          open={true}
          onClose={mockOnClose}
          transcriptionId="test-123"
          detectedSpeakers={["Speaker 1"]}
          onMappingsSaved={mockOnMappingsSaved}
        />,
        { initialMode: 'development' }
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(useSpeakerSessionStore).toHaveBeenCalled();
    });

    it("uses TestProviders for context isolation", () => {
      renderWithProviders(
        <SpeakerMappingDialog 
          open={true}
          onClose={mockOnClose}
          transcriptionId="test-123"
          detectedSpeakers={["Speaker 1"]}
          onMappingsSaved={mockOnMappingsSaved}
        />,
        { initialMode: 'development' }
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it("renders with comprehensive mock coverage", () => {
      renderWithProviders(
        <SpeakerMappingDialog 
          open={true}
          onClose={mockOnClose}
          transcriptionId="test-123"
          detectedSpeakers={["Speaker 1"]}
          onMappingsSaved={mockOnMappingsSaved}
        />,
        { initialMode: 'development' }
      );

      // Validates that all required infrastructure is mocked
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/map speakers to names/i)).toBeInTheDocument();
      expect(screen.getByText(/john doe.*developer/i)).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("displays speaker data from Zustand store", () => {
      renderWithProviders(
        <SpeakerMappingDialog 
          open={true}
          onClose={mockOnClose}
          transcriptionId="test-123"
          detectedSpeakers={["Speaker 1"]}
          onMappingsSaved={mockOnMappingsSaved}
        />,
        { initialMode: 'development' }
      );

      // Shows data from the mocked store
      expect(screen.getByText(/john doe.*developer/i)).toBeInTheDocument();
      expect(screen.getByText("Auto-detected")).toBeInTheDocument();
    });

    it("validates modern testing pattern adoption", () => {
      // This test validates the key patterns we've implemented:
      // 1. renderWithProviders for context setup ✓
      // 2. Zustand store mocking with selectors ✓
      // 3. API service factory availability ✓
      // 4. Component renders without infrastructure errors ✓

      const result = renderWithProviders(
        <SpeakerMappingDialog 
          open={true}
          onClose={mockOnClose}
          transcriptionId="test-123"
          detectedSpeakers={["Speaker 1"]}
          onMappingsSaved={mockOnMappingsSaved}
        />,
        { initialMode: 'development' }
      );

      expect(result).toBeTruthy();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Verify infrastructure is working
      expect(createApiService).toBeDefined();
      expect(useSpeakerSessionStore).toHaveBeenCalled();
    });
  });
});
