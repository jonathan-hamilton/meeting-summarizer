// Test script to understand JSON deserialization behavior
const testMeetingSummary = {
  summaryId: "test-123",
  transcriptionId: "trans-456", 
  meetingOverview: "This was a productive meeting about project planning.",
  actionItemsByRole: [
    {
      speakerId: "speaker1",
      speakerName: "John Doe",
      speakerRole: "Project Manager",
      actionItems: [
        {
          description: "Follow up on budget approval",
          isExplicitAssignment: true,
          confidence: 0.9
        }
      ]
    }
  ],
  unassignedActionItems: [],
  metadata: {
    participants: ["John Doe", "Jane Smith"],
    speakerCount: 2,
    duration: "30 minutes"
  },
  generation: {
    generatedAt: "2025-10-31T10:00:00Z",
    processingTimeMs: 5000,
    tokenCount: 1500,
    isEditable: true
  }
};

console.log("Original object:");
console.log(testMeetingSummary);

// Simulate what the backend does
const serialized = JSON.stringify(testMeetingSummary);
console.log("\nSerialized JSON:");
console.log(serialized);

// Simulate deserializing as object (like the backend currently does)
const deserializedAsObject = JSON.parse(serialized);
console.log("\nDeserialized as object:");
console.log(deserializedAsObject);
console.log("Type:", typeof deserializedAsObject);
console.log("Constructor:", deserializedAsObject.constructor.name);

// Check if properties are accessible
console.log("\nProperty access:");
console.log("meetingOverview:", deserializedAsObject.meetingOverview);
console.log("actionItemsByRole:", deserializedAsObject.actionItemsByRole);