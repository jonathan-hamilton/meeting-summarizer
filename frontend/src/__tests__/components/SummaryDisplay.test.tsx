import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import "@testing-library/jest-dom";
import SummaryDisplay from "../../components/SummaryDisplay";
import { apiService } from "../../services/apiService";
import type { SummaryResult, SpeakerMapping, ApiResponse } from "../../types";
import { SummaryStyle } from "../../types";

// Mock the apiService
vi.mock("../../services/apiService", () => ({
  apiService: {
    generateTranscriptionSummary: vi.fn(),
  },
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock URL and Blob for file downloads
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

const mockSpeakerMappings: SpeakerMapping[] = [
  {
    speakerId: "Speaker 1",
    name: "Alice Johnson",
    role: "Product Manager",
    transcriptionId: "test-transcription-001",
  },
  {
    speakerId: "Speaker 2",
    name: "Bob Smith",
    role: "Lead Developer",
    transcriptionId: "test-transcription-001",
  },
  {
    speakerId: "Speaker 3",
    name: "Carol Davis",
    role: "QA Engineer",
    transcriptionId: "test-transcription-001",
  },
];

const mockSummaryResult: SummaryResult = {
  summaryId: "summary-001",
  transcriptionId: "test-transcription-001",
  summaryType: SummaryStyle.Brief,
  content:
    "This is a brief summary of the meeting discussing project timeline and deliverables.",
  generatedAt: "2024-01-01T10:00:00Z",
  processingTimeMs: 1500,
  tokenCount: 85,
  generatedFor: "Product Manager",
  usedSpeakerMappings: true,
  actionItems: [
    "Review project requirements by Friday",
    "Schedule follow-up meeting with stakeholders",
    "Update project timeline documentation",
  ],
  keyDecisions: [
    "Approved budget increase for Q2",
    "Decided to prioritize mobile features",
  ],
  nextSteps: [
    "Begin sprint planning session",
    "Assign tasks to development team",
  ],
};

describe("SummaryDisplay Component - S2.4 Tests", () => {
  const defaultProps = {
    transcriptionId: "test-transcription-001",
    speakerMappings: mockSpeakerMappings,
    onSummaryGenerated: vi.fn(),
  };

  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    // Reset DOM
    document.body.innerHTML = "";
    // Mock successful API response
    (apiService.generateTranscriptionSummary as Mock).mockResolvedValue({
      success: true,
      data: mockSummaryResult,
    } as ApiResponse<SummaryResult>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render all summary type tabs", () => {
      render(<SummaryDisplay {...defaultProps} />);

      expect(screen.getByText("Brief Summary")).toBeInTheDocument();
      expect(screen.getByText("Detailed Analysis")).toBeInTheDocument();
      expect(screen.getByText("Action Items")).toBeInTheDocument();
      expect(screen.getByText("Key Decisions")).toBeInTheDocument();
      expect(screen.getByText("Executive Summary")).toBeInTheDocument();
    });

    it("should render configuration panel with role selection", () => {
      render(<SummaryDisplay {...defaultProps} />);

      expect(screen.getByText("Summary Configuration")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Target Role (Optional)")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Summary Length")).toBeInTheDocument();
    });

    it("should display available roles from speaker mappings", async () => {
      render(<SummaryDisplay {...defaultProps} />);

      const roleSelect = screen.getByLabelText("Target Role (Optional)");
      await user.click(roleSelect);

      expect(screen.getByText("Product Manager")).toBeInTheDocument();
      expect(screen.getByText("Lead Developer")).toBeInTheDocument();
      expect(screen.getByText("QA Engineer")).toBeInTheDocument();
    });

    it("should render without speaker mappings", () => {
      render(<SummaryDisplay {...defaultProps} speakerMappings={undefined} />);

      expect(screen.getByText("Brief Summary")).toBeInTheDocument();
      expect(screen.getByText("Summary Configuration")).toBeInTheDocument();
    });
  });

  describe("Summary Generation", () => {
    it("should generate brief summary when button is clicked", async () => {
      render(<SummaryDisplay {...defaultProps} />);

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      expect(apiService.generateTranscriptionSummary).toHaveBeenCalledWith(
        "test-transcription-001",
        {
          transcriptionId: "test-transcription-001",
          style: SummaryStyle.Brief,
          maxTokens: 500,
        }
      );
    });

    it("should show loading state during summary generation", async () => {
      // Mock delayed response
      (apiService.generateTranscriptionSummary as Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: mockSummaryResult,
                }),
              100
            )
          )
      );

      render(<SummaryDisplay {...defaultProps} />);

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(generateButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
      });
    });

    it("should display generated summary content", async () => {
      render(<SummaryDisplay {...defaultProps} />);

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(mockSummaryResult.content)).toBeInTheDocument();
      });
    });

    it("should generate role-aware summary when role is selected", async () => {
      render(<SummaryDisplay {...defaultProps} />);

      // Select a role
      const roleSelect = screen.getByLabelText("Target Role (Optional)");
      await user.click(roleSelect);
      await user.click(screen.getByText("Product Manager"));

      // Generate summary
      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      expect(apiService.generateTranscriptionSummary).toHaveBeenCalledWith(
        "test-transcription-001",
        {
          transcriptionId: "test-transcription-001",
          style: SummaryStyle.Brief,
          targetRole: "Product Manager",
          maxTokens: 500,
        }
      );
    });

    it("should adjust token count when summary length is changed", async () => {
      render(<SummaryDisplay {...defaultProps} />);

      const lengthField = screen.getByLabelText("Summary Length");
      await user.clear(lengthField);
      await user.type(lengthField, "1000");

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      expect(apiService.generateTranscriptionSummary).toHaveBeenCalledWith(
        "test-transcription-001",
        {
          transcriptionId: "test-transcription-001",
          style: SummaryStyle.Brief,
          maxTokens: 1000,
        }
      );
    });

    it("should call onSummaryGenerated callback when summary is created", async () => {
      const onSummaryGenerated = vi.fn();
      render(
        <SummaryDisplay
          {...defaultProps}
          onSummaryGenerated={onSummaryGenerated}
        />
      );

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(onSummaryGenerated).toHaveBeenCalledWith(mockSummaryResult);
      });
    });
  });

  describe("Tab Navigation", () => {
    it("should switch between summary type tabs", async () => {
      render(<SummaryDisplay {...defaultProps} />);

      // Click on Detailed Analysis tab
      const detailedTab = screen.getByText("Detailed Analysis");
      await user.click(detailedTab);

      // Tab should be selected (aria-selected="true")
      expect(detailedTab.closest('[role="tab"]')).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("should maintain separate state for each summary type", async () => {
      render(<SummaryDisplay {...defaultProps} />);

      // Generate brief summary
      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(mockSummaryResult.content)).toBeInTheDocument();
      });

      // Switch to Action Items tab
      const actionItemsTab = screen.getByText("Action Items");
      await user.click(actionItemsTab);

      // Should show generate button again (no summary for this type yet)
      expect(
        screen.getByRole("button", { name: /generate summary/i })
      ).toBeInTheDocument();
    });
  });

  describe("Export Functionality", () => {
    beforeEach(async () => {
      // Set up component with generated summary
      render(<SummaryDisplay {...defaultProps} />);
      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);
      await waitFor(() => {
        expect(screen.getByText(mockSummaryResult.content)).toBeInTheDocument();
      });
    });

    it("should export summary as text format", async () => {
      const exportButton = screen.getByRole("button", {
        name: /download txt/i,
      });

      // Create a spy for document methods
      const mockLink = document.createElement("a");
      const clickSpy = vi.spyOn(mockLink, "click").mockImplementation(() => {});
      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockReturnValue(mockLink);

      const appendChildSpy = vi
        .spyOn(document.body, "appendChild")
        .mockImplementation(() => mockLink);
      const removeChildSpy = vi
        .spyOn(document.body, "removeChild")
        .mockImplementation(() => mockLink);

      await user.click(exportButton);

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(mockLink.download).toContain("meeting-summary-brief");
      expect(mockLink.download).toContain(".txt");
      expect(clickSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });

    it("should export summary as markdown format", async () => {
      const exportButton = screen.getByRole("button", { name: /download md/i });

      const mockLink = document.createElement("a");
      vi.spyOn(mockLink, "click").mockImplementation(() => {});
      vi.spyOn(document, "createElement").mockReturnValue(mockLink);

      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink);
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink);

      await user.click(exportButton);

      expect(mockLink.download).toContain(".md");
    });

    it("should export summary as HTML format", async () => {
      const exportButton = screen.getByRole("button", {
        name: /download html/i,
      });

      const mockLink = document.createElement("a");
      vi.spyOn(mockLink, "click").mockImplementation(() => {});
      vi.spyOn(document, "createElement").mockReturnValue(mockLink);

      vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink);
      vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink);

      await user.click(exportButton);

      expect(mockLink.download).toContain(".html");
    });
  });

  describe("Copy to Clipboard", () => {
    beforeEach(async () => {
      // Set up component with generated summary
      render(<SummaryDisplay {...defaultProps} />);
      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);
      await waitFor(() => {
        expect(screen.getByText(mockSummaryResult.content)).toBeInTheDocument();
      });
    });

    it("should copy summary content to clipboard", async () => {
      const copyButton = screen.getByRole("button", {
        name: /copy to clipboard/i,
      });
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining(mockSummaryResult.content)
      );
    });

    it("should show success message when copy succeeds", async () => {
      (navigator.clipboard.writeText as Mock).mockResolvedValue(undefined);

      const copyButton = screen.getByRole("button", {
        name: /copy to clipboard/i,
      });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it("should show error message when copy fails", async () => {
      (navigator.clipboard.writeText as Mock).mockRejectedValue(
        new Error("Copy failed")
      );

      const copyButton = screen.getByRole("button", {
        name: /copy to clipboard/i,
      });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to copy/i)).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error when API call fails", async () => {
      (apiService.generateTranscriptionSummary as Mock).mockResolvedValue({
        success: false,
        message: "API Error: Failed to generate summary",
      });

      render(<SummaryDisplay {...defaultProps} />);

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to generate summary/i)
        ).toBeInTheDocument();
      });
    });

    it("should handle network errors gracefully", async () => {
      (apiService.generateTranscriptionSummary as Mock).mockRejectedValue(
        new Error("Network error")
      );

      render(<SummaryDisplay {...defaultProps} />);

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it("should display error when transcription ID is missing", async () => {
      render(<SummaryDisplay {...defaultProps} transcriptionId="" />);

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/no transcription id/i)).toBeInTheDocument();
      });
    });
  });

  describe("Summary Content Display", () => {
    beforeEach(async () => {
      render(<SummaryDisplay {...defaultProps} />);
      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);
      await waitFor(() => {
        expect(screen.getByText(mockSummaryResult.content)).toBeInTheDocument();
      });
    });

    it("should display summary metadata", () => {
      expect(screen.getByText(/generated:/i)).toBeInTheDocument();
      expect(screen.getByText(/token count:/i)).toBeInTheDocument();
      expect(screen.getByText(/processing time:/i)).toBeInTheDocument();
    });

    it("should display action items when present", () => {
      expect(screen.getByText("Action Items")).toBeInTheDocument();
      expect(
        screen.getByText("Review project requirements by Friday")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Schedule follow-up meeting with stakeholders")
      ).toBeInTheDocument();
    });

    it("should display key decisions when present", () => {
      expect(screen.getByText("Key Decisions")).toBeInTheDocument();
      expect(
        screen.getByText("Approved budget increase for Q2")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Decided to prioritize mobile features")
      ).toBeInTheDocument();
    });

    it("should display next steps when present", () => {
      expect(screen.getByText("Next Steps")).toBeInTheDocument();
      expect(
        screen.getByText("Begin sprint planning session")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Assign tasks to development team")
      ).toBeInTheDocument();
    });

    it("should display target role when summary was generated for specific role", () => {
      expect(
        screen.getByText(/target role.*product manager/i)
      ).toBeInTheDocument();
    });
  });

  describe("Refresh Functionality", () => {
    it("should regenerate summary when refresh button is clicked", async () => {
      render(<SummaryDisplay {...defaultProps} />);

      // Generate initial summary
      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(mockSummaryResult.content)).toBeInTheDocument();
      });

      // Click refresh
      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      await user.click(refreshButton);

      expect(apiService.generateTranscriptionSummary).toHaveBeenCalledTimes(2);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and roles", () => {
      render(<SummaryDisplay {...defaultProps} />);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(5);
      expect(
        screen.getByRole("tabpanel", { hidden: true })
      ).toBeInTheDocument();
    });

    it("should have accessible form labels", () => {
      render(<SummaryDisplay {...defaultProps} />);

      expect(
        screen.getByLabelText("Target Role (Optional)")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Summary Length")).toBeInTheDocument();
    });

    it("should provide tooltips for action buttons", () => {
      render(<SummaryDisplay {...defaultProps} />);

      expect(screen.getByLabelText(/copy to clipboard/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/download txt/i)).toBeInTheDocument();
    });
  });

  describe("Integration with Speaker Mappings", () => {
    it("should work without speaker mappings", () => {
      render(<SummaryDisplay {...defaultProps} speakerMappings={[]} />);

      expect(screen.getByText("Brief Summary")).toBeInTheDocument();
      // Role selection should not be available
      const roleSelect = screen.queryByLabelText("Target Role (Optional)");
      expect(roleSelect).toBeInTheDocument(); // Component still renders but with no options
    });

    it("should handle empty role values in speaker mappings", () => {
      const mappingsWithEmptyRoles: SpeakerMapping[] = [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "",
          transcriptionId: "test-transcription-001",
        },
      ];

      render(
        <SummaryDisplay
          {...defaultProps}
          speakerMappings={mappingsWithEmptyRoles}
        />
      );

      expect(screen.getByText("Brief Summary")).toBeInTheDocument();
    });
  });
});
