import type { 
  TranscriptionResponse, 
  HealthStatus, 
  DetailedHealthStatus,
  SpeakerMapping,
  MeetingSummary,
  MeetingSummaryRequest,
  ApiResponse
} from '../types';

/**
 * Demo API Service - Provides mock responses for demo mode
 * Prevents real API calls an  async sendSummaryEmail(transcriptionId: string, emailData: any): Promise<void> {
    await this.mockDelay(500);
    // In demo mode, just simulate the email send
    console.log('Demo mode: Email simulated', { transcriptionId, emailData });
  }

  getBaseURL(): string {
    return 'http://demo-api.localhost:5000';
  }
} operations in demo mode
 */
class DemoApiService {
  private mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async uploadFile(_file: File): Promise<ApiResponse<TranscriptionResponse>> {
    // In demo mode, don't actually upload the file
    // Just simulate the process with mock data
    
    // Simulate upload delay
    await this.mockDelay(1000);
    
    const mockResponse: TranscriptionResponse = {
      transcriptionId: 'demo-transcript-1',
      fileName: 'mock-transcript.wav', // Always use mock filename
      fileSize: 1024000,
      status: 'completed',
      transcribedText: 'Welcome to our meeting. My name is Sarah Johnson, and I\'m the product manager. Today we\'ll be discussing our Q4 roadmap with Mike Chen, our senior developer, and Lisa Wang, our UX designer.',
      speakerSegments: [
        {
          speaker: 'Speaker 1',
          text: 'Welcome to our meeting. My name is Sarah Johnson, and I\'m the product manager.',
          start: 0,
          end: 4.5,
          confidence: 0.95
        },
        {
          speaker: 'Speaker 2', 
          text: 'Thanks Sarah. Mike Chen here, senior developer. Ready to dive into the technical requirements.',
          start: 5.0,
          end: 9.2,
          confidence: 0.92
        },
        {
          speaker: 'Speaker 3',
          text: 'Hi everyone, Lisa Wang, UX designer. I have some exciting mockups to share.',
          start: 9.8,
          end: 13.5,
          confidence: 0.89
        },
        {
          speaker: 'Speaker 4',
          text: 'Great! Let me add some technical context for the Q4 roadmap.',
          start: 14.0,
          end: 17.2,
          confidence: 0.88
        }
      ],
      processingTimeMs: 2500,
      createdAt: new Date().toISOString(),
      speakerCount: 4,
      hasSpeakerDiarization: true,
      speakerMappings: [
        { 
          speakerId: 'Speaker 1', 
          name: 'Sarah Johnson', 
          role: 'Product Manager', 
          transcriptionId: 'demo-transcript-1',
          source: 'AutoDetected' as const,
          email: 'speaker1@test.com'
        },
        { 
          speakerId: 'Speaker 2', 
          name: 'Mike Chen', 
          role: 'Senior Developer', 
          transcriptionId: 'demo-transcript-1',
          source: 'AutoDetected' as const,
          email: 'mike.chen@company.com'
        },
        { 
          speakerId: 'Speaker 3', 
          name: 'Lisa Wang', 
          role: 'UX Designer', 
          transcriptionId: 'demo-transcript-1',
          source: 'AutoDetected' as const,
          email: 'lisa.wang@company.com'
        }
      ]
    };
    
    return {
      data: mockResponse,
      success: true
    };
  }

  async getTranscriptionStatus(_transcriptionId: string): Promise<TranscriptionResponse> {
    await this.mockDelay(500);
    
    // Return mock completed status
    const response = await this.uploadFile(new File([], 'mock-transcript.wav'));
    if (!response.data) {
      throw new Error('Failed to get transcription status');
    }
    return response.data;
  }

  async getHealthStatus(): Promise<HealthStatus> {
    await this.mockDelay(300);
    
    return {
      status: 'Healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0-demo',
      service: 'Demo Mode',
      environment: 'Demo'
    };
  }

  async getHealth(): Promise<ApiResponse<HealthStatus>> {
    // Alias for getHealthStatus to match real API interface
    const healthStatus = await this.getHealthStatus();
    return {
      data: healthStatus,
      success: true
    };
  }

  async getDetailedHealthStatus(): Promise<DetailedHealthStatus> {
    await this.mockDelay(500);
    
    return {
      status: 'Healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0-demo',
      service: 'Demo Mode',
      environment: 'Demo',
      upTime: 86400000, // 24 hours in ms
      machineName: 'demo-server',
      processorCount: 4,
      workingSet: 134217728, // 128 MB in bytes
      dependencies: {
        openAI: 'Simulated',
        database: 'Simulated'
      }
    };
  }

