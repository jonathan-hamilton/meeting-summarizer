import React from "react";

interface MockIconProps extends React.HTMLAttributes<HTMLDivElement> {
  "data-testid"?: string;
}

// Mock component for MUI icons
const MockIcon: React.FC<MockIconProps> = (props) => {
  const iconName = props["data-testid"] || "mock-icon";
  return <div data-testid={iconName} {...props} />;
};

export {
  MockIcon as ExpandMore,
  MockIcon as ContentCopy,
  MockIcon as Person,
  MockIcon as Schedule,
  MockIcon as VolumeUp,
  MockIcon as CheckCircle,
  MockIcon as Error,
  MockIcon as CloudUpload,
  MockIcon as Delete,
  MockIcon as Refresh,
};
