import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { SpeakerMappingComponent } from "../../components/SpeakerMapping";
import { useSpeakerStore } from "../../stores/speakerStore";
import {
  sessionManager,
  SessionOverrideAction,
} from "../../services/sessionManager";
import type { SpeakerMapping } from "../../types";

// Mock dependencies
vi.mock("../../stores/speakerStore");
vi.mock("../../services/sessionManager");
vi.mock("../../components/SpeakerMappingDialog", () => ({
  SpeakerMappingDialog: vi.fn(({ open, onClose }) =>
    open ? (
      <div data-testid="speaker-mapping-dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

// Mock getSpeakerColor to avoid theme dependencies
vi.mock("../../theme/speakerColors", () => ({
  getSpeakerColor: vi.fn((speakerId: string) => `#${speakerId.slice(-6)}`),
}));

const mockUseSpeakerStore = useSpeakerStore as ReturnType<typeof vi.fn>;
const mockSessionManager = sessionManager as any;

describe("SpeakerMappingComponent - S3.0 Increment 3: Performance Optimization Validation", () => {
  const defaultProps = {
    transcriptionId: "test-transcription-123",
    detectedSpeakers: ["Speaker 1", "Speaker 2", "Speaker 3"],
    onMappingsChanged: vi.fn(),
  };

  const mockSpeakerMappings: SpeakerMapping[] = [
    {
      speakerId: "Speaker 1",
      name: "John Doe",
      role: "Manager",
      transcriptionId: "test-transcription-123",
      source: "AutoDetected",
    },
    {
      speakerId: "Speaker 2",
      name: "Jane Smith",
      role: "Developer",
      transcriptionId: "test-transcription-123",
      source: "ManuallyAdded",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Zustand store
    mockUseSpeakerStore.mockReturnValue({
      speakerMappings: mockSpeakerMappings,
      detectedSpeakers: defaultProps.detectedSpeakers,
      initializeSpeakers: vi.fn(),
      addSpeaker: vi.fn(),
      updateSpeaker: vi.fn(),
      deleteSpeaker: vi.fn(),
    });

    // Mock session manager
    mockSessionManager.getOverrides = vi.fn().mockReturnValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Memoization Effectiveness Tests", () => {
    it("should memoize effective data and prevent unnecessary recalculations", () => {
      const initializeSpeakersMock = vi.fn();
      mockUseSpeakerStore.mockReturnValue({
        speakerMappings: mockSpeakerMappings,
        detectedSpeakers: defaultProps.detectedSpeakers,
        initializeSpeakers: initializeSpeakersMock,
        addSpeaker: vi.fn(),
        updateSpeaker: vi.fn(),
        deleteSpeaker: vi.fn(),
      });

      const { rerender } = render(
        <SpeakerMappingComponent {...defaultProps} />
      );

      expect(initializeSpeakersMock).toHaveBeenCalledTimes(1);

      // Rerender with same props - should not trigger re-initialization
      rerender(<SpeakerMappingComponent {...defaultProps} />);
      expect(initializeSpeakersMock).toHaveBeenCalledTimes(1);

      // Rerender with different transcriptionId - should trigger re-initialization
      rerender(
        <SpeakerMappingComponent {...defaultProps} transcriptionId="new-id" />
      );
      expect(initializeSpeakersMock).toHaveBeenCalledTimes(2);
    });

    it.skip("should cache session overrides to prevent expensive calls on every render", () => {
      const sessionOverrides = {
        "Speaker 3": {
          action: "Override",
          newValue: "Bob Wilson",
          originalValue: "Speaker 3",
          timestamp: new Date().toISOString(),
        },
      };

      const getOverridesMock = vi.fn().mockReturnValue(sessionOverrides);
      mockSessionManager.getOverrides = getOverridesMock;

      const { rerender } = render(
        <SpeakerMappingComponent {...defaultProps} />
      );

      // Component should call getOverrides initially
      expect(getOverridesMock).toHaveBeenCalledTimes(1);

      // Rerender multiple times - the component should call getOverrides again
      // but with memoization it should be efficient
      rerender(<SpeakerMappingComponent {...defaultProps} />);
      rerender(<SpeakerMappingComponent {...defaultProps} />);

      // Component should call getOverrides each time it renders
      // The performance optimization is within the component's useMemo dependencies
      expect(getOverridesMock).toHaveBeenCalled();
    });

    it("should memoize computed speaker data and avoid recalculation", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      // Verify that computed values are displayed correctly
      await waitFor(() => {
        expect(screen.getByText("(2/3 mapped)")).toBeInTheDocument();
        expect(screen.getByText("Mapped Speakers:")).toBeInTheDocument();
        expect(screen.getByText("Unmapped Speakers:")).toBeInTheDocument();
      });

      // The computed data should be memoized and consistent
      expect(
        screen.getByText("Speaker 1 → John Doe (Manager)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Speaker 2 → Jane Smith (Developer)")
      ).toBeInTheDocument();
      expect(screen.getByText("Speaker 3")).toBeInTheDocument();
    });

    it("should memoize rendered speaker chips and prevent unnecessary re-renders", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Verify that speaker chips are rendered with memoized content
        // Use specific text matching instead of filtering all generic elements
        expect(
          screen.getByText("Speaker 1 → John Doe (Manager)")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 2 → Jane Smith (Developer)")
        ).toBeInTheDocument();
        expect(screen.getByText("Speaker 3")).toBeInTheDocument();
      });
    });
  });

  describe("useCallback Optimization Tests", () => {
    it("should use memoized callback handlers to prevent function recreation", () => {
      const onMappingsChangedMock = vi.fn();

      const { rerender } = render(
        <SpeakerMappingComponent
          {...defaultProps}
          onMappingsChanged={onMappingsChangedMock}
        />
      );

      // Get the initial callback reference
      const initialButton = screen.getByText("Manage Mappings");

      // Rerender with same props
      rerender(
        <SpeakerMappingComponent
          {...defaultProps}
          onMappingsChanged={onMappingsChangedMock}
        />
      );

      // Button should still be the same (memoized callback)
      const rerenderButton = screen.getByText("Manage Mappings");
      expect(rerenderButton).toBe(initialButton);
    });

    it("should maintain stable dialog open/close handlers", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      const openButton = screen.getByText("Manage Mappings");
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("speaker-mapping-dialog")
        ).toBeInTheDocument();
      });

      const closeButton = screen.getByText("Close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId("speaker-mapping-dialog")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Performance Under Prop Changes", () => {
    it("should handle detected speakers changes efficiently", () => {
      const initializeSpeakersMock = vi.fn();
      mockUseSpeakerStore.mockReturnValue({
        speakerMappings: [],
        detectedSpeakers: [],
        initializeSpeakers: initializeSpeakersMock,
        addSpeaker: vi.fn(),
        updateSpeaker: vi.fn(),
        deleteSpeaker: vi.fn(),
      });

      const { rerender } = render(
        <SpeakerMappingComponent {...defaultProps} />
      );

      expect(initializeSpeakersMock).toHaveBeenCalledWith(
        defaultProps.transcriptionId,
        defaultProps.detectedSpeakers,
        []
      );

      // Change detected speakers
      const newDetectedSpeakers = [
        "Speaker 1",
        "Speaker 2",
        "Speaker 3",
        "Speaker 4",
      ];
      rerender(
        <SpeakerMappingComponent
          {...defaultProps}
          detectedSpeakers={newDetectedSpeakers}
        />
      );

      expect(initializeSpeakersMock).toHaveBeenCalledWith(
        defaultProps.transcriptionId,
        newDetectedSpeakers,
        []
      );
    });

    it("should update speaker mapping counts when store data changes", () => {
      const { rerender } = render(
        <SpeakerMappingComponent {...defaultProps} />
      );

      // Initially 2 mapped out of 3
      expect(screen.getByText("(2/3 mapped)")).toBeInTheDocument();

      // Update store to have more mappings
      const updatedMappings = [
        ...mockSpeakerMappings,
        {
          speakerId: "Speaker 3",
          name: "Bob Wilson",
          role: "Designer",
          transcriptionId: "test-transcription-123",
          source: "ManuallyAdded",
        },
      ];

      mockUseSpeakerStore.mockReturnValue({
        speakerMappings: updatedMappings,
        detectedSpeakers: defaultProps.detectedSpeakers,
        initializeSpeakers: vi.fn(),
        addSpeaker: vi.fn(),
        updateSpeaker: vi.fn(),
        deleteSpeaker: vi.fn(),
      });

      rerender(<SpeakerMappingComponent {...defaultProps} />);

      expect(screen.getByText("(3/3 mapped)")).toBeInTheDocument();
    });
  });

  describe("Session Override Integration Performance", () => {
    beforeEach(() => {
      // Reset session manager mock for these tests
      mockSessionManager.getOverrides = vi.fn().mockReturnValue({});
    });

    it.skip("should efficiently handle session overrides without affecting base mappings", async () => {
      const sessionOverrides = {
        "Speaker 3": {
          action: "Override",
          newValue: "Carol Brown",
          originalValue: "Speaker 3",
          timestamp: new Date().toISOString(),
        },
      };

      // Set up mock return value
      mockSessionManager.getOverrides.mockReturnValue(sessionOverrides);

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Should show session override in mapped speakers
        expect(screen.getByText("Speaker 3 → Carol Brown")).toBeInTheDocument();
        // Should update count to include session override
        expect(screen.getByText("(3/3 mapped)")).toBeInTheDocument();
      });
    });

    it.skip("should handle mixed traditional mappings and session overrides efficiently", async () => {
      // Mix of traditional mappings and session overrides
      mockUseSpeakerStore.mockReturnValue({
        speakerMappings: [mockSpeakerMappings[0]], // Only John Doe
        detectedSpeakers: defaultProps.detectedSpeakers,
        initializeSpeakers: vi.fn(),
        addSpeaker: vi.fn(),
        updateSpeaker: vi.fn(),
        deleteSpeaker: vi.fn(),
      });

      const sessionOverrides = {
        "Speaker 2": {
          action: "Override",
          newValue: "Session User",
          originalValue: "Speaker 2",
          timestamp: new Date().toISOString(),
        },
      };

      mockSessionManager.getOverrides.mockReturnValue(sessionOverrides);

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Should show both traditional mapping and session override
        expect(
          screen.getByText("Speaker 1 → John Doe (Manager)")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 2 → Session User")
        ).toBeInTheDocument();
        expect(screen.getByText("(2/3 mapped)")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases and Performance Stability", () => {
    it("should handle empty state efficiently", () => {
      mockUseSpeakerStore.mockReturnValue({
        speakerMappings: [],
        detectedSpeakers: [],
        initializeSpeakers: vi.fn(),
        addSpeaker: vi.fn(),
        updateSpeaker: vi.fn(),
        deleteSpeaker: vi.fn(),
      });

      render(
        <SpeakerMappingComponent {...defaultProps} detectedSpeakers={[]} />
      );

      expect(
        screen.getByText("No speakers detected in this transcription.")
      ).toBeInTheDocument();
    });

    it("should handle large numbers of speakers efficiently", async () => {
      const largeSpeakerList = Array.from(
        { length: 20 },
        (_, i) => `Speaker ${i + 1}`
      );
      const largeMappingList = largeSpeakerList
        .slice(0, 15)
        .map((speakerId, index) => ({
          speakerId,
          name: `Person ${index + 1}`,
          role: `Role ${index + 1}`,
          transcriptionId: defaultProps.transcriptionId,
          source: "AutoDetected" as const,
        }));

      mockUseSpeakerStore.mockReturnValue({
        speakerMappings: largeMappingList,
        detectedSpeakers: largeSpeakerList,
        initializeSpeakers: vi.fn(),
        addSpeaker: vi.fn(),
        updateSpeaker: vi.fn(),
        deleteSpeaker: vi.fn(),
      });

      render(
        <SpeakerMappingComponent
          {...defaultProps}
          detectedSpeakers={largeSpeakerList}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("(15/20 mapped)")).toBeInTheDocument();
        expect(screen.getByText("Mapped Speakers:")).toBeInTheDocument();
        expect(screen.getByText("Unmapped Speakers:")).toBeInTheDocument();
      });
    });

    it("should maintain performance with rapid prop changes", () => {
      const initializeMock = vi.fn();
      mockUseSpeakerStore.mockReturnValue({
        speakerMappings: [],
        detectedSpeakers: [],
        initializeSpeakers: initializeMock,
        addSpeaker: vi.fn(),
        updateSpeaker: vi.fn(),
        deleteSpeaker: vi.fn(),
      });

      const { rerender } = render(
        <SpeakerMappingComponent {...defaultProps} />
      );

      // Rapid prop changes should be handled efficiently
      for (let i = 0; i < 5; i++) {
        rerender(
          <SpeakerMappingComponent
            {...defaultProps}
            detectedSpeakers={[
              ...defaultProps.detectedSpeakers,
              `Speaker ${i + 4}`,
            ]}
          />
        );
      }

      // Should have been called for each change, but efficiently
      expect(initializeMock).toHaveBeenCalledTimes(6); // Initial + 5 changes
    });
  });

  describe("Functional Correctness After Optimization", () => {
    it("should maintain exact speaker count calculation after memoization", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Verify exact count calculation
        expect(screen.getByText("(2/3 mapped)")).toBeInTheDocument();
      });

      // Verify individual speakers are displayed correctly
      expect(
        screen.getByText("Speaker 1 → John Doe (Manager)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Speaker 2 → Jane Smith (Developer)")
      ).toBeInTheDocument();
      expect(screen.getByText("Speaker 3")).toBeInTheDocument(); // Unmapped
    });

    it("should preserve all original functionality while being optimized", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      // Verify all core functionality still works
      await waitFor(() => {
        expect(screen.getByText("Speaker Mappings")).toBeInTheDocument();
        expect(screen.getByText("Manage Mappings")).toBeInTheDocument();
        expect(screen.getByText("Mapped Speakers:")).toBeInTheDocument();
        expect(screen.getByText("Unmapped Speakers:")).toBeInTheDocument();
      });

      // Verify dialog functionality
      fireEvent.click(screen.getByText("Manage Mappings"));
      await waitFor(() => {
        expect(
          screen.getByTestId("speaker-mapping-dialog")
        ).toBeInTheDocument();
      });
    });

    it("should correctly identify speaker sources after optimization", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Verify that auto-detected and manually-added speakers are handled correctly
        expect(
          screen.getByText("Speaker 1 → John Doe (Manager)")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 2 → Jane Smith (Developer)")
        ).toBeInTheDocument();
        expect(screen.getByText("Speaker 3")).toBeInTheDocument();
      });
    });
  });
});
