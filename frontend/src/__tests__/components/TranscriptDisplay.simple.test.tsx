/**
 * Simple TranscriptDisplay Test - Modern Architecture
 * Basic functionality test for current architecture validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import TranscriptDisplay from "../../components/TranscriptDisplay";
import { useSpeakerSessionStore } from "../../stores/speakerSessionStore";
import { useTourStore } from "../../stores/tourStore";
import { mockTranscriptionResponseWithSpeakers } from "../mocks/transcriptionMocks";

// Mock stores
vi.mock("../../stores/speakerSessionStore");
vi.mock("../../stores/tourStore");

const mockUseSpeakerSessionStore = useSpeakerSessionStore as unknown as ReturnType<typeof vi.fn>;
const mockUseTourStore = useTourStore as unknown as ReturnType<typeof vi.fn>;

describe("TranscriptDisplay - Basic Modern Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock tour store (not active by default)
    mockUseTourStore.mockReturnValue({
      isActive: false,
      currentStep: 0,
      isCurrentStep: vi.fn().mockReturnValue(false),
      isActionDisabledDuringTour: vi.fn().mockReturnValue(false),
      triggerStepAction: vi.fn(),
    });

    // Mock speaker session store with minimal data
    mockUseSpeakerSessionStore.mockReturnValue({
      transcript: "",
      audioFile: null,
      speakers: [],
      speakerMappings: [],
      transcriptionStats: null,
      isUploading: false,
      processingTime: 0,
    });
  });

  it("renders without crashing when no transcript", () => {
    const emptyTranscription = {
      ...mockTranscriptionResponseWithSpeakers,
      transcribedText: "",
      speakerSegments: [],
    };

    render(<TranscriptDisplay transcription={emptyTranscription} />);
    
    // Should render the component without errors
    expect(document.body).toBeInTheDocument();
  });

  it("displays transcript when available", () => {
    mockUseSpeakerSessionStore.mockReturnValue({
      transcript: "Speaker 1: Hello world",
      audioFile: { name: "test.mp3" },
      speakers: ["Speaker 1"],
      speakerMappings: [],
      transcriptionStats: {
        confidence: 0.95,
        duration: 120,
        fileSize: 1024,
        language: "en",
      },
      isUploading: false,
      processingTime: 5000,
    });

    render(<TranscriptDisplay transcription={mockTranscriptionResponseWithSpeakers} />);
    
    expect(screen.getByText(/Hello everyone/)).toBeInTheDocument();
  });
});
