/**
 * Color Accessibility Tests
 * S6.6 Increment 5: Color & Visual Accessibility
 * Validates WCAG AA compliance for color contrast utilities
 */

import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  meetsWCAG_AA,
  meetsWCAG_AAA,
  getAccessibilityRating,
  getBestTextColor,
  generateAccessibleColors,
  validateColorPalette,
  WCAG_AA_STANDARDS,
  WCAG_AAA_STANDARDS,
} from '../../theme/colorContrast';
import { 
  SPEAKER_COLORS, 
  HIGH_CONTRAST_SPEAKER_COLORS,
  getSpeakerColor,
  getSpeakerTextColor,
  validateSpeakerColorAccessibility,
} from '../../theme/speakerColors';

describe('Color Contrast Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert hex colors to RGB correctly', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#1976d2')).toEqual({ r: 25, g: 118, b: 210 });
    });

    it('should handle hex colors without # prefix', () => {
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should return null for invalid hex colors', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#gggggg')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });
  });

  describe('getLuminance', () => {
    it('should calculate luminance correctly for known values', () => {
      // White has luminance of 1
      expect(getLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 2);
      
      // Black has luminance of 0
      expect(getLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 2);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratios for known color pairs', () => {
      // White on black should be 21:1 (maximum contrast)
      expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0);
      
      // Same colors should have 1:1 ratio
      expect(getContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 2);
      expect(getContrastRatio('#000000', '#000000')).toBeCloseTo(1, 2);
      
      // Order shouldn't matter
      expect(getContrastRatio('#ffffff', '#000000')).toBe(getContrastRatio('#000000', '#ffffff'));
    });
  });

  describe('WCAG Compliance', () => {
    it('should correctly identify WCAG AA compliance', () => {
      // White on black meets AA for all text sizes
      expect(meetsWCAG_AA('#ffffff', '#000000', 'NORMAL_TEXT')).toBe(true);
      expect(meetsWCAG_AA('#ffffff', '#000000', 'LARGE_TEXT')).toBe(true);
      
      // Light gray on white fails AA for normal text
      expect(meetsWCAG_AA('#cccccc', '#ffffff', 'NORMAL_TEXT')).toBe(false);
    });

    it('should correctly identify WCAG AAA compliance', () => {
      // White on black meets AAA
      expect(meetsWCAG_AAA('#ffffff', '#000000', 'NORMAL_TEXT')).toBe(true);
      
      // Lower contrast fails AAA
      expect(meetsWCAG_AAA('#777777', '#ffffff', 'NORMAL_TEXT')).toBe(false);
    });

    it('should provide comprehensive accessibility ratings', () => {
      const rating = getAccessibilityRating('#ffffff', '#000000');
      
      expect(rating.ratio).toBeCloseTo(21, 0);
      expect(rating.AA_normal).toBe(true);
      expect(rating.AA_large).toBe(true);
      expect(rating.AAA_normal).toBe(true);
      expect(rating.AAA_large).toBe(true);
      expect(rating.rating).toBe('AAA');
    });
  });

  describe('getBestTextColor', () => {
    it('should choose white text for dark backgrounds', () => {
      expect(getBestTextColor('#000000')).toBe('#ffffff');
      expect(getBestTextColor('#1976d2')).toBe('#ffffff');
      expect(getBestTextColor('#d32f2f')).toBe('#ffffff');
    });

    it('should choose black text for light backgrounds', () => {
      expect(getBestTextColor('#ffffff')).toBe('#000000');
      expect(getBestTextColor('#ffeb3b')).toBe('#000000'); // Light yellow
    });
  });

  describe('generateAccessibleColors', () => {
    it('should generate accessible color variants', () => {
      const variants = generateAccessibleColors('#1976d2');
      
      expect(variants).toHaveProperty('lighter');
      expect(variants).toHaveProperty('darker');
      expect(variants).toHaveProperty('withWhiteText');
      expect(variants).toHaveProperty('withBlackText');
      
      // Verify variants are valid hex colors
      expect(variants.lighter).toMatch(/^#[0-9a-f]{6}$/i);
      expect(variants.darker).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('validateColorPalette', () => {
    it('should validate multiple colors against backgrounds', () => {
      const colors = ['#1976d2', '#d32f2f', '#388e3c'];
      const backgrounds = ['#ffffff', '#000000'];
      
      const results = validateColorPalette(colors, backgrounds);
      
      expect(results).toHaveLength(6); // 3 colors × 2 backgrounds
      
      results.forEach(result => {
        expect(result).toHaveProperty('color');
        expect(result).toHaveProperty('background');
        expect(result).toHaveProperty('isAccessible');
        expect(result).toHaveProperty('ratio');
        expect(typeof result.isAccessible).toBe('boolean');
        expect(typeof result.ratio).toBe('number');
      });
    });
  });
});

describe('Speaker Color Accessibility', () => {
  describe('SPEAKER_COLORS compliance', () => {
    it('should ensure all speaker colors meet WCAG AA with white text', () => {
      SPEAKER_COLORS.forEach(color => {
        const ratio = getContrastRatio('#ffffff', color);
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_STANDARDS.NORMAL_TEXT);
      });
    });
  });

  describe('HIGH_CONTRAST_SPEAKER_COLORS compliance', () => {
    it('should ensure all high contrast colors meet enhanced standards', () => {
      HIGH_CONTRAST_SPEAKER_COLORS.forEach(color => {
        const ratio = getContrastRatio('#ffffff', color);
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_STANDARDS.NORMAL_TEXT);
        
        // High contrast colors should ideally meet AAA standards
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AAA_STANDARDS.LARGE_TEXT);
      });
    });
  });

  describe('getSpeakerColor', () => {
    it('should return consistent colors for same speaker ID', () => {
      const speakerId = 'Speaker1';
      const color1 = getSpeakerColor(speakerId);
      const color2 = getSpeakerColor(speakerId);
      
      expect(color1).toBe(color2);
    });

    it('should return different colors for different speakers', () => {
      const color1 = getSpeakerColor('Speaker1');
      const color2 = getSpeakerColor('Speaker2');
      
      expect(color1).not.toBe(color2);
    });

    it('should handle high contrast mode', () => {
      const speakerId = 'Speaker1';
      const normalColor = getSpeakerColor(speakerId, false);
      const highContrastColor = getSpeakerColor(speakerId, true);
      
      // Both should be valid hex colors
      expect(normalColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(highContrastColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should handle undefined/null speaker IDs gracefully', () => {
      expect(getSpeakerColor(undefined)).toBe('#616161');
      expect(getSpeakerColor('Unassigned')).toBe('#616161');
    });
  });

  describe('getSpeakerTextColor', () => {
    it('should return appropriate text colors for all speaker colors', () => {
      SPEAKER_COLORS.forEach(backgroundColor => {
        const textColor = getSpeakerTextColor(backgroundColor);
        expect(['#ffffff', '#000000']).toContain(textColor);
        
        // Verify the text color provides sufficient contrast
        const ratio = getContrastRatio(textColor, backgroundColor);
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_STANDARDS.NORMAL_TEXT);
      });
    });
  });

  describe('validateSpeakerColorAccessibility', () => {
    it('should validate speaker color accessibility correctly', () => {
      SPEAKER_COLORS.forEach(color => {
        const validation = validateSpeakerColorAccessibility(color);
        
        expect(validation).toHaveProperty('contrastRatio');
        expect(validation).toHaveProperty('meetsWCAG_AA');
        expect(validation).toHaveProperty('backgroundColor');
        expect(validation).toHaveProperty('textColor');
        expect(validation).toHaveProperty('recommendation');
        
        expect(validation.meetsWCAG_AA).toBe(true);
        expect(validation.backgroundColor).toBe(color);
        expect(validation.recommendation).toBe('Accessible');
      });
    });
  });
});

describe('WCAG Standards Constants', () => {
  it('should have correct WCAG AA standards', () => {
    expect(WCAG_AA_STANDARDS.NORMAL_TEXT).toBe(4.5);
    expect(WCAG_AA_STANDARDS.LARGE_TEXT).toBe(3.0);
    expect(WCAG_AA_STANDARDS.GRAPHICAL_OBJECTS).toBe(3.0);
    expect(WCAG_AA_STANDARDS.UI_COMPONENTS).toBe(3.0);
  });

  it('should have correct WCAG AAA standards', () => {
    expect(WCAG_AAA_STANDARDS.NORMAL_TEXT).toBe(7.0);
    expect(WCAG_AAA_STANDARDS.LARGE_TEXT).toBe(4.5);
    expect(WCAG_AAA_STANDARDS.GRAPHICAL_OBJECTS).toBe(4.5);
    expect(WCAG_AAA_STANDARDS.UI_COMPONENTS).toBe(4.5);
  });
});

describe('Integration Tests', () => {
  it('should validate entire application color scheme', () => {
    // Test all speaker colors against common backgrounds
    const backgrounds = ['#ffffff', '#121212', '#fafafa', '#1e1e1e'];
    
    const allColors = [...SPEAKER_COLORS, ...HIGH_CONTRAST_SPEAKER_COLORS];
    const results = validateColorPalette(allColors, backgrounds);
    
    // Calculate compliance percentage
    const accessibleCombinations = results.filter(r => r.isAccessible).length;
    const totalCombinations = results.length;
    const complianceRate = accessibleCombinations / totalCombinations;
    
    // Should have high compliance rate (>90%)
    expect(complianceRate).toBeGreaterThan(0.9);
    
    console.log(`Color accessibility compliance: ${(complianceRate * 100).toFixed(1)}%`);
  });

  it('should ensure system meets accessibility requirements', () => {
    // Test critical UI elements have sufficient contrast
    const criticalTests = [
      { fg: '#ffffff', bg: '#1565c0', name: 'Primary button text' },
      { fg: '#000000', bg: '#ffffff', name: 'Main content text' },
      { fg: '#ffffff', bg: '#c62828', name: 'Error state' },
      { fg: '#000000', bg: '#4caf50', name: 'Success state' },
    ];

    criticalTests.forEach(test => {
      const ratio = getContrastRatio(test.fg, test.bg);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_STANDARDS.NORMAL_TEXT);
      console.log(`${test.name}: ${ratio.toFixed(2)}:1 contrast ratio`);
    });
  });
});