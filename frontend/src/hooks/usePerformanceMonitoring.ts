import { useEffect, useState, useCallback } from 'react';
import { 
  getNetworkInfo, 
  getPerformanceMetrics, 
  validate3GPerformance,
  logPerformanceMetrics,
  calculateNetworkImpact,
  type NetworkInfo, 
  type PerformanceMetrics 
} from '../utils/networkPerformance';

export interface PerformanceState {
  networkInfo: NetworkInfo | null;
  metrics: PerformanceMetrics | null;
  validation: {
    passes: boolean;
    recommendations: string[];
  } | null;
  isLoading: boolean;
  bundleImpact: {
    speed2G: number;
    speed3G: number;
    speed4G: number;
    speedFast: number;
  } | null;
}

/**
 * Hook for monitoring mobile performance and network conditions
 * Implements S8.6 Increment 4 network-aware optimization
 */
export function usePerformanceMonitoring(enableLogging = false) {
  const [state, setState] = useState<PerformanceState>({
    networkInfo: null,
    metrics: null,
    validation: null,
    isLoading: true,
    bundleImpact: null
  });

  // Main bundle size in KB (from our optimization results)
  const MAIN_BUNDLE_SIZE = 194.76; // Current optimized size

  const measurePerformance = useCallback(() => {
    try {
      const networkInfo = getNetworkInfo();
      const metrics = getPerformanceMetrics();
      const validation = validate3GPerformance();
      const bundleImpact = calculateNetworkImpact(MAIN_BUNDLE_SIZE);

      setState({
        networkInfo,
        metrics,
        validation: {
          passes: validation.passes,
          recommendations: validation.recommendations
        },
        isLoading: false,
        bundleImpact
      });

      if (enableLogging) {
        logPerformanceMetrics();
      }

      return {
        networkInfo,
        metrics,
        validation,
        bundleImpact
      };
    } catch (error) {
      console.warn('Performance monitoring error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [enableLogging]);

  // Initial measurement after DOM is loaded
  useEffect(() => {
    // Wait for page to be fully loaded before measuring
    if (document.readyState === 'loading') {
      const handleLoad = () => {
        // Small delay to ensure all resources are loaded
        setTimeout(measurePerformance, 1000);
      };
      
      window.addEventListener('load', handleLoad, { once: true });
      return () => window.removeEventListener('load', handleLoad);
    } else {
      // Page already loaded (interactive or complete)
      setTimeout(measurePerformance, document.readyState === 'complete' ? 500 : 1000);
    }
  }, [measurePerformance]);

  // Monitor network changes
  useEffect(() => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      const handleNetworkChange = () => {
        const networkInfo = getNetworkInfo();
        setState(prev => ({
          ...prev,
          networkInfo,
          bundleImpact: calculateNetworkImpact(MAIN_BUNDLE_SIZE)
        }));

        if (enableLogging) {
          console.log('🌐 Network condition changed:', networkInfo);
        }
      };

      connection.addEventListener('change', handleNetworkChange);
      return () => connection.removeEventListener('change', handleNetworkChange);
    }
  }, [enableLogging]);

  const remeasure = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    setTimeout(measurePerformance, 100);
  }, [measurePerformance]);

  return {
    ...state,
    remeasure,
    isSlowConnection: state.networkInfo?.isSlowConnection || false,
    isFastConnection: state.networkInfo?.isFastConnection || false,
    estimated3GLoadTime: state.bundleImpact?.speed3G || 0
  };
}

/**
 * Hook for network-aware resource loading strategies
 */
export function useNetworkAwareLoading() {
  const { networkInfo, isSlowConnection, isFastConnection } = usePerformanceMonitoring();

  const loadingStrategy = {
    // Preload critical resources only on fast connections
    shouldPreloadCritical: isFastConnection,
    
    // Lazy load images on slow connections
    shouldLazyLoadImages: isSlowConnection,
    
    // Defer non-critical resources on slow connections
    shouldDeferNonCritical: isSlowConnection,
    
    // Reduce quality on very slow connections
    shouldReduceQuality: networkInfo?.effectiveType === '2g' || networkInfo?.effectiveType === 'slow-2g',
    
    // Batch requests on slow connections
    shouldBatchRequests: isSlowConnection,
    
    // Network type for conditional rendering
    networkType: networkInfo?.effectiveType || 'unknown'
  };

  return loadingStrategy;
}

/**
 * Hook for performance validation alerts
 */
export function usePerformanceValidation() {
  const { validation, metrics, networkInfo } = usePerformanceMonitoring();

  const getPerformanceGrade = (): 'A' | 'B' | 'C' | 'D' | 'F' => {
    if (!metrics) return 'F';
    
    const domLoadTime = metrics.domContentLoaded;
    
    if (domLoadTime < 1000) return 'A'; // Excellent
    if (domLoadTime < 2000) return 'B'; // Good  
    if (domLoadTime < 3000) return 'C'; // Acceptable
    if (domLoadTime < 5000) return 'D'; // Poor
    return 'F'; // Very poor
  };

  const getOptimizationSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    if (!metrics || !networkInfo) return suggestions;

    if (metrics.domContentLoaded > 3000) {
      suggestions.push('Consider further code splitting');
    }
    
    if (metrics.firstContentfulPaint > 2000) {
      suggestions.push('Optimize critical rendering path');
    }
    
    if (networkInfo.isSlowConnection && metrics.loadComplete > 5000) {
      suggestions.push('Implement progressive loading for slow connections');
    }

    return suggestions;
  };

  return {
    passes: validation?.passes || false,
    grade: getPerformanceGrade(),
    recommendations: validation?.recommendations || [],
    suggestions: getOptimizationSuggestions(),
    isValidated: validation !== null
  };
}