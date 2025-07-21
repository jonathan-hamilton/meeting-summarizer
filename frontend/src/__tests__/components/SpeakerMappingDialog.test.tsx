import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpeakerMappingDialog } from "../../components/SpeakerMappingDialog";
import { apiService } from "../../services/apiService";
import type { SpeakerMapping } from "../../types";
import { SpeakerSource } from "../../types";

// Mock the API service
vi.mock("../../services/apiService", () => ({
  apiService: {
    saveSpeakerMappings: vi.fn(),
  },
}));

const mockApiService = apiService.saveSpeakerMappings as ReturnType<
  typeof vi.fn
>;

// Mock Material-UI icons
vi.mock("@mui/icons-material", () => ({
  Close: () => <div data-testid="close-icon" />,
  Person: () => <div data-testid="person-icon" />,
  Save: () => <div data-testid="save-icon" />,
  Add: () => <div data-testid="add-icon" />,
  Delete: () => <div data-testid="delete-icon" />,
  Mic: () => <div data-testid="mic-icon" />,
  PersonAdd: () => <div data-testid="person-add-icon" />,
}));

describe("SpeakerMappingDialog - S2.5 Enhanced Functionality", () => {
  const mockProps = {
    open: true,
    onClose: vi.fn(),
    transcriptionId: "test-transcription-123",
    detectedSpeakers: ["Speaker 1", "Speaker 2"],
    existingMappings: [] as SpeakerMapping[],
    onMappingsSaved: vi.fn(),
  };

  const mockApiResponse = {
    data: {
      transcriptionId: "test-transcription-123",
      mappings: [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-transcription-123",
          source: SpeakerSource.AutoDetected,
        },
      ],
      lastUpdated: new Date().toISOString(),
      mappedSpeakerCount: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiService.mockResolvedValue(mockApiResponse);
  });

  describe("Basic Functionality (S2.2 Compatibility)", () => {
    it("renders dialog with detected speakers", () => {
      render(<SpeakerMappingDialog {...mockProps} />);

      expect(screen.getByText("Map Speakers to Names")).toBeInTheDocument();
      expect(screen.getByText("Auto-detected Speakers:")).toBeInTheDocument();

      // Use getAllByText since speakers appear in multiple places (chips and headers)
      const speaker1Elements = screen.getAllByText("Speaker 1");
      expect(speaker1Elements.length).toBeGreaterThan(0);

      const speaker2Elements = screen.getAllByText("Speaker 2");
      expect(speaker2Elements.length).toBeGreaterThan(0);
    });

    it("initializes with existing mappings", () => {
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-transcription-123",
          source: SpeakerSource.AutoDetected,
        },
      ];

      render(
        <SpeakerMappingDialog
          {...mockProps}
          existingMappings={existingMappings}
        />
      );

      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Manager")).toBeInTheDocument();
    });

    it("handles name and role input changes", async () => {
      const user = userEvent.setup();
      render(<SpeakerMappingDialog {...mockProps} />);

      const nameInput = screen.getAllByLabelText("Full Name")[0];
      const roleInput = screen.getAllByLabelText("Role (Optional)")[0];

      await user.type(nameInput, "Jane Smith");
      await user.type(roleInput, "Developer");

      expect(nameInput).toHaveValue("Jane Smith");
      expect(roleInput).toHaveValue("Developer");
    });
  });

  describe("S2.5 Enhanced Speaker Management", () => {
    it("displays speaker source indicators correctly", () => {
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-transcription-123",
          source: SpeakerSource.AutoDetected,
        },
        {
          speakerId: "Speaker 3",
          name: "Alice Johnson",
          role: "Designer",
          transcriptionId: "test-transcription-123",
          source: SpeakerSource.ManuallyAdded,
        },
      ];

      render(
        <SpeakerMappingDialog
          {...mockProps}
          existingMappings={existingMappings}
        />
      );

      // Use getAllByText for elements that appear multiple times
      const autoDetectedElements = screen.getAllByText("Auto-detected");
      expect(autoDetectedElements.length).toBeGreaterThan(0);

      const manuallyAddedElements = screen.getAllByText("Manually Added");
      expect(manuallyAddedElements.length).toBeGreaterThan(0);
    });

    it("allows adding new speakers", async () => {
      const user = userEvent.setup();
      render(<SpeakerMappingDialog {...mockProps} />);

      const addButton = screen.getByText("Add Speaker");
      await user.click(addButton);

      // Should now have 3 speakers (original 2 + 1 added)
      // Use getAllByText to handle multiple occurrences
      const speaker3Elements = screen.getAllByText("Speaker 3");
      expect(speaker3Elements.length).toBeGreaterThan(0);

      const manuallyAddedElements = screen.getAllByText("Manually Added");
      expect(manuallyAddedElements.length).toBeGreaterThan(0);
    });

    it("allows removing speakers when more than one exists", async () => {
      const user = userEvent.setup();
      render(<SpeakerMappingDialog {...mockProps} />);

      // Get delete buttons (should have 2, one for each speaker)
      const deleteButtons = screen.getAllByTestId("delete-icon");
      expect(deleteButtons).toHaveLength(2);

      // Click first delete button
      await user.click(deleteButtons[0].closest("button")!);

      // Confirmation dialog should appear
      expect(screen.getByText("Confirm Speaker Removal")).toBeInTheDocument();

      // Look for partial text match since the text might be split across elements
      expect(
        screen.getByText(/Are you sure you want to remove/)
      ).toBeInTheDocument();
    });

    it("prevents removing the last remaining speaker", () => {
      const singleSpeakerProps = {
        ...mockProps,
        detectedSpeakers: ["Speaker 1"],
      };

      render(<SpeakerMappingDialog {...singleSpeakerProps} />);

      const deleteButton = screen.getByTestId("delete-icon").closest("button")!;
      expect(deleteButton).toBeDisabled();
    });

    it("completes speaker removal when confirmed", async () => {
      const user = userEvent.setup();
      render(<SpeakerMappingDialog {...mockProps} />);

      // Click delete button for first speaker
      const deleteButtons = screen.getAllByTestId("delete-icon");
      await user.click(deleteButtons[0].closest("button")!);

      // Confirm removal
      const confirmButton = screen.getByText("Remove Speaker");
      await user.click(confirmButton);

      // Wait for removal to complete and check remaining speakers
      await waitFor(() => {
        const remainingSpeakers = screen.getAllByText(/Speaker \d+/);
        // Should have fewer speakers now, but accounting for chips and headers
        expect(remainingSpeakers.length).toBeLessThan(4); // Originally 4 (2 speakers × 2 locations each)
      });
    });

    it("cancels speaker removal when cancelled", async () => {
      const user = userEvent.setup();
      render(<SpeakerMappingDialog {...mockProps} />);

      // Click delete button
      const deleteButtons = screen.getAllByTestId("delete-icon");
      await user.click(deleteButtons[0].closest("button")!);

      // Cancel removal - use getAllByText and get the first Cancel button (from confirmation dialog)
      const cancelButtons = screen.getAllByText("Cancel");
      await user.click(cancelButtons[0]);

      // Should still have 2 speakers (accounting for multiple locations)
      const speakers = screen.getAllByText(/Speaker \d+/);
      expect(speakers.length).toBeGreaterThanOrEqual(4); // 2 speakers × 2 locations minimum
    });

    it("shows error when trying to remove last speaker programmatically", async () => {
      const user = userEvent.setup();
      render(<SpeakerMappingDialog {...mockProps} />);

      // Add a speaker first, then remove the original ones to get to 1
      const addButton = screen.getByText("Add Speaker");
      await user.click(addButton);

      // Now we have 3 speakers, remove 2 to test the last one protection
      const deleteButtons = screen.getAllByTestId("delete-icon");

      // Remove first speaker
      await user.click(deleteButtons[0].closest("button")!);
      await user.click(screen.getByText("Remove Speaker"));

      // Remove second speaker
      const remainingDeleteButtons = screen.getAllByTestId("delete-icon");
      await user.click(remainingDeleteButtons[0].closest("button")!);
      await user.click(screen.getByText("Remove Speaker"));

      // Try to remove the last speaker (button should be disabled)
      const lastDeleteButton = screen
        .getByTestId("delete-icon")
        .closest("button")!;
      expect(lastDeleteButton).toBeDisabled();
    });

    it("maintains correct speaker numbering when adding speakers", async () => {
      const user = userEvent.setup();
      render(<SpeakerMappingDialog {...mockProps} />);

      // Add two speakers
      const addButton = screen.getByText("Add Speaker");
      await user.click(addButton);
      await user.click(addButton);

      // Should have Speaker 1, 2, 3, 4 - check using getAllByText
      const speaker1Elements = screen.getAllByText("Speaker 1");
      expect(speaker1Elements.length).toBeGreaterThan(0);

      const speaker2Elements = screen.getAllByText("Speaker 2");
      expect(speaker2Elements.length).toBeGreaterThan(0);

      const speaker3Elements = screen.getAllByText("Speaker 3");
      expect(speaker3Elements.length).toBeGreaterThan(0);

      const speaker4Elements = screen.getAllByText("Speaker 4");
      expect(speaker4Elements.length).toBeGreaterThan(0);
    });
  });

  describe("Save Functionality with S2.5 Enhancements", () => {
    it("saves mappings with source information", async () => {
      const user = userEvent.setup();
      render(<SpeakerMappingDialog {...mockProps} />);

      // Add a manual speaker
      await user.click(screen.getByText("Add Speaker"));

      // Fill in names for both speakers
      const nameInputs = screen.getAllByLabelText("Full Name");
      await user.type(nameInputs[0], "John Doe");
      await user.type(nameInputs[2], "Jane Smith"); // Third input is the manually added speaker

      // Save mappings
      await user.click(screen.getByText("Save Mappings"));

      await waitFor(() => {
        expect(apiService.saveSpeakerMappings).toHaveBeenCalledWith({
          transcriptionId: "test-transcription-123",
          mappings: expect.arrayContaining([
            expect.objectContaining({
              speakerId: "Speaker 1",
              name: "John Doe",
              source: SpeakerSource.AutoDetected,
            }),
            expect.objectContaining({
              speakerId: "Speaker 3",
              name: "Jane Smith",
              source: SpeakerSource.ManuallyAdded,
            }),
          ]),
        });
      });
    });

    it("handles mixed auto-detected and manually-added speakers in existing mappings", () => {
      const existingMappings: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-transcription-123",
          source: SpeakerSource.AutoDetected,
        },
        {
          speakerId: "Speaker 3",
          name: "Alice Johnson",
          role: "Designer",
          transcriptionId: "test-transcription-123",
          source: SpeakerSource.ManuallyAdded,
        },
      ];

      render(
        <SpeakerMappingDialog
          {...mockProps}
          existingMappings={existingMappings}
        />
      );

      // Should display all speakers including the manually-added one not in detectedSpeakers
      const speaker1Elements = screen.getAllByText("Speaker 1");
      expect(speaker1Elements.length).toBeGreaterThan(0);

      const speaker2Elements = screen.getAllByText("Speaker 2");
      expect(speaker2Elements.length).toBeGreaterThan(0);

      const speaker3Elements = screen.getAllByText("Speaker 3");
      expect(speaker3Elements.length).toBeGreaterThan(0);

      // Should have correct source indicators
      const autoDetectedElements = screen.getAllByText("Auto-detected");
      expect(autoDetectedElements.length).toBe(2); // Speaker 1 and 2

      const manuallyAddedElements = screen.getAllByText("Manually Added");
      expect(manuallyAddedElements.length).toBe(1); // Speaker 3
    });
  });

  describe("User Experience Enhancements", () => {
    it("disables interactions during loading", async () => {
      const user = userEvent.setup();

      // Create a manually controlled promise to simulate loading
      let resolvePromise: (value: typeof mockApiResponse) => void;
      const manualPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiService.mockReturnValue(manualPromise);

      render(<SpeakerMappingDialog {...mockProps} />);

      // Fill in a name and trigger save
      const nameInput = screen.getAllByLabelText("Full Name")[0];
      await user.type(nameInput, "John Doe");

      const saveButton = screen.getByText("Save Mappings");

      // Click save to start the loading process
      await user.click(saveButton);

      // Check that the add speaker button is disabled during loading
      await waitFor(() => {
        expect(screen.getByText("Add Speaker")).toBeDisabled();
      });

      // Check that the save button shows loading text
      expect(screen.getByText("Saving...")).toBeInTheDocument();

      // Resolve the promise to complete the save
      resolvePromise!(mockApiResponse);

      // Wait for completion and success message
      await waitFor(() => {
        expect(
          screen.getByText("Speaker mappings saved successfully!")
        ).toBeInTheDocument();
      });

      // Buttons should be re-enabled after completion
      await waitFor(() => {
        expect(screen.getByText("Add Speaker")).not.toBeDisabled();
      });
    });

    it("shows appropriate empty state message", () => {
      const emptyProps = {
        ...mockProps,
        detectedSpeakers: [],
      };

      render(<SpeakerMappingDialog {...emptyProps} />);

      expect(
        screen.getByText(
          'No speakers available. Click "Add Speaker" to add one.'
        )
      ).toBeInTheDocument();
    });

    it("updates dialog description to mention add/remove capability", () => {
      render(<SpeakerMappingDialog {...mockProps} />);

      expect(
        screen.getByText(/You can add or remove speakers as needed/)
      ).toBeInTheDocument();
    });
  });
});
