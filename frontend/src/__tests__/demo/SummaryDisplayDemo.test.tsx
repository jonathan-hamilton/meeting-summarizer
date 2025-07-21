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
import SummaryDisplayDemo from "../../demo/SummaryDisplayDemo";
import { apiService } from "../../services/apiService";
import type { SummaryResult, ApiResponse } from "../../types";
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

const mockSummaryResult: SummaryResult = {
  summaryId: "demo-summary-001",
  transcriptionId: "demo-transcription-001",
  summaryType: SummaryStyle.Brief,
  content:
    "This is a demo summary showing the AI-powered meeting summarization capabilities.",
  generatedAt: "2024-01-01T10:00:00Z",
  processingTimeMs: 1200,
  tokenCount: 95,
  generatedFor: "Product Manager",
  usedSpeakerMappings: true,
  actionItems: [
    "Demo action item 1: Review project requirements",
    "Demo action item 2: Schedule follow-up meeting",
  ],
  keyDecisions: [
    "Demo decision 1: Approved new feature set",
    "Demo decision 2: Extended project timeline",
  ],
  nextSteps: [
    "Demo next step 1: Begin development phase",
    "Demo next step 2: Prepare testing environment",
  ],
};

describe("SummaryDisplayDemo Component - S2.4 Demo Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API response
    (apiService.generateTranscriptionSummary as Mock).mockResolvedValue({
      success: true,
      data: mockSummaryResult,
    } as ApiResponse<SummaryResult>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Demo Landing Page", () => {
    it("should render demo introduction and overview", () => {
      render(<SummaryDisplayDemo />);

      expect(screen.getByText("AI Summary Display Demo")).toBeInTheDocument();
      expect(
        screen.getByText(
          /experience the power of ai-generated meeting summaries/i
        )
      ).toBeInTheDocument();
      expect(screen.getByText(/demo features/i)).toBeInTheDocument();
    });

    it("should display demo scenario selection dropdown", () => {
      render(<SummaryDisplayDemo />);

      expect(screen.getByLabelText("Demo Meeting")).toBeInTheDocument();
      expect(screen.getByText("Project Planning Meeting")).toBeInTheDocument();
    });

    it("should show feature highlights", () => {
      render(<SummaryDisplayDemo />);

      expect(screen.getByText("🎯 Role-Aware Summaries")).toBeInTheDocument();
      expect(screen.getByText("📊 Multiple Summary Types")).toBeInTheDocument();
      expect(screen.getByText("📤 Export Options")).toBeInTheDocument();
      expect(screen.getByText("⚡ Real-time Generation")).toBeInTheDocument();
    });

    it('should display "How to Test" section', () => {
      render(<SummaryDisplayDemo />);

      expect(screen.getByText("How to Test:")).toBeInTheDocument();
      expect(
        screen.getByText(/select a demo scenario from the dropdown menu/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/test export functionality/i)
      ).toBeInTheDocument();
    });

    it("should show backend service requirement notice", () => {
      render(<SummaryDisplayDemo />);

      expect(
        screen.getByText(/requires the backend ai summarization service/i)
      ).toBeInTheDocument();
    });
  });

  describe("Demo Scenario Selection", () => {
    it("should allow selecting different demo scenarios", async () => {
      render(<SummaryDisplayDemo />);

      const dropdown = screen.getByLabelText("Demo Meeting");
      await user.click(dropdown);

      // Check all demo options are available
      expect(screen.getByText("Project Planning Meeting")).toBeInTheDocument();
      expect(screen.getByText("Executive Strategy Review")).toBeInTheDocument();
      expect(
        screen.getByText("Client Requirements Gathering")
      ).toBeInTheDocument();

      // Select Executive Strategy Review
      await user.click(screen.getByText("Executive Strategy Review"));

      // Verify the demo details update
      await waitFor(() => {
        expect(
          screen.getByText("Quarterly review with CEO, CFO, and CTO")
        ).toBeInTheDocument();
      });
    });

    it("should display participant information for selected scenario", () => {
      render(<SummaryDisplayDemo />);

      // Default scenario should show participants
      expect(
        screen.getByText("Alice Johnson (Product Manager)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Bob Smith (Lead Developer)")
      ).toBeInTheDocument();
      expect(screen.getByText("Carol Davis (QA Engineer)")).toBeInTheDocument();
    });

    it("should update participant chips when scenario changes", async () => {
      render(<SummaryDisplayDemo />);

      const dropdown = screen.getByLabelText("Demo Meeting");
      await user.click(dropdown);
      await user.click(screen.getByText("Executive Strategy Review"));

      await waitFor(() => {
        expect(screen.getByText("David Chen (CEO)")).toBeInTheDocument();
        expect(screen.getByText("Emily Rodriguez (CFO)")).toBeInTheDocument();
        expect(screen.getByText("Frank Wilson (CTO)")).toBeInTheDocument();
      });
    });
  });

  describe("Demo Navigation", () => {
    it("should navigate to summary interface when start button is clicked", async () => {
      render(<SummaryDisplayDemo />);

      const startButton = screen.getByRole("button", {
        name: /start ai summary demo/i,
      });
      await user.click(startButton);

      // Should show the SummaryDisplay component
      expect(screen.getByText("Brief Summary")).toBeInTheDocument();
      expect(screen.getByText("Summary Configuration")).toBeInTheDocument();
    });

    it("should show back button in summary interface", async () => {
      render(<SummaryDisplayDemo />);

      const startButton = screen.getByRole("button", {
        name: /start ai summary demo/i,
      });
      await user.click(startButton);

      expect(
        screen.getByRole("button", { name: /back to demo selection/i })
      ).toBeInTheDocument();
    });

    it("should return to demo selection when back button is clicked", async () => {
      render(<SummaryDisplayDemo />);

      // Start demo
      const startButton = screen.getByRole("button", {
        name: /start ai summary demo/i,
      });
      await user.click(startButton);

      // Go back
      const backButton = screen.getByRole("button", {
        name: /back to demo selection/i,
      });
      await user.click(backButton);

      // Should be back to demo selection
      expect(screen.getByText("AI Summary Display Demo")).toBeInTheDocument();
      expect(screen.getByLabelText("Demo Meeting")).toBeInTheDocument();
    });
  });

  describe("Summary Interface Integration", () => {
    beforeEach(async () => {
      render(<SummaryDisplayDemo />);
      const startButton = screen.getByRole("button", {
        name: /start ai summary demo/i,
      });
      await user.click(startButton);
    });

    it("should display scenario context in summary interface", () => {
      expect(screen.getByText("Project Planning Meeting")).toBeInTheDocument();
      expect(
        screen.getByText("Sprint planning session with development team")
      ).toBeInTheDocument();
    });

    it("should show participant information in summary interface", () => {
      expect(
        screen.getByText("Alice Johnson (Product Manager)")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Bob Smith (Lead Developer)")
      ).toBeInTheDocument();
      expect(screen.getByText("Carol Davis (QA Engineer)")).toBeInTheDocument();
    });

    it("should pass correct transcription ID to SummaryDisplay", async () => {
      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      expect(apiService.generateTranscriptionSummary).toHaveBeenCalledWith(
        "demo-transcription-001",
        expect.any(Object)
      );
    });

    it("should pass speaker mappings to SummaryDisplay", async () => {
      // The speaker mappings should be available for role selection
      const roleSelect = screen.getByLabelText("Target Role (Optional)");
      await user.click(roleSelect);

      expect(screen.getByText("Product Manager")).toBeInTheDocument();
      expect(screen.getByText("Lead Developer")).toBeInTheDocument();
      expect(screen.getByText("QA Engineer")).toBeInTheDocument();
    });
  });

  describe("Demo Data Consistency", () => {
    it("should use consistent transcription IDs across scenarios", async () => {
      render(<SummaryDisplayDemo />);

      // Test different scenarios have different transcription IDs
      const dropdown = screen.getByLabelText("Demo Meeting");

      // Executive Strategy Review
      await user.click(dropdown);
      await user.click(screen.getByText("Executive Strategy Review"));

      const startButton = screen.getByRole("button", {
        name: /start ai summary demo/i,
      });
      await user.click(startButton);

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      expect(apiService.generateTranscriptionSummary).toHaveBeenCalledWith(
        "demo-transcription-002",
        expect.any(Object)
      );
    });

    it("should maintain speaker mappings consistency for each scenario", async () => {
      render(<SummaryDisplayDemo />);

      // Switch to Client Requirements Gathering scenario
      const dropdown = screen.getByLabelText("Demo Meeting");
      await user.click(dropdown);
      await user.click(screen.getByText("Client Requirements Gathering"));

      await waitFor(() => {
        expect(
          screen.getByText("Grace Kim (Business Analyst)")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Henry Taylor (Client Representative)")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Iris Miller (UX Designer)")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Demo Callback Handling", () => {
    it("should handle summary generation callback", async () => {
      render(<SummaryDisplayDemo />);

      const startButton = screen.getByRole("button", {
        name: /start ai summary demo/i,
      });
      await user.click(startButton);

      // Generate a summary
      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(mockSummaryResult.content)).toBeInTheDocument();
      });
    });

    it("should log summary generation in console", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      render(<SummaryDisplayDemo />);

      const startButton = screen.getByRole("button", {
        name: /start ai summary demo/i,
      });
      await user.click(startButton);

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Summary generated:",
          mockSummaryResult
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Accessibility in Demo", () => {
    it("should have accessible form controls in demo selection", () => {
      render(<SummaryDisplayDemo />);

      expect(screen.getByLabelText("Demo Meeting")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /start ai summary demo/i })
      ).toBeInTheDocument();
    });

    it("should maintain accessibility in summary interface", async () => {
      render(<SummaryDisplayDemo />);

      const startButton = screen.getByRole("button", {
        name: /start ai summary demo/i,
      });
      await user.click(startButton);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(5);
    });

    it("should have proper heading hierarchy", () => {
      render(<SummaryDisplayDemo />);

      // Main heading should be h1
      const mainHeading = screen.getByRole("heading", { level: 1 });
      expect(mainHeading).toHaveTextContent("AI Summary Display Demo");
    });
  });

  describe("Error Handling in Demo", () => {
    it("should handle API errors gracefully in demo mode", async () => {
      (apiService.generateTranscriptionSummary as Mock).mockResolvedValue({
        success: false,
        message: "Demo API Error: Service temporarily unavailable",
      });

      render(<SummaryDisplayDemo />);

      const startButton = screen.getByRole("button", {
        name: /start ai summary demo/i,
      });
      await user.click(startButton);

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/demo api error/i)).toBeInTheDocument();
      });
    });

    it("should display helpful error messages for demo users", async () => {
      (apiService.generateTranscriptionSummary as Mock).mockRejectedValue(
        new Error("Network connection failed")
      );

      render(<SummaryDisplayDemo />);

      const startButton = screen.getByRole("button", {
        name: /start ai summary demo/i,
      });
      await user.click(startButton);

      const generateButton = screen.getByRole("button", {
        name: /generate summary/i,
      });
      await user.click(generateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/network connection failed/i)
        ).toBeInTheDocument();
      });
    });
  });
});
