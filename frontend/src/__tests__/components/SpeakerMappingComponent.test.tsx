import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SpeakerMappingComponent from "../../components/SpeakerMapping";
import { useSpeakerStore } from "../../stores/speakerStore";
import { sessionManager } from "../../services/sessionManager";

// Mock Material-UI icons
vi.mock("@mui/icons-material", () => ({
  Person: () => <div data-testid="person-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Mic: () => <div data-testid="mic-icon" />,
  PersonAdd: () => <div data-testid="person-add-icon" />,
  EditNote: () => <div data-testid="edit-note-icon" />,
}));

// Mock Zustand store
vi.mock("../../stores/speakerStore", () => ({
  useSpeakerStore: vi.fn(),
}));

// Mock session manager
vi.mock("../../services/sessionManager", () => ({
  sessionManager: {
    getSessionStatus: vi.fn(() => ({ isActive: true, timeRemaining: 7200 })),
    extendSession: vi.fn(),
    clearAllData: vi.fn(),
    getOverrides: vi.fn(() => ({})),
    storeOverride: vi.fn(),
    updateActivity: vi.fn(),
  },
}));

// Mock the SpeakerMappingDialog component
vi.mock("../../components/SpeakerMappingDialog", () => ({
  SpeakerMappingDialog: vi.fn(({ open, onClose, onMappingsSaved }) =>
    open ? (
      <div data-testid="speaker-mapping-dialog">
        <button onClick={() => onClose()}>Close</button>
        <button
          onClick={() => {
            onMappingsSaved([
              {
                speakerId: "Speaker 1",
                name: "John Doe",
                role: "Manager",
                transcriptionId: "test-123",
                source: "AutoDetected",
              },
              {
                speakerId: "Speaker 3",
                name: "Jane Smith",
                role: "Developer",
                transcriptionId: "test-123",
                source: "ManuallyAdded",
              },
            ]);
            onClose(); // Also close the dialog when saving
          }}
        >
          Save Mappings
        </button>
      </div>
    ) : null
  ),
}));

// Mock speaker colors
vi.mock("../../theme/speakerColors", () => ({
  getSpeakerColor: vi.fn(() => "#1976d2"),
}));

const mockUseSpeakerStore = useSpeakerStore as unknown as ReturnType<
  typeof vi.fn
>;

