import React, { Profiler } from "react";

/**
 * Performance Profiler Wrapper Component
 * Use this to measure render performance of optimized components
 */
interface PerformanceProfilerProps {
  id: string;
  children: React.ReactNode;
  onRender?: (
    id: string,
    phase: "mount" | "update",
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => void;
}

const defaultOnRender: PerformanceProfilerProps["onRender"] = (
  id,
  phase,
  actualDuration,
  baseDuration
) => {
  console.group(`🔍 Performance: ${id}`);
  console.log(`Phase: ${phase}`);
  console.log(`Actual Duration: ${actualDuration.toFixed(2)}ms`);
  console.log(`Base Duration: ${baseDuration.toFixed(2)}ms`);
  if (actualDuration > baseDuration * 2) {
    console.warn("⚠️ Slow render detected!");
  }
  console.groupEnd();
};

export const PerformanceProfiler: React.FC<PerformanceProfilerProps> = ({
  id,
  children,
  onRender = defaultOnRender,
}) => {
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
};

/**
 * Hook for measuring component performance
 */
export const usePerformanceTimer = (componentName: string) => {
  const startTime = React.useRef<number>(0);

  React.useEffect(() => {
    startTime.current = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      console.log(`📊 ${componentName} render time: ${duration.toFixed(2)}ms`);
    };
  });
};

/**
 * Performance comparison utility
 */
export const comparePerformance = (
  originalComponent: React.ReactNode,
  optimizedComponent: React.ReactNode,
  testProps: any
) => {
  const results = {
    original: { renders: 0, totalTime: 0 },
    optimized: { renders: 0, totalTime: 0 },
  };

  const originalProfiler = (
    <PerformanceProfiler
      id="original"
      onRender={(id, phase, actualDuration) => {
        results.original.renders++;
        results.original.totalTime += actualDuration;
      }}
    >
      {originalComponent}
    </PerformanceProfiler>
  );

  const optimizedProfiler = (
    <PerformanceProfiler
      id="optimized"
      onRender={(id, phase, actualDuration) => {
        results.optimized.renders++;
        results.optimized.totalTime += actualDuration;
      }}
    >
      {optimizedComponent}
    </PerformanceProfiler>
  );

  return { originalProfiler, optimizedProfiler, results };
};
