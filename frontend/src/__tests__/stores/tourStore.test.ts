/**
 * Tour Store Tests - Complete Coverage for S5.1 Tour System
 * Tests centralized process control and tour state management
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTourStore } from "../../stores/tourStore";

describe("TourStore - Comprehensive Tour System", () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useTourStore());
    act(() => {
      result.current.resetTour();
    });
  });

  describe("Basic Tour State Management", () => {
    it("initializes with tour inactive", () => {
      const { result } = renderHook(() => useTourStore());
      
      expect(result.current.isActive).toBe(false);
      expect(result.current.currentStep).toBe(0);
    });

    it("activates tour and sets to step 1", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour();
      });
      
      expect(result.current.isActive).toBe(true);
      expect(result.current.currentStep).toBe(1);
    });

    it("advances to next step correctly", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour();
        result.current.nextStep();
      });
      
      expect(result.current.currentStep).toBe(2);
    });

    it("stops tour and resets state", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour();
        result.current.nextStep();
        result.current.stopTour();
      });
      
      expect(result.current.isActive).toBe(false);
      expect(result.current.currentStep).toBe(0);
    });
  });

  describe("Process Control System - S5.1 Core Feature", () => {
    it("returns false when tour is not active", () => {
      const { result } = renderHook(() => useTourStore());
      
      const isDisabled = result.current.isActionDisabledDuringTour("file-upload");
      expect(isDisabled).toBe(false);
    });

    it("disables all actions except file-upload in step 1", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour(); // Step 1
      });
      
      expect(result.current.isActionDisabledDuringTour("file-upload")).toBe(false);
      expect(result.current.isActionDisabledDuringTour("manage-speakers")).toBe(true);
      expect(result.current.isActionDisabledDuringTour("generate-summary")).toBe(true);
      expect(result.current.isActionDisabledDuringTour("copy-transcript")).toBe(true);
    });

    it("enables manage-speakers only in step 3", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour();
        result.current.nextStep(); // Step 2
        result.current.nextStep(); // Step 3
      });
      
      expect(result.current.isActionDisabledDuringTour("manage-speakers")).toBe(false);
      expect(result.current.isActionDisabledDuringTour("add-speaker")).toBe(true);
      expect(result.current.isActionDisabledDuringTour("generate-summary")).toBe(true);
    });

    it("supports row-specific controls in step 6", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour();
        // Advance to step 6
        for (let i = 0; i < 5; i++) {
          result.current.nextStep();
        }
      });
      
      // Should allow edit on first row only
      expect(result.current.isActionDisabledDuringTour("edit-speaker", 0)).toBe(false);
      expect(result.current.isActionDisabledDuringTour("edit-speaker", 1)).toBe(true);
      expect(result.current.isActionDisabledDuringTour("edit-speaker", 2)).toBe(true);
    });

    it("enables save-speaker only in step 7", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour();
        // Advance to step 7
        for (let i = 0; i < 6; i++) {
          result.current.nextStep();
        }
      });
      
      expect(result.current.isActionDisabledDuringTour("save-speaker")).toBe(false);
      expect(result.current.isActionDisabledDuringTour("edit-speaker")).toBe(true);
      expect(result.current.isActionDisabledDuringTour("add-speaker")).toBe(true);
    });

    it("enables email workflow actions in steps 11-18", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour();
        // Advance to step 11
        for (let i = 0; i < 10; i++) {
          result.current.nextStep();
        }
      });
      
      expect(result.current.isActionDisabledDuringTour("share-email")).toBe(false);
      expect(result.current.isActionDisabledDuringTour("generate-summary")).toBe(true);
    });
  });

  describe("Step Action Triggers", () => {
    it("advances step when correct action is triggered", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour(); // Step 1
        result.current.triggerStepAction("file-select");
      });
      
      expect(result.current.currentStep).toBe(2);
    });

    it("does not advance step for incorrect action", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour(); // Step 1
        result.current.triggerStepAction("wrong-action");
      });
      
      expect(result.current.currentStep).toBe(1);
    });
  });

  describe("Current Step Detection", () => {
    it("correctly identifies current step", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour(); // Step 1
      });
      
      expect(result.current.isCurrentStep(1)).toBe(true);
      expect(result.current.isCurrentStep(2)).toBe(false);
    });

    it("updates current step detection after advancement", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour(); // Step 1
        result.current.nextStep(); // Step 2
      });
      
      expect(result.current.isCurrentStep(1)).toBe(false);
      expect(result.current.isCurrentStep(2)).toBe(true);
    });
  });

  describe("Tour Step Configuration", () => {
    it("has complete step configuration for all 18 steps", () => {
      const { result } = renderHook(() => useTourStore());
      
      // Tour should support steps 1-18
      act(() => {
        result.current.startTour();
        for (let i = 1; i <= 17; i++) {
          result.current.nextStep();
        }
      });
      
      expect(result.current.currentStep).toBe(18);
      expect(result.current.isActive).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("handles invalid step numbers gracefully", () => {
      const { result } = renderHook(() => useTourStore());
      
      expect(result.current.isCurrentStep(-1)).toBe(false);
      expect(result.current.isCurrentStep(999)).toBe(false);
    });

    it("handles invalid action types gracefully", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour();
      });
      
      // Should not throw error for unknown action
      const isDisabled = result.current.isActionDisabledDuringTour("unknown-action");
      expect(typeof isDisabled).toBe("boolean");
    });
  });
});