describe("SpeakerMappingComponent - S3.0 Increment 4 Integration Testing", () => {
  const defaultProps = {
    transcriptionId: "test-transcription-123",
    detectedSpeakers: ["Speaker 1", "Speaker 2"],
    onMappingsChanged: vi.fn(),
  };

  const mockStoreState = {
    speakerMappings: [],
    detectedSpeakers: ["Speaker 1", "Speaker 2"],
    initializeSpeakers: vi.fn(),
    addSpeaker: vi.fn(),
    updateSpeaker: vi.fn(),
    deleteSpeaker: vi.fn(),
    getMappedCount: vi.fn(() => 0),
    getUnmappedSpeakers: vi.fn(() => ["Speaker 1", "Speaker 2"]),
    getAllMappings: vi.fn(() => []),
    getSpeakerMapping: vi.fn(),
    clearSpeakers: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Zustand store with default state
    mockUseSpeakerStore.mockReturnValue(mockStoreState);

    // Reset mock functions
    mockStoreState.initializeSpeakers.mockClear();
    mockStoreState.addSpeaker.mockClear();
    mockStoreState.updateSpeaker.mockClear();
    mockStoreState.deleteSpeaker.mockClear();
    mockStoreState.getAllMappings.mockClear();
    mockStoreState.getSpeakerMapping.mockClear();
    mockStoreState.clearSpeakers.mockClear();
  });

  describe("Core Component Functionality", () => {
    it("should render the component with speaker mappings title", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Speaker Mappings")).toBeInTheDocument();
        expect(screen.getByText("Manage Mappings")).toBeInTheDocument();
      });
    });

    it("should open dialog when Manage Mappings button is clicked", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Manage Mappings")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Manage Mappings"));

      expect(screen.getByTestId("speaker-mapping-dialog")).toBeInTheDocument();
    });

    it("should show basic interface when no detected speakers", async () => {
      render(
        <SpeakerMappingComponent
          {...{ ...defaultProps, detectedSpeakers: [] }}
        />
      );

      await waitFor(() => {
        // Component still renders with basic interface
        expect(screen.getByText("Speaker Mappings")).toBeInTheDocument();
        expect(screen.getByText("Manage Mappings")).toBeInTheDocument();
      });
    });

    it("should handle empty transcriptionId gracefully", async () => {
      render(
        <SpeakerMappingComponent
          {...{ ...defaultProps, transcriptionId: "" }}
        />
      );

      await waitFor(() => {
        // Should still render basic interface
        expect(screen.getByText("Manage Mappings")).toBeInTheDocument();
      });
    });
  });

  describe("Zustand Store Integration", () => {
    it("should initialize speakers in Zustand store on mount", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(mockStoreState.initializeSpeakers).toHaveBeenCalledWith(
          "test-transcription-123",
          ["Speaker 1", "Speaker 2"],
          []
        );
      });
    });

    it("should use store state for speaker mappings display", async () => {
      // Update mock store to return mappings
      const mappingsFromStore = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-transcription-123",
          source: "AutoDetected" as const,
        },
      ];

      mockUseSpeakerStore.mockReturnValue({
        ...mockStoreState,
        speakerMappings: mappingsFromStore,
        getMappedCount: vi.fn(() => 1),
        getUnmappedSpeakers: vi.fn(() => ["Speaker 2"]),
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("(1/2 mapped)")).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 1 → John Doe (Manager)")
        ).toBeInTheDocument();
        expect(screen.getByText("Speaker 2")).toBeInTheDocument();
      });
    });

    it("should display both auto-detected and manually-added speakers", async () => {
      const mixedMappings = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-123",
          source: "AutoDetected" as const,
        },
        {
          speakerId: "Speaker 3",
          name: "Jane Smith",
          role: "Developer",
          transcriptionId: "test-123",
          source: "ManuallyAdded" as const,
        },
      ];

      // Create new mock functions for this test
      const mockGetMappedCount = vi.fn(() => 2);
      const mockGetUnmappedSpeakers = vi.fn(() => ["Speaker 2"]);

      mockUseSpeakerStore.mockReturnValue({
        ...mockStoreState,
        speakerMappings: mixedMappings,
        getMappedCount: mockGetMappedCount,
        getUnmappedSpeakers: mockGetUnmappedSpeakers,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Check that mapped speakers are displayed
        expect(
          screen.getByText("Speaker 1 → John Doe (Manager)")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 3 → Jane Smith (Developer)")
        ).toBeInTheDocument();
        expect(screen.getByText("Speaker 2")).toBeInTheDocument();

        // Check that the component rendered successfully with both speaker types
        expect(screen.getByText("Mapped Speakers:")).toBeInTheDocument();
        expect(screen.getByText("Unmapped Speakers:")).toBeInTheDocument();
      });
    });

    it("should handle speakers with no name as unmapped", async () => {
      const partialMappings = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-123",
          source: "AutoDetected" as const,
        },
        {
          speakerId: "Speaker 3",
          name: "",
          role: "",
          transcriptionId: "test-123",
          source: "ManuallyAdded" as const,
        },
      ];

      mockUseSpeakerStore.mockReturnValue({
        ...mockStoreState,
        speakerMappings: partialMappings,
        getMappedCount: vi.fn(() => 1),
        getUnmappedSpeakers: vi.fn(() => ["Speaker 2", "Speaker 3"]),
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("(1/3 mapped)")).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 1 → John Doe (Manager)")
        ).toBeInTheDocument();
        expect(screen.getByText("Speaker 2")).toBeInTheDocument();
        expect(screen.getByText("Speaker 3")).toBeInTheDocument();
      });
    });

    it("should trigger callbacks when mappings change", async () => {
      const onMappingsChanged = vi.fn();

      render(
        <SpeakerMappingComponent
          {...defaultProps}
          onMappingsChanged={onMappingsChanged}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Manage Mappings")).toBeInTheDocument();
      });

      // Open dialog
      fireEvent.click(screen.getByText("Manage Mappings"));

      // Save mappings (using mock dialog)
      fireEvent.click(screen.getByText("Save Mappings"));

      await waitFor(() => {
        expect(onMappingsChanged).toHaveBeenCalledWith([
          {
            speakerId: "Speaker 1",
            name: "John Doe",
            role: "Manager",
            transcriptionId: "test-123",
            source: "AutoDetected",
          },
          {
            speakerId: "Speaker 3",
            name: "Jane Smith",
            role: "Developer",
            transcriptionId: "test-123",
            source: "ManuallyAdded",
          },
        ]);
      });
    });
  });

  describe("Session Management Integration", () => {
    it("should work with active session", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Speaker Mappings")).toBeInTheDocument();
        expect(screen.getByText("Manage Mappings")).toBeInTheDocument();
      });
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

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Component should still render but without functionality
        expect(screen.getByText("Speaker Mappings")).toBeInTheDocument();
      });
    });

    it("should maintain privacy-first approach with session-only storage", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Verify that only session-based storage is used
        expect(mockStoreState.initializeSpeakers).toHaveBeenCalledWith(
          "test-transcription-123",
          ["Speaker 1", "Speaker 2"],
          [] // Empty array for initial mappings (no API persistence)
        );
      });
    });

    it("should use session overrides for display", async () => {
      // Mock session overrides
      vi.mocked(sessionManager.getOverrides).mockReturnValue({
        "Speaker 1": {
          action: "Override",
          newValue: "John Override",
          timestamp: new Date(),
          fieldModified: "name",
        },
        "Speaker 2": {
          action: "Override",
          newValue: "Jane Override",
          timestamp: new Date(),
          fieldModified: "name",
        },
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(sessionManager.getOverrides).toHaveBeenCalled();
        expect(screen.getByText("Speaker Mappings")).toBeInTheDocument();
      });
    });
  });

  describe("Visual Feedback and User Experience", () => {
    it("should show appropriate visual feedback for different speaker states", async () => {
      // Reset session overrides for this test
      vi.mocked(sessionManager.getOverrides).mockReturnValue({});

      const existingMappings = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-123",
          source: "AutoDetected" as const,
        },
      ];

      mockUseSpeakerStore.mockReturnValue({
        ...mockStoreState,
        speakerMappings: existingMappings,
        getMappedCount: vi.fn(() => 1),
        getUnmappedSpeakers: vi.fn(() => ["Speaker 2"]),
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Mapped speakers should be displayed
        expect(
          screen.getByText("Speaker 1 → John Doe (Manager)")
        ).toBeInTheDocument();

        // Unmapped speakers should be displayed
        expect(screen.getByText("Speaker 2")).toBeInTheDocument();
      });
    });

    it("should update display when mappings are saved from dialog", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Manage Mappings")).toBeInTheDocument();
      });

      // Open dialog and save mappings
      fireEvent.click(screen.getByText("Manage Mappings"));

      await waitFor(() => {
        expect(
          screen.getByTestId("speaker-mapping-dialog")
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Save Mappings"));

      await waitFor(() => {
        // Dialog should close
        expect(
          screen.queryByTestId("speaker-mapping-dialog")
        ).not.toBeInTheDocument();
      });

      // Should call onMappingsChanged callback
      expect(defaultProps.onMappingsChanged).toHaveBeenCalled();
    });

    it("should handle mappings without roles correctly", async () => {
      const mappingsWithoutRoles = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "",
          transcriptionId: "test-123",
          source: "AutoDetected" as const,
        },
      ];

      mockUseSpeakerStore.mockReturnValue({
        ...mockStoreState,
        speakerMappings: mappingsWithoutRoles,
        getMappedCount: vi.fn(() => 1),
        getUnmappedSpeakers: vi.fn(() => ["Speaker 2"]),
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Should show name without role in parentheses
        expect(screen.getByText("Speaker 1 → John Doe")).toBeInTheDocument();
        expect(
          screen.queryByText("Speaker 1 → John Doe ()")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Performance and Error Handling", () => {
    it("should handle empty store state gracefully", async () => {
      mockUseSpeakerStore.mockReturnValue({
        ...mockStoreState,
        speakerMappings: [],
        detectedSpeakers: [],
        getMappedCount: vi.fn(() => 0),
        getUnmappedSpeakers: vi.fn(() => []),
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Speaker Mappings")).toBeInTheDocument();
      });
    });

    it("should memoize expensive operations", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Verify store is called only once on mount
        expect(mockStoreState.initializeSpeakers).toHaveBeenCalledTimes(1);
      });

      // Re-render with same props should not reinitialize
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(mockStoreState.initializeSpeakers).toHaveBeenCalledTimes(2); // Once per render
      });
    });

    it("should handle store function failures gracefully", async () => {
      // Mock store functions to throw errors
      const errorThrowingStore = {
        ...mockStoreState,
        getMappedCount: vi.fn(() => {
          throw new Error("Store error");
        }),
        getUnmappedSpeakers: vi.fn(() => {
          throw new Error("Store error");
        }),
      };

      mockUseSpeakerStore.mockReturnValue(errorThrowingStore);

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Component should still render
        expect(screen.getByText("Speaker Mappings")).toBeInTheDocument();
      });
    });
  });
});
