/**
 * Debug test for SpeakerMapping - Minimal reproduction
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import React from "react";
import { SpeakerMappingComponent } from "../../components/SpeakerMapping";
import { renderWithProviders } from "../utils/TestProviders";

// Mock everything the component uses
vi.mock("../../stores/speakerSessionStore");
vi.mock("../../stores/tourStore");
vi.mock("../../contexts/AppModeContext");
vi.mock("../../services/sessionManager");
vi.mock("@mui/icons-material", () => ({
  Person: vi.fn(() => React.createElement('div', { 'data-testid': 'person-icon' })),
  Edit: vi.fn(() => React.createElement('div', { 'data-testid': 'edit-icon' })),
  Mic: vi.fn(() => React.createElement('div', { 'data-testid': 'mic-icon' })),
  PersonAdd: vi.fn(() => React.createElement('div', { 'data-testid': 'person-add-icon' })),
  EditNote: vi.fn(() => React.createElement('div', { 'data-testid': 'edit-note-icon' })),
}));
vi.mock("../../components/SpeakerMappingDialog", () => ({
  SpeakerMappingDialog: vi.fn(() => null),
}));
vi.mock("../../theme/speakerColors", () => ({
  getSpeakerColor: vi.fn((speakerId: string) => `#${speakerId.slice(-6)}`),
}));
vi.mock("../../components/TourPopover", () => ({
  TourPopover: vi.fn(() => null),
}));

describe("SpeakerMapping Debug", () => {
  const defaultProps = {
    transcriptionId: "test-transcription-123",
    detectedSpeakers: ["Speaker 1", "Speaker 2"],
    onMappingsChanged: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import modules inside beforeEach to ensure mocks are applied
    const { useSpeakerSessionStore, useActiveSpeakers } = await import("../../stores/speakerSessionStore");
    const { useTourStore } = await import("../../stores/tourStore");
    const { useAppMode } = await import("../../contexts/AppModeContext");
    const { sessionManager } = await import("../../services/sessionManager");

    // Mock with minimal data
    vi.mocked(useAppMode).mockReturnValue({
      mode: 'development',
      isDemo: false,
      isDevelopment: true,
      isProduction: false,
      setMode: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    } as any);

    vi.mocked(useTourStore).mockReturnValue({
      isActive: false,
      closeStep: vi.fn(),
      triggerStepAction: vi.fn(),
      isCurrentStep: vi.fn(() => false),
      isActionDisabledDuringTour: vi.fn(() => false),
    } as any);

    vi.mocked(useActiveSpeakers).mockReturnValue(["Speaker 1", "Speaker 2"]);

    const mockStore = {
      speakerMappings: [
        {
          speakerId: "Speaker 1",
          name: "John Doe",
          role: "Manager",
          transcriptionId: "test-transcription-123",
          source: "AutoDetected" as const,
        },
      ],
      transcriptionId: "test-transcription-123",
    };

    vi.mocked(useSpeakerSessionStore).mockImplementation((selector?: any) => {
      console.log("DEBUG: Store selector called with:", selector?.toString?.());
      if (selector) return selector(mockStore);
      return mockStore;
    });

    vi.mocked(sessionManager.getOverrides).mockReturnValue({});
  });

  it("test bare render", () => {
    const { render } = require("@testing-library/react");
    
    const TestComponent: React.FC<{ message: string }> = ({ message }) => {
      console.log("DEBUG: TestComponent rendering with message:", message);
      return React.createElement("div", { "data-testid": "test-component" }, message);
    };
    
    const result = render(React.createElement(TestComponent, { message: "Hello World" }));
    
    console.log("DEBUG: Bare render test:");
    result.debug();
    
    expect(result.getByTestId("test-component")).toBeInTheDocument();
  });

  it("should render something", () => {
    console.log("DEBUG: Starting test render");
    
    const result = renderWithProviders(<SpeakerMappingComponent {...defaultProps} />);
    
    console.log("DEBUG: Render result:");
    result.debug();
    
    // Just check the container exists
    expect(result.container).toBeInTheDocument();
  });
});
