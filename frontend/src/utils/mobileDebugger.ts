/**
 * Mobile debugging utility for testing device detection and file upload functionality
 * Since console logs are not available on mobile devices, this sends debug info to the server
 */

import { getDeviceInfo } from './deviceDetection';

const API_BASE_URL = window.location.hostname === 'localhost' && window.location.port === '5173'
  ? 'http://localhost:5029/api'
  : '/api';

interface MobileDebugData {
  deviceType?: string;
  platform?: string;
  browser?: string;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  componentRendered?: string;
  message?: string;
  timestamp: string;
}

/**
 * Send mobile debug information to server for logging
 * This replaces console.log for mobile devices where dev tools aren't available
 */
export const logMobileDebug = async (message: string, componentName?: string): Promise<void> => {
  try {
    // Gather comprehensive device information
    const deviceInfo = getDeviceInfo();
    
    const debugData: MobileDebugData = {
      deviceType: deviceInfo.platform,
      platform: deviceInfo.platform,
      browser: deviceInfo.browser,
      isTouchDevice: 'ontouchstart' in window,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      componentRendered: componentName,
      message,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(`${API_BASE_URL}/environment/mobile-debug`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(debugData)
    });

    if (!response.ok) {
      console.warn('Failed to send mobile debug log to server:', response.statusText);
    }
  } catch (error) {
    console.warn('Mobile debug logging failed:', error);
  }
};

/**
 * Log device detection results for mobile debugging
 */
export const logDeviceDetection = async (): Promise<void> => {
  const deviceInfo = getDeviceInfo();
  const userAgent = navigator.userAgent;
  
  const detectionMessage = `Device detection - Platform: ${deviceInfo.platform}, Browser: ${deviceInfo.browser}, Mobile: ${deviceInfo.isMobile}, Touch: ${'ontouchstart' in window}`;
  
  await logMobileDebug(`${detectionMessage} | UserAgent: ${userAgent}`, 'DeviceDetection');
};

/**
 * Log file upload component routing for mobile debugging
 */
export const logComponentRouting = async (componentName: string, reason: string): Promise<void> => {
  await logMobileDebug(`Routing to ${componentName}: ${reason}`, componentName);
};

/**
 * Log file selection events for mobile debugging
 */
export const logFileSelection = async (fileName: string, fileSize: number, componentName: string): Promise<void> => {
  const message = `File selected - Name: ${fileName}, Size: ${Math.round(fileSize / 1024 / 1024 * 100) / 100}MB`;
  await logMobileDebug(message, componentName);
};

/**
 * Log file upload errors for mobile debugging
 */
export const logFileUploadError = async (error: string, componentName: string): Promise<void> => {
  await logMobileDebug(`File upload error: ${error}`, componentName);
};

/**
 * Log file upload progress for mobile debugging
 */
export const logFileUploadProgress = async (progress: number, componentName: string): Promise<void> => {
  if (progress === 0 || progress === 25 || progress === 50 || progress === 75 || progress === 95 || progress === 100) {
    await logMobileDebug(`Upload progress: ${progress}%`, componentName);
  }
};

/**
 * Initialize mobile debugging - call this when the file upload component mounts
 */
export const initializeMobileDebug = async (componentName: string): Promise<void> => {
  await logDeviceDetection();
  await logMobileDebug(`Component ${componentName} mounted and ready`, componentName);
};