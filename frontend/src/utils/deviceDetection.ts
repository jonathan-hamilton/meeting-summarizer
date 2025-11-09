// Enhanced Mobile Device Detection System
// Supports iOS Safari, Android Chrome, Samsung Internet, and other mobile browsers

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  browser: 'safari' | 'chrome' | 'samsung' | 'firefox' | 'edge' | 'other';
  isMobile: boolean;
  isTablet: boolean;
  requiresSpecialHandling: boolean;
  uploadStrategy: 'ios-safari' | 'android-mobile' | 'standard';
}

export interface BrowserCapabilities {
  supportsFileAPI: boolean;
  supportsMultipleFiles: boolean;
  supportsDragAndDrop: boolean;
  requiresVisibleInput: boolean;
  acceptAttributeWorking: boolean;
  maxFileSize: number; // in bytes
  recommendedFileFormats: string[];
}

/**
 * Comprehensive device and browser detection
 * Returns detailed information about the user's environment
 */
export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  // iOS Detection
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isIOSSafari = isIOS && /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  
  // Android Detection  
  const isAndroid = /Android/.test(userAgent);
  const isAndroidChrome = isAndroid && /Chrome/.test(userAgent) && !/Edg/.test(userAgent);
  const isSamsungBrowser = isAndroid && /SamsungBrowser/.test(userAgent);
  
  // Tablet Detection (larger screens, typically >768px)
  const isTablet = (isIOS && /iPad/.test(userAgent)) || 
                  (isAndroid && !/Mobile/.test(userAgent)) ||
                  (window.screen && window.screen.width >= 768);
  
  // Mobile Detection
  const isMobile = isIOS || isAndroid || 
                   /Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Platform Detection
  let platform: DeviceInfo['platform'] = 'unknown';
  if (isIOS) platform = 'ios';
  else if (isAndroid) platform = 'android';
  else if (!isMobile) platform = 'desktop';
  
  // Browser Detection  
  let browser: DeviceInfo['browser'] = 'other';
  if (isIOSSafari) browser = 'safari';
  else if (isSamsungBrowser) browser = 'samsung';
  else if (/Chrome/.test(userAgent)) browser = 'chrome';
  else if (/Firefox/.test(userAgent)) browser = 'firefox';
  else if (/Edg/.test(userAgent)) browser = 'edge';
  
  // Determine if special handling is required
  const requiresSpecialHandling = isIOSSafari || isAndroidChrome || isSamsungBrowser;
  
  // Determine upload strategy
  let uploadStrategy: DeviceInfo['uploadStrategy'] = 'standard';
  if (isIOSSafari) uploadStrategy = 'ios-safari';
  else if (isAndroidChrome || isSamsungBrowser) uploadStrategy = 'android-mobile';
  
  return {
    platform,
    browser,
    isMobile,
    isTablet,
    requiresSpecialHandling,
    uploadStrategy,
  };
}

/**
 * Get browser-specific capabilities for file upload
 */
export function getBrowserCapabilities(deviceInfo: DeviceInfo): BrowserCapabilities {
  const { platform, browser } = deviceInfo;
  
  // iOS Safari specific limitations
  if (platform === 'ios' && browser === 'safari') {
    return {
      supportsFileAPI: true,
      supportsMultipleFiles: false, // iOS Safari has issues with multiple files
      supportsDragAndDrop: false, // Touch devices don't support drag/drop
      requiresVisibleInput: true, // iOS Safari requires visible file input
      acceptAttributeWorking: true, // Works with specific MIME types
      maxFileSize: 200 * 1024 * 1024, // 200MB (conservative for mobile)
      recommendedFileFormats: ['audio/mp3', 'audio/mp4', 'audio/wav', 'audio/m4a'],
    };
  }
  
  // Android Chrome/Samsung Browser
  if (platform === 'android' && (browser === 'chrome' || browser === 'samsung')) {
    return {
      supportsFileAPI: true,
      supportsMultipleFiles: true, // Android browsers generally support multiple files
      supportsDragAndDrop: false, // Touch devices don't support drag/drop  
      requiresVisibleInput: false, // Can use hidden input with programmatic trigger
      acceptAttributeWorking: true, // Modern Android browsers support accept attribute
      maxFileSize: 500 * 1024 * 1024, // 500MB (Android typically has more RAM)
      recommendedFileFormats: ['audio/*', 'video/mp4', 'video/webm'], // Broader support
    };
  }
  
  // Desktop/Standard browsers
  return {
    supportsFileAPI: true,
    supportsMultipleFiles: true,
    supportsDragAndDrop: true,
    requiresVisibleInput: false,
    acceptAttributeWorking: true,
    maxFileSize: 1024 * 1024 * 1024, // 1GB for desktop
    recommendedFileFormats: ['audio/*', 'video/*'],
  };
}

/**
 * Log device and browser information for debugging
 */
export function logDeviceInfo(): void {
  const deviceInfo = getDeviceInfo();
  const capabilities = getBrowserCapabilities(deviceInfo);
  
  console.log('📱 Device Detection Results:', {
    userAgent: navigator.userAgent,
    deviceInfo,
    capabilities,
    windowSize: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    touchSupport: 'ontouchstart' in window,
  });
}

/**
 * Quick detection functions for common use cases
 */
export function isIOSSafari(): boolean {
  return getDeviceInfo().uploadStrategy === 'ios-safari';
}

export function isAndroidMobile(): boolean {
  return getDeviceInfo().uploadStrategy === 'android-mobile';
}

export function requiresMobileOptimization(): boolean {
  return getDeviceInfo().requiresSpecialHandling;
}

/**
 * Get user-friendly device description for error messages and analytics
 */
export function getDeviceDescription(deviceInfo?: DeviceInfo): string {
  const info = deviceInfo || getDeviceInfo();
  
  const platformNames = {
    ios: 'iOS',
    android: 'Android', 
    desktop: 'Desktop',
    unknown: 'Unknown Device',
  };
  
  const browserNames = {
    safari: 'Safari',
    chrome: 'Chrome',
    samsung: 'Samsung Internet',
    firefox: 'Firefox',
    edge: 'Edge',
    other: 'Other Browser',
  };
  
  return `${platformNames[info.platform]} ${browserNames[info.browser]}${info.isTablet ? ' (Tablet)' : info.isMobile ? ' (Mobile)' : ''}`;
}