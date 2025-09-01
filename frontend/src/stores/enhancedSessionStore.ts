import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TranscriptionResponse, SpeakerSegment, SpeakerMapping } from '../types';
import type { AppMode } from '../contexts/AppModeContext';

// Demo-specific state structure
interface DemoState {
  currentStep: number;
  isTourActive: boolean;
  mockTranscripts: TranscriptionResponse[];
  mockSegments: SpeakerSegment[];
  mockSpeakerMappings: SpeakerMapping[];
  simulatedProgress: number;
  isSimulatingUpload: boolean;
  selectedFileName?: string; // Track the user's selected filename
}

// Production-specific state structure
interface ProductionState {
  transcripts: TranscriptionResponse[];
  totalTranscriptFileSize: number;
  overrideCount: number;
  sessionStartTime: Date;
  userSession?: {
    userId: string;
    isAuthenticated: boolean;
  };
}

// Enhanced store interface with mode-aware sections
interface EnhancedSessionState {
  // Current mode
  currentMode: AppMode;
  
  // Mode-specific state sections
  demo: DemoState;
  production: ProductionState;
  
  // Mode-aware actions
  setMode: (mode: AppMode) => void;
  
  // Demo actions
  startDemoTour: () => void;
  nextDemoStep: () => void;
  previousDemoStep: () => void;
  closeDemoTour: () => void;
  simulateUpload: (fileName?: string) => Promise<void>;
  startDemoUpload: () => Promise<void>;
  stopSimulation: () => void;
  setSelectedFileName: (fileName: string) => void;
  
  // Production actions (existing functionality)
  addTranscript: (transcript: TranscriptionResponse) => void;
  removeTranscript: (transcriptionId: string) => void;
  incrementOverrides: () => void;
  decrementOverrides: () => void;
  resetOverrides: () => void;
  clearSession: () => void;
  getSessionDurationMinutes: () => number;
  initializeSession: () => void;
  
  // Mode-aware getters
  getCurrentTranscripts: () => TranscriptionResponse[];
  getCurrentSegments: () => SpeakerSegment[];
  getCurrentSpeakerMappings: () => SpeakerMapping[];
  isUploadInProgress: () => boolean;
}

// Demo mock data factory - creates transcript with specified filename
const createMockTranscript = (fileName?: string): TranscriptionResponse => ({
  transcriptionId: 'demo-transcript-1',
  fileName: fileName || 'demo-meeting-q4-planning.wav',
  fileSize: 1657000, // ~1.57 MB to match production
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
  processingTimeMs: 45000, // 45s to match production
  createdAt: new Date().toISOString(),
  speakerCount: 4, // Changed to 4 to match production
  hasSpeakerDiarization: true,
  detectedLanguage: 'en', // Use correct property name
  confidenceScore: 0.99, // Use correct property name
  duration: 17.2, // Add duration in seconds
  speakerMappings: [
    { 
      speakerId: 'Speaker 1', 
      name: '', // Empty name to show as unnamed by default
      role: '', 
      transcriptionId: 'demo-transcript-1',
      source: 'AutoDetected' as const,
      email: 'speaker1@test.com'
    },
    { 
      speakerId: 'Speaker 2', 
      name: '', // Empty name to show as unnamed by default
      role: '', 
      transcriptionId: 'demo-transcript-1',
      source: 'AutoDetected' as const,
      email: ''
    },
    { 
      speakerId: 'Speaker 3', 
      name: '', // Empty name to show as unnamed by default
      role: '', 
      transcriptionId: 'demo-transcript-1',
      source: 'AutoDetected' as const,
      email: ''
    },
    { 
      speakerId: 'Speaker 4', 
      name: '', // Empty name to show as unnamed by default
      role: '', 
      transcriptionId: 'demo-transcript-1',
      source: 'AutoDetected' as const,
      email: ''
    }
  ]
});

