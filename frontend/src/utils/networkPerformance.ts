// Network Performance Utilities for Mobile Optimization
// Detects connection speed and provides adaptive loading strategies

export interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // ms
  isSlowConnection: boolean;
  isFastConnection: boolean;
}

export interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
}

/**
 * Get current network information using Network Information API
 * Falls back to estimations based on performance if API unavailable
 */
export function getNetworkInfo(): NetworkInfo {
  // Check if Network Information API is available
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;

  if (connection) {
    const effectiveType = connection.effectiveType || 'unknown';
    const downlink = connection.downlink || 0;
    const rtt = connection.rtt || 0;

    return {
      effectiveType,
      downlink,
      rtt,
      isSlowConnection: effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 1.5,
      isFastConnection: effectiveType === '4g' && downlink > 10
    };
  }

  // Fallback: estimate based on performance timing
  const performanceInfo = estimateConnectionFromTiming();
  return {
    effectiveType: performanceInfo.effectiveType,
    downlink: performanceInfo.downlink,
    rtt: performanceInfo.rtt,
    isSlowConnection: performanceInfo.isSlowConnection,
    isFastConnection: performanceInfo.isFastConnection
  };
}

/**
 * Estimate connection speed from performance timing
 */
function estimateConnectionFromTiming(): NetworkInfo {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navigation) {
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      isSlowConnection: false,
      isFastConnection: false
    };
  }

  const domContentLoadedTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;

  // Rough estimation based on load times
  let effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown' = 'unknown';
  let downlink = 0;
  let rtt = 0;

  if (domContentLoadedTime > 10000) {
    effectiveType = 'slow-2g';
    downlink = 0.5;
    rtt = 2000;
  } else if (domContentLoadedTime > 5000) {
    effectiveType = '2g';
    downlink = 1.0;
    rtt = 1400;
  } else if (domContentLoadedTime > 2000) {
    effectiveType = '3g';
    downlink = 2.5;
    rtt = 400;
  } else {
    effectiveType = '4g';
    downlink = 10.0;
    rtt = 100;
  }

  return {
    effectiveType,
    downlink,
    rtt,
    isSlowConnection: effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 1.5,
    isFastConnection: effectiveType === '4g' && downlink > 10
  };
}

/**
 * Get comprehensive performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paintEntries = performance.getEntriesByType('paint');
  
  const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
  
  // Try to get LCP from observer if available
  let lcp = 0;
  try {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
  } catch (e) {
    // LCP not available in all browsers
  }

  return {
    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
    loadComplete: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
    firstContentfulPaint: fcp,
    largestContentfulPaint: lcp,
    timeToInteractive: estimateTimeToInteractive()
  };
}

/**
 * Estimate Time to Interactive (simplified version)
 */
function estimateTimeToInteractive(): number {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) return 0;
  
  // Simplified TTI estimation: DOMContentLoaded + some buffer for JS execution
  return navigation.domContentLoadedEventEnd - navigation.fetchStart + 500;
}

/**
 * Check if current performance meets 3G requirements
 * Target: <3 seconds on 3G networks (1.6 Mbps)
 */
