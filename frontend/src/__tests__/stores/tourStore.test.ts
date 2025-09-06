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
        // Step 1 requires user action (file-select) before advancing
        result.current.triggerStepAction('file-select');
      });
      
      expect(result.current.currentStep).toBe(2);
    });

    it("stops tour and resets state", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour();
        // Perform valid action first, then stop
        result.current.triggerStepAction('file-select');
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
        result.current.startTour(); // Step 1 (user-action: file-select)
        result.current.triggerStepAction('file-select'); // Step 2 (acknowledgment)
        result.current.nextStep(); // Step 3 (user-action: manage-names)
      });
      
      expect(result.current.currentStep).toBe(3);
      expect(result.current.isActionDisabledDuringTour("manage-speakers")).toBe(false);
      expect(result.current.isActionDisabledDuringTour("add-speaker")).toBe(true);
      expect(result.current.isActionDisabledDuringTour("generate-summary")).toBe(true);
    });

    it("supports row-specific controls in step 6", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour(); // Step 1 (user-action: file-select)
        result.current.triggerStepAction('file-select'); // Step 2 (acknowledgment)
        result.current.nextStep(); // Step 3 (user-action: manage-names)
        result.current.triggerStepAction('manage-names'); // Step 4 (user-action: add-speaker)
        result.current.triggerStepAction('add-speaker'); // Step 5 (acknowledgment)
        result.current.nextStep(); // Step 6 (user-action: edit-speaker)
      });
      
      // Should allow edit on first row only
      expect(result.current.isActionDisabledDuringTour("edit-speaker", 0)).toBe(false);
      expect(result.current.isActionDisabledDuringTour("edit-speaker", 1)).toBe(true);
      expect(result.current.isActionDisabledDuringTour("edit-speaker", 2)).toBe(true);
    });

    it("enables save-speaker only in step 7", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour(); // Step 1 (user-action: file-select)
        result.current.triggerStepAction('file-select'); // Step 2 (acknowledgment)
        result.current.nextStep(); // Step 3 (user-action: manage-names)
        result.current.triggerStepAction('manage-names'); // Step 4 (user-action: add-speaker)
        result.current.triggerStepAction('add-speaker'); // Step 5 (acknowledgment)
        result.current.nextStep(); // Step 6 (user-action: edit-speaker)
        result.current.triggerStepAction('edit-speaker'); // Step 7 (user-action: save-speaker)
      });
      
      expect(result.current.isActionDisabledDuringTour("save-speaker")).toBe(false);
      expect(result.current.isActionDisabledDuringTour("edit-speaker")).toBe(true);
      expect(result.current.isActionDisabledDuringTour("add-speaker")).toBe(true);
    });

    it("enables email workflow actions in steps 11-18", () => {
      const { result } = renderHook(() => useTourStore());
      
      act(() => {
        result.current.startTour(); // Step 1 (user-action: file-select)
        result.current.triggerStepAction('file-select'); // Step 2 (acknowledgment)
        result.current.nextStep(); // Step 3 (user-action: manage-names)
        result.current.triggerStepAction('manage-names'); // Step 4 (user-action: add-speaker)
        result.current.triggerStepAction('add-speaker'); // Step 5 (acknowledgment)
        result.current.nextStep(); // Step 6 (user-action: edit-speaker)
        result.current.triggerStepAction('edit-speaker'); // Step 7 (user-action: save-speaker)
        result.current.triggerStepAction('save-speaker'); // Step 8 (acknowledgment)
        result.current.nextStep(); // Step 9 (acknowledgment)
        result.current.nextStep(); // Step 10 (user-action: generate-summary)
        result.current.triggerStepAction('generate-summary'); // Step 11 (user-action: expand-action-items)
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
        result.current.startTour(); // Step 1 (user-action: file-select)
        result.current.triggerStepAction('file-select'); // Step 2 (acknowledgment)
      });
      
      expect(result.current.isCurrentStep(1)).toBe(false);
      expect(result.current.isCurrentStep(2)).toBe(true);
    });
  });

  describe("Tour Step Configuration", () => {
    it("has complete step configuration for all 18 steps", () => {
      const { result } = renderHook(() => useTourStore());
      
      // Tour should support steps 1-18 - Use proper advancement based on step type
      act(() => {
        result.current.startTour(); // Step 1 (user-action: file-select)
        result.current.triggerStepAction('file-select'); // Step 2 (acknowledgment)
        result.current.nextStep(); // Step 3 (user-action: manage-names)
        result.current.triggerStepAction('manage-names'); // Step 4 (user-action: add-speaker)
        result.current.triggerStepAction('add-speaker'); // Step 5 (acknowledgment)
        result.current.nextStep(); // Step 6 (user-action: edit-speaker)
        result.current.triggerStepAction('edit-speaker'); // Step 7 (user-action: save-row)
        result.current.triggerStepAction('save-row'); // Step 8 (user-action: final-save)
        result.current.triggerStepAction('final-save'); // Step 9 (acknowledgment)
        result.current.nextStep(); // Step 10 (user-action: generate-summary)
        result.current.triggerStepAction('generate-summary'); // Step 11 (user-action: expand-action-items)
        result.current.triggerStepAction('expand-action-items'); // Step 12 (acknowledgment)
        result.current.nextStep(); // Step 13 (user-action: open-email-dialog)
        result.current.triggerStepAction('open-email-dialog'); // Step 14 (user-action: add-email-recipient)
        result.current.triggerStepAction('add-email-recipient'); // Step 15 (acknowledgment)
        result.current.nextStep(); // Step 16 (user-action: preview-email)
        result.current.triggerStepAction('preview-email'); // Step 17 (user-action: send-email)
        result.current.triggerStepAction('send-email'); // Step 18 (acknowledgment)
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
