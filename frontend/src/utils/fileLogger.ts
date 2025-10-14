import { useEffect } from 'react';

// Automatic console logging to specific files based on page route
class AutomaticPageLogger {
  private logs: { timestamp: string; level: string; message: string; page: string }[] = [];
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
  };
  private currentPage: string = '';
  private isLogging: boolean = false;

  constructor() {
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
  }

  startLogging(page: string) {
    if (this.isLogging) {
      this.stopLogging(); // Stop previous logging
    }
    
    this.currentPage = page;
    this.isLogging = true;
    
    // Override console methods to capture logs
    console.log = (...args) => {
      this.captureLog('LOG', args);
      this.originalConsole.log(...args);
    };

    console.info = (...args) => {
      this.captureLog('INFO', args);
      this.originalConsole.info(...args);
    };

    console.warn = (...args) => {
      this.captureLog('WARN', args);
      this.originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.captureLog('ERROR', args);
      this.originalConsole.error(...args);
    };
  }

  stopLogging() {
    if (!this.isLogging) return;
    
    // Restore original console methods
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    
    // Store logs but don't auto-download (prevents Downloads panel from opening)
    this.storeLogsForPage();
    
    this.isLogging = false;
  }

  private captureLog(level: string, args: any[]) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    this.logs.push({
      timestamp,
      level,
      message,
      page: this.currentPage
    });
  }

  private storeLogsForPage() {
    if (this.logs.length === 0) return;
    
    const currentPageLogs = this.logs.filter(log => log.page === this.currentPage);
    if (currentPageLogs.length === 0) return;
    
    const filename = this.getFilenameForPage(this.currentPage);
    const content = currentPageLogs
      .map(log => `${log.timestamp} ${log.level}: ${log.message}`)
      .join('\n');
    
    // Store in sessionStorage for manual download later
    const storageKey = `logs_${this.currentPage}`;
    sessionStorage.setItem(storageKey, content);
    sessionStorage.setItem(`${storageKey}_filename`, filename);
    
    console.log(`📁 Stored ${currentPageLogs.length} log entries for ${filename} (use downloadStoredLogs() to save)`);
  }

  // Manual download method
  downloadStoredLogs(page?: string) {
    const targetPage = page || this.currentPage;
    const storageKey = `logs_${targetPage}`;
    const content = sessionStorage.getItem(storageKey);
    const filename = sessionStorage.getItem(`${storageKey}_filename`) || this.getFilenameForPage(targetPage);
    
    if (!content) {
      console.warn(`No stored logs found for page: ${targetPage}`);
      return;
    }
    
    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`📁 Downloaded ${filename} with ${content.split('\n').length} log entries`);
  }

  // Download all stored logs
  downloadAllStoredLogs() {
    const pages = ['app', 'history'];
    pages.forEach(page => {
      const storageKey = `logs_${page}`;
      if (sessionStorage.getItem(storageKey)) {
        this.downloadStoredLogs(page);
      }
    });
  }

  private getFilenameForPage(page: string): string {
    switch (page) {
      case '/app':
      case 'app':
        return 'app.log';
      case '/history':
      case 'history':
        return 'history.log';
      default:
        return `${page.replace('/', '')}.log`;
    }
  }
}

// Global instance
const pageLogger = new AutomaticPageLogger();

// Hook for React components to automatically start/stop logging
export const usePageLogging = (pageName: string) => {
  useEffect(() => {
    pageLogger.startLogging(pageName);
    
    return () => {
      pageLogger.stopLogging();
    };
  }, [pageName]);
};

// Manual control functions
export const startPageLogging = (page: string) => pageLogger.startLogging(page);
export const stopPageLogging = () => pageLogger.stopLogging();

// Manual download functions - call these when you want to download logs
export const downloadStoredLogs = (page?: string) => pageLogger.downloadStoredLogs(page);
export const downloadAllStoredLogs = () => pageLogger.downloadAllStoredLogs();