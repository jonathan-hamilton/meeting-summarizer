import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiService } from '../services/apiService';

// Types
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  actions?: ChatAction[]; // Add support for actionable responses
}

export interface ChatAction {
  type: 'navigate' | 'scroll' | 'dialog' | 'trigger';
  target: string;
  label: string;
}

export interface ChatContext {
  currentPage?: string;
  hasUploadedFile?: boolean;
  processingStatus?: string;
  hasTranscript?: boolean;
  speakersDetected?: number;
  speakersMapped?: boolean;
  hasSummary?: boolean;
  isAuthenticated?: boolean;
  recentError?: string;
}

export interface ChatResponse {
  message: string;
  messagesRemaining: number;
  sessionLimitReached: boolean;
  suggestedActions?: ChatAction[]; // Add support for actionable responses
  isSuccessful?: boolean;
  responseTime?: number;
  estimatedCost?: number;
}

interface ChatState {
  // UI State
  isOpen: boolean;
  isLoading: boolean;
  hasShownDiscovery: boolean;
  
  // Conversation State
  messages: ChatMessage[];
  sessionId: string;
  messagesRemaining: number;
  sessionLimitReached: boolean;
  
  // Error State
  error: string | null;
  
  // Actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setDiscoveryShown: () => void;
  showDiscovery: () => void; // Add method to trigger discovery dialog
  sendMessage: (message: string, context?: ChatContext) => Promise<void>;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  generateSessionId: () => string;
}

const generateSessionId = (): string => {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const buildChatContext = (): ChatContext => {
  // Get current page
  const currentPage = window.location.pathname;
  
  // For MVP, we'll use a simplified context
  // In Phase 2, we can integrate with all stores
  return {
    currentPage,
    isAuthenticated: true, // Simplified for MVP
  };
};

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      // Initial State
      isOpen: false,
      isLoading: false,
      hasShownDiscovery: false, // Will be managed by useDialogPreferences hook
      messages: [],
      sessionId: generateSessionId(),
      messagesRemaining: 30,
      sessionLimitReached: false,
      error: null,

      // Actions
      openChat: () => set({ isOpen: true }),
      
      closeChat: () => set({ isOpen: false }),
      
      toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
      
      setDiscoveryShown: () => {
        set({ hasShownDiscovery: true });
      },
      
      showDiscovery: () => {
        set({ hasShownDiscovery: false });
      },
      
      sendMessage: async (message: string, context?: ChatContext) => {
        const state = get();
        
        if (state.sessionLimitReached) {
          set({ error: 'Message limit reached for this session. Please refresh to start a new conversation.' });
          return;
        }

        set({ isLoading: true, error: null });

        // Add user message immediately
        const userMessage: ChatMessage = {
          id: `user_${Date.now()}`,
          content: message,
          isUser: true,
          timestamp: new Date(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
        }));

        try {
          // Build context if not provided
          const chatContext = context || buildChatContext();

          const response = await apiService.post<ChatResponse>('/api/chat/message', {
            message,
            context: chatContext,
            sessionId: state.sessionId,
          });

          const chatData = response.data;
          if (!chatData) {
            throw new Error('No data received from chat service');
          }

          // Add AI response
          const aiMessage: ChatMessage = {
            id: `ai_${Date.now()}`,
            content: chatData.message || 'I apologize, but I could not generate a response.',
            isUser: false,
            timestamp: new Date(),
            actions: chatData.suggestedActions, // Include actionable responses
          };

          set((state) => ({
            messages: [...state.messages, aiMessage],
            messagesRemaining: chatData.messagesRemaining,
            sessionLimitReached: chatData.sessionLimitReached,
            isLoading: false,
          }));

        } catch (error) {
          console.error('Chat error:', error);
          
          // Add error message
          const errorMessage: ChatMessage = {
            id: `error_${Date.now()}`,
            content: error instanceof Error 
              ? `I'm having trouble connecting to the server. Please try again in a moment.` 
              : 'An unexpected error occurred. Please try again.',
            isUser: false,
            timestamp: new Date(),
          };

          set((state) => ({
            messages: [...state.messages, errorMessage],
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }));
        }
      },
      
      clearMessages: () => set({ 
        messages: [], 
        sessionId: generateSessionId(),
        messagesRemaining: 30,
        sessionLimitReached: false,
        error: null,
      }),
      
      setError: (error: string | null) => set({ error }),
      
      generateSessionId,
    }),
    {
      name: 'chat-store',
    }
  )
);