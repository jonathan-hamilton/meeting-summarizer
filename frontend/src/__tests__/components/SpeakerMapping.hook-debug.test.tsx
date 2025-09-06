/**
 * Hook Debug Test - Isolate which hook is causing SpeakerMapping render failure
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSpeakerSessionStore, useActiveSpeakers } from "../../stores/speakerSessionStore";
import { useTourStore } from "../../stores/tourStore";
import { useAppMode } from "../../contexts/AppModeContext";
import { renderWithProviders } from "../utils/TestProviders";

// Mock each hook individually
vi.mock("../../stores/speakerSessionStore");
vi.mock("../../stores/tourStore");
vi.mock("../../contexts/AppModeContext");

describe("SpeakerMapping Hook Debug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useAppMode hook works", () => {
    vi.mocked(useAppMode).mockReturnValue({
      mode: 'development',
      isDemo: false,
      isDevelopment: true,
      isProduction: false,
      setMode: vi.fn(),
      resetToDefault: vi.fn(),
    });

    const { result } = renderHook(() => useAppMode(), {
      wrapper: ({ children }) => renderWithProviders(<div>{children}</div>, { initialMode: 'development' }).container,
    });

    expect(result.current.isDemo).toBe(false);
    console.log("✅ useAppMode works");
  });

  it("useTourStore hook works", () => {
    vi.mocked(useTourStore).mockReturnValue({
      isActive: false,
      closeStep: vi.fn(),
      triggerStepAction: vi.fn(),
      isCurrentStep: vi.fn().mockReturnValue(false),
      isActionDisabledDuringTour: vi.fn().mockReturnValue(false),
    });

    const { result } = renderHook(() => useTourStore());

    expect(result.current.isActive).toBe(false);
    console.log("✅ useTourStore works");
  });

  it("useActiveSpeakers hook works", () => {
    vi.mocked(useActiveSpeakers).mockReturnValue(["Speaker 1", "Speaker 2"]);

    const { result } = renderHook(() => useActiveSpeakers());

    expect(result.current).toEqual(["Speaker 1", "Speaker 2"]);
    console.log("✅ useActiveSpeakers works");
  });

  it("useSpeakerSessionStore hook works", () => {
    const mockStore = {
      speakerMappings: [],
      transcriptionId: "test-123",
    };
    
    vi.mocked(useSpeakerSessionStore).mockImplementation((selector?: any) => {
      if (selector) return selector(mockStore);
      return mockStore;
    });

    const { result } = renderHook(() => useSpeakerSessionStore(state => state.speakerMappings));

    expect(result.current).toEqual([]);
    console.log("✅ useSpeakerSessionStore works");
  });
});