export function validate3GPerformance(): {
  passes: boolean;
  metrics: PerformanceMetrics;
  networkInfo: NetworkInfo;
  recommendations: string[];
} {
  const metrics = getPerformanceMetrics();
  const networkInfo = getNetworkInfo();
  const recommendations: string[] = [];

  // 3G performance targets
  const targets = {
    domContentLoaded: 3000, // 3 seconds
    loadComplete: 5000, // 5 seconds
    firstContentfulPaint: 2000, // 2 seconds
    largestContentfulPaint: 3000, // 3 seconds
    timeToInteractive: 4000 // 4 seconds
  };

  let passes = true;

  // Check each metric
  if (metrics.domContentLoaded > targets.domContentLoaded) {
    passes = false;
    recommendations.push(`DOMContentLoaded is ${Math.round(metrics.domContentLoaded)}ms (target: ${targets.domContentLoaded}ms)`);
  }

  if (metrics.firstContentfulPaint > targets.firstContentfulPaint) {
    passes = false;
    recommendations.push(`First Contentful Paint is ${Math.round(metrics.firstContentfulPaint)}ms (target: ${targets.firstContentfulPaint}ms)`);
  }

  if (metrics.largestContentfulPaint > 0 && metrics.largestContentfulPaint > targets.largestContentfulPaint) {
    passes = false;
    recommendations.push(`Largest Contentful Paint is ${Math.round(metrics.largestContentfulPaint)}ms (target: ${targets.largestContentfulPaint}ms)`);
  }

  if (metrics.timeToInteractive > targets.timeToInteractive) {
    passes = false;
    recommendations.push(`Time to Interactive is ${Math.round(metrics.timeToInteractive)}ms (target: ${targets.timeToInteractive}ms)`);
  }

  // Add positive feedback if performance is good
  if (passes) {
    recommendations.push('✅ All 3G performance targets met!');
    if (metrics.domContentLoaded < 1500) {
      recommendations.push('🚀 Exceptional performance - faster than 4G targets!');
    }
  }

  return {
    passes,
    metrics,
    networkInfo,
    recommendations
  };
}

/**
 * Network-aware loading strategy
 * Returns recommendations for resource loading based on connection
 */
export function getLoadingStrategy(networkInfo: NetworkInfo): {
  preloadCritical: boolean;
  lazyLoadImages: boolean;
  deferNonCritical: boolean;
  reduceQuality: boolean;
  batchRequests: boolean;
} {
  if (networkInfo.isSlowConnection) {
    return {
      preloadCritical: false, // Don't preload on slow connections
      lazyLoadImages: true,
      deferNonCritical: true,
      reduceQuality: true,
      batchRequests: true
    };
  }

  if (networkInfo.isFastConnection) {
    return {
      preloadCritical: true, // Aggressive preloading on fast connections
      lazyLoadImages: false,
      deferNonCritical: false,
      reduceQuality: false,
      batchRequests: false
    };
  }

  // Default strategy for moderate connections (3G/4G)
  return {
    preloadCritical: true,
    lazyLoadImages: true,
    deferNonCritical: false,
    reduceQuality: false,
    batchRequests: false
  };
}

/**
 * Log performance metrics for monitoring
 */
export function logPerformanceMetrics(): void {
  const metrics = getPerformanceMetrics();
  const networkInfo = getNetworkInfo();
  const validation = validate3GPerformance();

  console.group('📊 S8.6 Mobile Performance Metrics');
  console.log('🌐 Network Info:', networkInfo);
  console.log('⏱️ Performance Metrics:', {
    'DOM Content Loaded': `${Math.round(metrics.domContentLoaded)}ms`,
    'Load Complete': `${Math.round(metrics.loadComplete)}ms`,
    'First Contentful Paint': `${Math.round(metrics.firstContentfulPaint)}ms`,
    'Largest Contentful Paint': `${Math.round(metrics.largestContentfulPaint)}ms`,
    'Time to Interactive': `${Math.round(metrics.timeToInteractive)}ms`
  });
  console.log('✅ 3G Validation:', validation.passes ? 'PASSED' : 'NEEDS IMPROVEMENT');
  if (validation.recommendations.length > 0) {
    console.log('💡 Recommendations:', validation.recommendations);
  }
  console.groupEnd();
}

/**
 * Calculate estimated bundle size impact on different network speeds
 */
export function calculateNetworkImpact(bundleSize: number): {
  speed2G: number;
  speed3G: number;
  speed4G: number;
  speedFast: number;
} {
  // Convert KB to bits for calculation
  const bundleBits = bundleSize * 1024 * 8;
  
  return {
    speed2G: bundleBits / (250 * 1000), // ~250 Kbps effective
    speed3G: bundleBits / (1.6 * 1000 * 1000), // ~1.6 Mbps effective  
    speed4G: bundleBits / (10 * 1000 * 1000), // ~10 Mbps effective
    speedFast: bundleBits / (50 * 1000 * 1000) // ~50 Mbps effective
  };
}