export const useEnhancedSessionStore = create<EnhancedSessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentMode: 'demo',
      
      demo: {
        currentStep: 0,
        isTourActive: false,
        mockTranscripts: [],
        mockSegments: [],
        mockSpeakerMappings: [],
        simulatedProgress: 0,
        isSimulatingUpload: false,
        selectedFileName: undefined,
      },
      
      production: {
        transcripts: [],
        totalTranscriptFileSize: 0,
        overrideCount: 0,
        sessionStartTime: new Date(),
      },
      
      // Mode management
      setMode: (mode: AppMode) => {
        set({ currentMode: mode });
      },
      
      // Demo actions
      startDemoTour: () => {
        set((state) => ({
          demo: {
            ...state.demo,
            isTourActive: true,
            currentStep: 0,
          }
        }));
      },
      
      nextDemoStep: () => {
        set((state) => ({
          demo: {
            ...state.demo,
            currentStep: state.demo.currentStep + 1,
          }
        }));
      },
      
      previousDemoStep: () => {
        set((state) => ({
          demo: {
            ...state.demo,
            currentStep: Math.max(0, state.demo.currentStep - 1),
          }
        }));
      },
      
      closeDemoTour: () => {
        set((state) => ({
          demo: {
            ...state.demo,
            isTourActive: false,
            currentStep: 0,
          }
        }));
      },
      
      simulateUpload: async (fileName?: string) => {
        const mockFileName = fileName || 'mock-transcript.wav';
        
        set((state) => ({
          demo: {
            ...state.demo,
            isSimulatingUpload: true,
            simulatedProgress: 0,
            selectedFileName: mockFileName,
            // Create mock transcript with mock filename
            mockTranscripts: [createMockTranscript(mockFileName)],
          }
        }));
        
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          set((state) => ({
            demo: {
              ...state.demo,
              simulatedProgress: i,
            }
          }));
        }
        
        set((state) => ({
          demo: {
            ...state.demo,
            isSimulatingUpload: false,
            simulatedProgress: 100,
          }
        }));
      },

      // Start demo simulation without file picker
      startDemoUpload: async () => {
        const mockFileName = 'mock-transcript.wav';
        const { simulateUpload } = get();
        await simulateUpload(mockFileName);
      },      setSelectedFileName: (fileName: string) => {
        set((state) => ({
          demo: {
            ...state.demo,
            selectedFileName: fileName,
            mockTranscripts: [createMockTranscript(fileName)],
          }
        }));
      },
      
      stopSimulation: () => {
        set((state) => ({
          demo: {
            ...state.demo,
            isSimulatingUpload: false,
            simulatedProgress: 0,
          }
        }));
      },
      
      // Production actions (preserved from original sessionStore)
      addTranscript: (transcript: TranscriptionResponse) => {
        set((state) => {
          const newTranscripts = [...state.production.transcripts, transcript];
          
          // Calculate transcript file size
          const newTotalSize = newTranscripts.reduce((sum, t) => {
            let transcriptSize = 0;
            
            if (t.transcribedText) {
              transcriptSize += new Blob([t.transcribedText]).size;
            }
            
            if (t.speakerSegments) {
              const segmentsText = t.speakerSegments.map(s => s.text).join(' ');
              transcriptSize += new Blob([segmentsText]).size;
            }
            
            return sum + transcriptSize;
          }, 0);
          
          return {
            production: {
              ...state.production,
              transcripts: newTranscripts,
              totalTranscriptFileSize: newTotalSize,
            }
          };
        });
      },
      
      removeTranscript: (transcriptionId: string) => {
        set((state) => ({
          production: {
            ...state.production,
            transcripts: state.production.transcripts.filter(t => t.transcriptionId !== transcriptionId),
          }
        }));
      },
      
      incrementOverrides: () => {
        set((state) => ({
          production: {
            ...state.production,
            overrideCount: state.production.overrideCount + 1,
          }
        }));
      },
      
      decrementOverrides: () => {
        set((state) => ({
          production: {
            ...state.production,
            overrideCount: Math.max(0, state.production.overrideCount - 1),
          }
        }));
      },
      
      resetOverrides: () => {
        set((state) => ({
          production: {
            ...state.production,
            overrideCount: 0,
          }
        }));
      },
      
      clearSession: () => {
        set((state) => ({
          production: {
            ...state.production,
            transcripts: [],
            totalTranscriptFileSize: 0,
            overrideCount: 0,
            sessionStartTime: new Date(),
          }
        }));
      },
      
      getSessionDurationMinutes: () => {
        const { production } = get();
        return Math.floor((Date.now() - production.sessionStartTime.getTime()) / (1000 * 60));
      },
      
      initializeSession: () => {
        set((state) => ({
          production: {
            ...state.production,
            sessionStartTime: new Date(),
          }
        }));
      },
      
      // Mode-aware getters
      getCurrentTranscripts: () => {
        const { currentMode, demo, production } = get();
        return currentMode === 'demo' ? demo.mockTranscripts : production.transcripts;
      },
      
      getCurrentSegments: () => {
        const { currentMode, demo } = get();
        return currentMode === 'demo' ? demo.mockSegments : [];
      },
      
      getCurrentSpeakerMappings: () => {
        const { currentMode, demo } = get();
        return currentMode === 'demo' ? demo.mockSpeakerMappings : [];
      },
      
      isUploadInProgress: () => {
        const { currentMode, demo } = get();
        return currentMode === 'demo' ? demo.isSimulatingUpload : false;
      },
    }),
    {
      name: 'enhanced-session-store',
    }
  )
);