    async getDetailedHealth(): Promise<ApiResponse<DetailedHealthStatus>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      data: {
        status: "Healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0-demo",
        service: "Demo API Service",
        environment: "demo",
        upTime: 123456,
        machineName: "demo-server",
        processorCount: 4,
        workingSet: 256000000,
        dependencies: {
          openAI: "Connected",
          database: "Connected"
        }
      },
      success: true
    };
  }

  async getOpenAIStatus(): Promise<ApiResponse<{ isEnabled: boolean; mode: string; message: string }>> {
    await this.mockDelay(200);
    return {
      data: {
        isEnabled: true,
        mode: 'demo',
        message: 'Demo mode - using mock AI responses'
      },
      success: true
    };
  }

  async toggleOpenAI(enabled: boolean): Promise<ApiResponse<{ isEnabled: boolean; mode: string; message: string }>> {
    await this.mockDelay(100);
    return {
      data: {
        isEnabled: enabled,
        mode: 'demo',
        message: `Demo mode: OpenAI ${enabled ? 'enabled' : 'disabled'} (simulated)`
      },
      success: true
    };
  }

  async updateSpeakerMappings(transcriptionId: string, mappings: SpeakerMapping[]): Promise<void> {
    await this.mockDelay(200);
    // In demo mode, just simulate the API call
    console.log('Demo mode: Speaker mappings updated', { transcriptionId, mappings });
  }

  async generateSummary(_transcriptionId: string, _transcriptText: string): Promise<string> {
    await this.mockDelay(2000); // Simulate summary generation time
    
    return `## Meeting Summary (Demo)

**Date:** ${new Date().toLocaleDateString()}
**Participants:** Speaker 1, Speaker 2, Speaker 3

### Key Discussion Points
- Q4 roadmap planning and prioritization
- Technical requirements review
- UX design mockups presentation

### Action Items
- **Speaker 1:** Finalize Q4 roadmap priorities by Friday
- **Speaker 2:** Review technical feasibility of proposed features
- **Speaker 3:** Share updated mockups with the team

### Next Steps
- Schedule follow-up meeting for next week
- Review implementation timeline
- Coordinate with stakeholders

*This is a demo summary generated for demonstration purposes.*`;
  }

  async generateMeetingSummary(request: MeetingSummaryRequest): Promise<ApiResponse<MeetingSummary>> {
    await this.mockDelay(2000); // Simulate processing time
    
    // Process the actual transcript and speaker mappings instead of using hardcoded data
    const { SpeakerMappings: speakerMappings } = request;
    
    // Extract speakers from the mappings (this ensures we use the same speakers as the transcript)
    const speakers = speakerMappings.map(mapping => ({
      id: mapping.speakerId,
      name: mapping.name || mapping.speakerId,
      role: mapping.role || ''
    }));
    
    // Generate action items based on the actual speakers
    const actionItemsByRole = speakers.map(speaker => ({
      speakerId: speaker.id,
      speakerName: speaker.name,
      speakerRole: speaker.role,
      actionItems: [
        { 
          description: `Complete assigned tasks for ${speaker.name}`, 
          isExplicitAssignment: true, 
          confidence: 0.90 + Math.random() * 0.09 // Random confidence between 0.90-0.99
        },
        { 
          description: `Follow up on discussion points from ${speaker.name}`, 
          isExplicitAssignment: false, 
          confidence: 0.75 + Math.random() * 0.15 // Random confidence between 0.75-0.90
        }
      ]
    }));
    
    const mockSummary: MeetingSummary = {
      summaryId: 'demo-summary-' + Date.now(),
      transcriptionId: 'demo-transcription-123',
      meetingOverview: 'Daily standup meeting where the development team shared progress updates on the login feature, API integration, UI improvements, and deployment activities. Key blockers identified around API documentation and missing credentials.',
      actionItemsByRole,
      unassignedActionItems: [
        { description: 'Resolve API documentation blocker', confidence: 0.70, reason: 'Requires coordination with external team' },
        { description: 'Schedule follow-up on login page completion', confidence: 0.65, reason: 'Timeline dependent on API integration' }
      ],
      metadata: {
        participants: speakers.map(s => s.name),
        speakerCount: speakers.length,
        duration: '40s'
      },
      generation: {
        generatedAt: new Date().toISOString(),
        processingTimeMs: 2000,
        tokenCount: 450,
        isEditable: true
      }
    };

    const response = {
      success: true,
      data: mockSummary,
      message: 'Demo meeting summary generated successfully'
    };
    
    return response;
  }

  async sendSummaryEmail(transcriptionId: string, emailData: any): Promise<void> {
    await this.mockDelay(1000);
    // In demo mode, just simulate the email send
    console.log('Demo mode: Email simulated', { transcriptionId, emailData });
  }

  getBaseURL(): string {
    return 'http://demo-api.localhost:5000';
  }
}

export default new DemoApiService();
