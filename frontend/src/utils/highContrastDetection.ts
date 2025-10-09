/**
 * High Contrast Mode Detection Utility
 * S6.6 Increment 5: Color & Visual Accessibility
 * Detects and manages high contrast mode for WCAG 2.1 AA compliance
 */

/**
 * Detect if Windows High Contrast mode is active
 */
export const detectWindowsHighContrast = (): boolean => {
  // Method 1: Check if forced-colors media query is supported and active
  if (window.matchMedia && window.matchMedia('(forced-colors: active)').matches) {
    return true;
  }
  
  // Method 2: Check for Windows -ms-high-contrast media query
  if (window.matchMedia && window.matchMedia('(-ms-high-contrast: active)').matches) {
    return true;
  }
  
  // Method 3: Check for prefers-contrast: high (modern browsers)
  if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
    return true;
  }
  
  // Method 4: Canvas test - create a test element to detect forced colors
  try {
    const testDiv = document.createElement('div');
    testDiv.style.backgroundColor = 'rgb(31, 32, 33)';
    testDiv.style.color = 'rgb(31, 32, 33)';
    testDiv.style.position = 'absolute';
    testDiv.style.left = '-9999px';
    testDiv.style.width = '1px';
    testDiv.style.height = '1px';
    document.body.appendChild(testDiv);
    
    const computedStyle = window.getComputedStyle(testDiv);
    const backgroundColor = computedStyle.backgroundColor;
    const textColor = computedStyle.color;
    
    document.body.removeChild(testDiv);
    
    // In high contrast mode, the browser will override these colors
    // If they're different from what we set, high contrast is likely active
    const isHighContrast = backgroundColor !== 'rgb(31, 32, 33)' || textColor !== 'rgb(31, 32, 33)';
    
    return isHighContrast;
  } catch (error) {
    console.warn('High contrast detection test failed:', error);
    return false;
  }
};

/**
 * Apply high contrast styles to the document
 */
export const enableHighContrastMode = (): void => {
  document.body.classList.add('high-contrast-enabled');
  document.documentElement.style.setProperty('forced-color-adjust', 'none');
  
  // Dispatch custom event for components to react to high contrast mode
  window.dispatchEvent(new CustomEvent('highContrastModeChanged', { detail: { enabled: true } }));
  
  console.log('🎯 High contrast mode enabled');
};

/**
 * Remove high contrast styles from the document
 */
export const disableHighContrastMode = (): void => {
  document.body.classList.remove('high-contrast-enabled');
  document.documentElement.style.removeProperty('forced-color-adjust');
  
  // Dispatch custom event for components to react to high contrast mode
  window.dispatchEvent(new CustomEvent('highContrastModeChanged', { detail: { enabled: false } }));
  
  console.log('🎯 High contrast mode disabled');
};

/**
 * Initialize high contrast detection and apply styles if needed
 */
export const initializeHighContrastDetection = (): void => {
  const isHighContrast = detectWindowsHighContrast();
  
  if (isHighContrast) {
    enableHighContrastMode();
  }
  
  // Listen for changes in high contrast mode
  const mediaQueries = [
    '(forced-colors: active)',
    '(-ms-high-contrast: active)',
    '(prefers-contrast: high)'
  ];
  
  mediaQueries.forEach(query => {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addListener((e) => {
        if (e.matches) {
          enableHighContrastMode();
        } else {
          // Only disable if no other high contrast indicators are present
          if (!detectWindowsHighContrast()) {
            disableHighContrastMode();
          }
        }
      });
    }
  });
  
  console.log('🎯 High contrast detection initialized:', { isHighContrast });
};

/**
 * Check if high contrast mode is currently active
 */
export const isHighContrastModeActive = (): boolean => {
  return document.body.classList.contains('high-contrast-enabled') || detectWindowsHighContrast();
};