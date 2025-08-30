import type { 
  TranscriptionResponse, 
  HealthStatus, 
  DetailedHealthStatus,
  SpeakerMapping 
} from '../types';

/**
 * Demo API Service - Provides mock responses for demo mode
 * Prevents real API calls and file operations in demo mode
 */
class DemoApiService {
  private mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async uploadFile(_file: File): Promise<TranscriptionResponse> {
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
        }
      ],
      processingTimeMs: 2500,
      createdAt: new Date().toISOString(),
      speakerCount: 3,
      hasSpeakerDiarization: true,
      speakerMappings: [
        { 
          speakerId: 'Speaker 1', 
          name: 'Sarah Johnson', 
          role: 'Product Manager', 
          transcriptionId: 'demo-transcript-1',
          source: 'AutoDetected' as const,
          email: 'sarah.johnson@company.com'
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
    
    return mockResponse;
  }

  async getTranscriptionStatus(_transcriptionId: string): Promise<TranscriptionResponse> {
    await this.mockDelay(500);
    
    // Return mock completed status
    return await this.uploadFile(new File([], 'mock-transcript.wav'));
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

  async updateSpeakerMappings(transcriptionId: string, mappings: SpeakerMapping[]): Promise<void> {
    await this.mockDelay(200);
    // In demo mode, just simulate the API call
    console.log('Demo mode: Speaker mappings updated', { transcriptionId, mappings });
  }

  async generateSummary(_transcriptionId: string, _transcriptText: string): Promise<string> {
    await this.mockDelay(2000); // Simulate summary generation time
    
    return `## Meeting Summary (Demo)

**Date:** ${new Date().toLocaleDateString()}
**Participants:** Sarah Johnson (Product Manager), Mike Chen (Senior Developer), Lisa Wang (UX Designer)

### Key Discussion Points
- Q4 roadmap planning and prioritization
- Technical requirements review
- UX design mockups presentation

### Action Items
- **Sarah Johnson:** Finalize Q4 roadmap priorities by Friday
- **Mike Chen:** Review technical feasibility of proposed features
- **Lisa Wang:** Share updated mockups with the team

### Next Steps
- Schedule follow-up meeting for next week
- Review implementation timeline
- Coordinate with stakeholders

*This is a demo summary generated for demonstration purposes.*`;
  }

  async sendSummaryEmail(transcriptionId: string, emailData: any): Promise<void> {
    await this.mockDelay(1000);
    // In demo mode, just simulate the email send
    console.log('Demo mode: Email simulated', { transcriptionId, emailData });
  }
}

export default new DemoApiService();
