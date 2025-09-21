/**
 * Color Contrast Utilities for WCAG AA Accessibility Compliance
 * Provides functions for calculating and validating color contrast ratios
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color (WCAG formula)
 */
export function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;
  
  // Convert to linear RGB
  const toLinear = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 
      ? normalized / 12.92 
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  
  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);
  
  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG AA Standards
 */
export const WCAG_AA_STANDARDS = {
  NORMAL_TEXT: 4.5,
  LARGE_TEXT: 3.0,
  GRAPHICAL_OBJECTS: 3.0,
  UI_COMPONENTS: 3.0,
} as const;

/**
 * WCAG AAA Standards (enhanced)
 */
export const WCAG_AAA_STANDARDS = {
  NORMAL_TEXT: 7.0,
  LARGE_TEXT: 4.5,
  GRAPHICAL_OBJECTS: 4.5,
  UI_COMPONENTS: 4.5,
} as const;

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAG_AA(
  foreground: string, 
  background: string, 
  level: 'NORMAL_TEXT' | 'LARGE_TEXT' | 'GRAPHICAL_OBJECTS' | 'UI_COMPONENTS' = 'NORMAL_TEXT'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= WCAG_AA_STANDARDS[level];
}

/**
 * Check if color combination meets WCAG AAA standards
 */
export function meetsWCAG_AAA(
  foreground: string, 
  background: string, 
  level: 'NORMAL_TEXT' | 'LARGE_TEXT' | 'GRAPHICAL_OBJECTS' | 'UI_COMPONENTS' = 'NORMAL_TEXT'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= WCAG_AAA_STANDARDS[level];
}

/**
 * Get accessibility rating for a color combination
 */
export function getAccessibilityRating(
  foreground: string, 
  background: string
): {
  ratio: number;
  AA_normal: boolean;
  AA_large: boolean;
  AAA_normal: boolean;
  AAA_large: boolean;
  rating: 'Fail' | 'AA' | 'AA Large' | 'AAA';
} {
  const ratio = getContrastRatio(foreground, background);
  
  const AA_normal = ratio >= WCAG_AA_STANDARDS.NORMAL_TEXT;
  const AA_large = ratio >= WCAG_AA_STANDARDS.LARGE_TEXT;
  const AAA_normal = ratio >= WCAG_AAA_STANDARDS.NORMAL_TEXT;
  const AAA_large = ratio >= WCAG_AAA_STANDARDS.LARGE_TEXT;
  
  let rating: 'Fail' | 'AA' | 'AA Large' | 'AAA';
  if (AAA_normal) {
    rating = 'AAA';
  } else if (AA_normal) {
    rating = 'AA';
  } else if (AA_large) {
    rating = 'AA Large';
  } else {
    rating = 'Fail';
  }
  
  return {
    ratio,
    AA_normal,
    AA_large,
    AAA_normal,
    AAA_large,
    rating,
  };
}

/**
 * Find best text color (white or black) for a given background
 */
export function getBestTextColor(backgroundColor: string): '#ffffff' | '#000000' {
  const whiteRatio = getContrastRatio('#ffffff', backgroundColor);
  const blackRatio = getContrastRatio('#000000', backgroundColor);
  
  return whiteRatio > blackRatio ? '#ffffff' : '#000000';
}

/**
 * Generate accessible color variants
 */
export function generateAccessibleColors(baseColor: string): {
  lighter: string;
  darker: string;
  withWhiteText: string;
  withBlackText: string;
} {
  const rgb = hexToRgb(baseColor);
  if (!rgb) throw new Error('Invalid color format');
  
  // Generate lighter variant (increase luminance)
  const lighter = `#${Math.min(255, Math.floor(rgb.r * 1.3)).toString(16).padStart(2, '0')}${Math.min(255, Math.floor(rgb.g * 1.3)).toString(16).padStart(2, '0')}${Math.min(255, Math.floor(rgb.b * 1.3)).toString(16).padStart(2, '0')}`;
  
  // Generate darker variant (decrease luminance)
  const darker = `#${Math.max(0, Math.floor(rgb.r * 0.7)).toString(16).padStart(2, '0')}${Math.max(0, Math.floor(rgb.g * 0.7)).toString(16).padStart(2, '0')}${Math.max(0, Math.floor(rgb.b * 0.7)).toString(16).padStart(2, '0')}`;
  
  // Determine which variant works best with white/black text
  const whiteOnBase = getContrastRatio('#ffffff', baseColor);
  const blackOnBase = getContrastRatio('#000000', baseColor);
  
  const withWhiteText = whiteOnBase >= WCAG_AA_STANDARDS.NORMAL_TEXT ? baseColor : darker;
  const withBlackText = blackOnBase >= WCAG_AA_STANDARDS.NORMAL_TEXT ? baseColor : lighter;
  
  return {
    lighter,
    darker,
    withWhiteText,
    withBlackText,
  };
}

/**
 * Validate color palette against WCAG standards
 */
export function validateColorPalette(
  colors: string[], 
  backgrounds: string[] = ['#ffffff', '#000000']
): Array<{
  color: string;
  background: string;
  isAccessible: boolean;
  ratio: number;
  improvements?: string[];
}> {
  const results: Array<{
    color: string;
    background: string;
    isAccessible: boolean;
    ratio: number;
    improvements?: string[];
  }> = [];
  
  colors.forEach(color => {
    backgrounds.forEach(background => {
      const ratio = getContrastRatio(color, background);
      const isAccessible = ratio >= WCAG_AA_STANDARDS.NORMAL_TEXT;
      
      const improvements: string[] = [];
      if (!isAccessible) {
        const bestText = getBestTextColor(background);
        improvements.push(`Use ${bestText} text on ${background} background`);
        
        if (ratio < WCAG_AA_STANDARDS.LARGE_TEXT) {
          improvements.push('Consider using larger text size');
        }
        
        const accessible = generateAccessibleColors(color);
        improvements.push(`Consider using darker variant: ${accessible.darker}`);
      }
      
      results.push({
        color,
        background,
        isAccessible,
        ratio,
        improvements: improvements.length > 0 ? improvements : undefined,
      });
    });
  });
  
  return results;
}