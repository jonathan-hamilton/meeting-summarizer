/**
 * Test Component - Verify test setup works
 */

import React from "react";

export const TestComponent: React.FC<{ message: string }> = ({ message }) => {
  console.log("DEBUG: TestComponent rendering with message:", message);
  return <div data-testid="test-component">{message}</div>;
};
