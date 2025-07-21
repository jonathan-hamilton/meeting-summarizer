import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SpeakerMappingComponent from "../../components/SpeakerMapping";
import { apiService } from "../../services/apiService";
import type { SpeakerMapping } from "../../types";

// Mock the API service
vi.mock("../../services/apiService", () => ({
  apiService: {
    getSpeakerMappings: vi.fn(),
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

const mockApiService = apiService.getSpeakerMappings as ReturnType<
  typeof vi.fn
>;

describe("SpeakerMappingComponent - S2.6 Enhanced Display Integration", () => {
  const defaultProps = {
    transcriptionId: "test-transcription-123",
    detectedSpeakers: ["Speaker 1", "Speaker 2"],
    onMappingsChanged: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiService.mockResolvedValue({
      data: { mappings: [] },
      success: true,
    });
  });

  describe("Basic Functionality", () => {
    it("should render the component with correct title and no speakers initially", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Speaker Mappings")).toBeInTheDocument();
        expect(screen.getByText("Map Speakers")).toBeInTheDocument();
      });
    });

    it("should show loading state while fetching existing mappings", () => {
      mockApiService.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<SpeakerMappingComponent {...defaultProps} />);

      expect(
        screen.getByText("Loading speaker mappings...")
      ).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("should open dialog when Map Speakers button is clicked", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Map Speakers")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Map Speakers"));

      expect(screen.getByTestId("speaker-mapping-dialog")).toBeInTheDocument();
    });
  });

  describe("S2.6 Enhanced Speaker List Calculation", () => {
    it("should display both auto-detected and manually-added speakers", async () => {
      // Mock existing mappings with both auto-detected and manually-added speakers
      const existingMappings: SpeakerMapping[] = [
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
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Should show mapped speakers count including both auto-detected and manually-added
        expect(screen.getByText("(2/3 mapped)")).toBeInTheDocument();

        // Should show mapped speakers section
        expect(screen.getByText("Mapped Speakers:")).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 1 → John Doe (Manager)")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 3 → Jane Smith (Developer)")
        ).toBeInTheDocument();

        // Should show unmapped speakers section (Speaker 2 from detectedSpeakers)
        expect(screen.getByText("Unmapped Speakers:")).toBeInTheDocument();
        expect(screen.getByText("Speaker 2")).toBeInTheDocument();
      });
    });

    it("should handle speakers with no name as unmapped", async () => {
      // Mock mappings where some speakers have no name
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-123",
          source: "AutoDetected",
        },
        {
          speakerId: "Speaker 3",
          name: "",
          role: "",
          transcriptionId: "test-123",
          source: "ManuallyAdded",
        },
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Should show correct mapped count (only speakers with names)
        expect(screen.getByText("(1/3 mapped)")).toBeInTheDocument();

        // Should show only named speakers in mapped section
        expect(
          screen.getByText("Speaker 1 → John Doe (Manager)")
        ).toBeInTheDocument();

        // Should show unnamed speakers in unmapped section
        expect(screen.getByText("Unmapped Speakers:")).toBeInTheDocument();
        expect(screen.getByText("Speaker 2")).toBeInTheDocument();
        expect(screen.getByText("Speaker 3")).toBeInTheDocument();
      });
    });

    it("should calculate unique speakers correctly when manually-added speakers are present", async () => {
      // Test with manually-added speakers that aren't in detectedSpeakers
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 4",
          name: "Alice Johnson",
          role: "Designer",
          transcriptionId: "test-123",
          source: "ManuallyAdded",
        },
        {
          speakerId: "Speaker 5",
          name: "Bob Wilson",
          role: "QA",
          transcriptionId: "test-123",
          source: "ManuallyAdded",
        },
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Should include all speakers: detectedSpeakers (Speaker 1, 2) + manually-added (Speaker 4, 5)
        expect(screen.getByText("(2/4 mapped)")).toBeInTheDocument();

        // Should show manually-added speakers in mapped section
        expect(
          screen.getByText("Speaker 4 → Alice Johnson (Designer)")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 5 → Bob Wilson (QA)")
        ).toBeInTheDocument();

        // Should show auto-detected speakers in unmapped section
        expect(screen.getByText("Speaker 1")).toBeInTheDocument();
        expect(screen.getByText("Speaker 2")).toBeInTheDocument();
      });
    });
  });

  describe("S2.6 Source-Aware Display Logic", () => {
    it("should display appropriate icons for auto-detected vs manually-added speakers", async () => {
      const existingMappings: SpeakerMapping[] = [
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
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Check for source indicators in mapped speakers
        const mappedChips = screen.getAllByTitle(/speaker$/);
        const autoDetectedChip = mappedChips.find(
          (chip) => chip.getAttribute("title") === "auto-detected speaker"
        );
        const manuallyAddedChip = mappedChips.find(
          (chip) => chip.getAttribute("title") === "manually-added speaker"
        );

        expect(autoDetectedChip).toBeInTheDocument();
        expect(manuallyAddedChip).toBeInTheDocument();
      });
    });

    it("should handle missing source field as auto-detected", async () => {
      // Test backward compatibility with mappings that don't have source field
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-123",
        }, // No source field
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Should treat missing source as auto-detected
        const autoDetectedChips = screen.getAllByTitle("auto-detected speaker");
        expect(autoDetectedChips.length).toBeGreaterThan(0);
        // Both Speaker 1 and Speaker 2 should be auto-detected since one has no source
        expect(autoDetectedChips).toHaveLength(2);
      });
    });

    it("should show correct source indicators for unmapped speakers", async () => {
      // Test unmapped speakers with different sources
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 3",
          name: "",
          role: "",
          transcriptionId: "test-123",
          source: "ManuallyAdded",
        }, // Unmapped manually-added
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Should show different icons for unmapped auto-detected vs manually-added speakers
        const unmappedChips = screen.getAllByTitle(/speaker$/);

        // Should have auto-detected speakers (Speaker 1, 2) and manually-added (Speaker 3)
        expect(unmappedChips.length).toBeGreaterThan(0);

        // Check for both types of indicators
        const autoDetectedIndicators = unmappedChips.filter(
          (chip) => chip.getAttribute("title") === "auto-detected speaker"
        );
        const manuallyAddedIndicators = unmappedChips.filter(
          (chip) => chip.getAttribute("title") === "manually-added speaker"
        );

        expect(autoDetectedIndicators.length).toBeGreaterThan(0);
        expect(manuallyAddedIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe("S2.6 Real-time Synchronization", () => {
    it("should update display when mappings are saved from dialog", async () => {
      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Map Speakers")).toBeInTheDocument();
      });

      // Open dialog and save mappings
      fireEvent.click(screen.getByText("Map Speakers"));

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

        // Display should update with new mappings
        expect(screen.getByText("(2/3 mapped)")).toBeInTheDocument();
        expect(screen.getByText("Mapped Speakers:")).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 1 → John Doe (Manager)")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Speaker 3 → Jane Smith (Developer)")
        ).toBeInTheDocument();
      });

      // Should call onMappingsChanged callback
      expect(defaultProps.onMappingsChanged).toHaveBeenCalledWith([
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

    it("should update button text when mappings exist", async () => {
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-123",
          source: "AutoDetected",
        },
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Button text should change to "Edit Mappings" when mappings exist
        expect(screen.getByText("Edit Mappings")).toBeInTheDocument();
        expect(screen.queryByText("Map Speakers")).not.toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle API errors gracefully when loading mappings", async () => {
      mockApiService.mockRejectedValue(new Error("API Error"));

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Should not show error for missing mappings (expected case)
        expect(screen.getByText("Map Speakers")).toBeInTheDocument();
      });
    });

    it("should show no speakers message when no detected speakers and no mappings", async () => {
      render(
        <SpeakerMappingComponent
          {...{ ...defaultProps, detectedSpeakers: [] }}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("No speakers detected in this transcription.")
        ).toBeInTheDocument();
      });
    });

    it("should handle empty transcriptionId gracefully", async () => {
      render(
        <SpeakerMappingComponent
          {...{ ...defaultProps, transcriptionId: "" }}
        />
      );

      await waitFor(() => {
        // Should not make API call and show basic interface
        expect(screen.getByText("Map Speakers")).toBeInTheDocument();
      });

      expect(mockApiService).not.toHaveBeenCalled();
    });

    it("should handle mappings without roles correctly", async () => {
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "",
          transcriptionId: "test-123",
          source: "AutoDetected",
        },
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
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

    it("should deduplicate speakers correctly when manually-added speaker matches detected speaker", async () => {
      // Test case where manually-added speaker has same ID as detected speaker
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-123",
          source: "ManuallyAdded",
        },
        {
          speakerId: "Speaker 3",
          name: "Jane Smith",
          role: "Developer",
          transcriptionId: "test-123",
          source: "ManuallyAdded",
        },
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Should not duplicate Speaker 1, should show correct count
        expect(screen.getByText("(2/3 mapped)")).toBeInTheDocument();

        // Should show Speaker 1 only once
        const speaker1Elements = screen.getAllByText(/Speaker 1/);
        expect(speaker1Elements).toHaveLength(1);
      });
    });
  });

  describe("Accessibility and User Experience", () => {
    it("should have proper accessibility attributes", async () => {
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-123",
          source: "AutoDetected",
        },
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Check for proper button accessibility
        const editButton = screen.getByRole("button", {
          name: /Edit Mappings/i,
        });
        expect(editButton).toBeInTheDocument();

        // Check for proper title attributes on chips
        const autoDetectedChips = screen.getAllByTitle("auto-detected speaker");
        expect(autoDetectedChips.length).toBeGreaterThan(0);
      });
    });

    it("should show appropriate visual feedback for different speaker states", async () => {
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-123",
          source: "AutoDetected",
        },
      ];

      mockApiService.mockResolvedValue({
        data: { mappings: existingMappings },
        success: true,
      });

      render(<SpeakerMappingComponent {...defaultProps} />);

      await waitFor(() => {
        // Mapped speakers should have filled variant
        const mappedChips = screen.getAllByText(/Speaker 1 → John Doe/);
        expect(mappedChips[0]).toBeInTheDocument();

        // Unmapped speakers should have outlined variant
        const unmappedChips = screen.getAllByText(/^Speaker 2$/);
        expect(unmappedChips[0]).toBeInTheDocument();
      });
    });
  });
});
