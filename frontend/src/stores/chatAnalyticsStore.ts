import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ChatAction } from './chatStore';

// Types for analytics
export interface ChatSessionAnalytics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  actionCount: number;
  userSatisfaction?: number; // 1-5 rating
  resolvedIssue: boolean;
  commonQuestions: string[];
  executedActions: ChatAction[];
  responseTimeMs: number[];
  errorCount: number;
}

export interface ChatUsageMetrics {
  dailyUsage: { date: string; sessions: number; messages: number; actions: number }[];
  topQuestions: { question: string; frequency: number; lastAsked: Date }[];
  actionEffectiveness: { action: ChatAction; successRate: number; usageCount: number }[];
  averageSessionLength: number;
  averageMessagesPerSession: number;
  userSatisfactionAverage: number;
  costMetrics: {
    totalTokensUsed: number;
    estimatedCostUSD: number;
    averageCostPerSession: number;
  };
}

interface ChatAnalyticsState {
  // Current session tracking
  currentSession: ChatSessionAnalytics | null;
  
  // Historical data
  sessions: ChatSessionAnalytics[];
  usageMetrics: ChatUsageMetrics;
  
  // Configuration
  maxStoredSessions: number;
  trackingEnabled: boolean;
  
  // Actions
  startSession: (sessionId: string) => void;
  endSession: (userSatisfaction?: number, resolvedIssue?: boolean) => void;
  trackMessage: (message: string, responseTimeMs: number) => void;
  trackAction: (action: ChatAction, success?: boolean) => void;
  trackError: (error: string) => void;
  addQuestion: (question: string) => void;
  updateUserSatisfaction: (rating: number) => void;
  getSessionAnalytics: () => ChatSessionAnalytics | null;
  getUsageMetrics: () => ChatUsageMetrics;
  clearAnalytics: () => void;
}

const initialUsageMetrics: ChatUsageMetrics = {
  dailyUsage: [],
  topQuestions: [],
  actionEffectiveness: [],
  averageSessionLength: 0,
  averageMessagesPerSession: 0,
  userSatisfactionAverage: 0,
  costMetrics: {
    totalTokensUsed: 0,
    estimatedCostUSD: 0,
    averageCostPerSession: 0,
  },
};

export const useChatAnalyticsStore = create<ChatAnalyticsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        currentSession: null,
        sessions: [],
        usageMetrics: initialUsageMetrics,
        maxStoredSessions: 100, // Keep last 100 sessions
        trackingEnabled: true,
        
        // Actions
        startSession: (sessionId: string) => {
          if (!get().trackingEnabled) return;
          
          const newSession: ChatSessionAnalytics = {
            sessionId,
            startTime: new Date(),
            messageCount: 0,
            actionCount: 0,
            resolvedIssue: false,
            commonQuestions: [],
            executedActions: [],
            responseTimeMs: [],
            errorCount: 0,
          };
          
          set({ currentSession: newSession });
        },
        
        endSession: (userSatisfaction?: number, resolvedIssue?: boolean) => {
          const state = get();
          if (!state.trackingEnabled || !state.currentSession) return;
          
          const completedSession: ChatSessionAnalytics = {
            ...state.currentSession,
            endTime: new Date(),
            userSatisfaction,
            resolvedIssue: resolvedIssue ?? false,
          };
          
          // Add to sessions list (keep only maxStoredSessions)
          const updatedSessions = [completedSession, ...state.sessions]
            .slice(0, state.maxStoredSessions);
          
          // Update usage metrics
          const updatedMetrics = updateUsageMetrics(state.usageMetrics, completedSession, updatedSessions);
          
          set({
            currentSession: null,
            sessions: updatedSessions,
            usageMetrics: updatedMetrics,
          });
        },
        
        trackMessage: (_message: string, responseTimeMs: number) => {
          const state = get();
          if (!state.trackingEnabled || !state.currentSession) return;
          
          set({
            currentSession: {
              ...state.currentSession,
              messageCount: state.currentSession.messageCount + 1,
              responseTimeMs: [...state.currentSession.responseTimeMs, responseTimeMs],
            },
          });
        },
        
        trackAction: (action: ChatAction, success: boolean = true) => {
          const state = get();
          if (!state.trackingEnabled || !state.currentSession) return;
          
          set({
            currentSession: {
              ...state.currentSession,
              actionCount: state.currentSession.actionCount + 1,
              executedActions: [...state.currentSession.executedActions, action],
            },
          });
          
          // Update action effectiveness in metrics
          const currentMetrics = state.usageMetrics;
          const existingAction = currentMetrics.actionEffectiveness.find(
            a => a.action.type === action.type && a.action.target === action.target
          );
          
          if (existingAction) {
            const newSuccessRate = success 
              ? (existingAction.successRate * existingAction.usageCount + 1) / (existingAction.usageCount + 1)
              : (existingAction.successRate * existingAction.usageCount) / (existingAction.usageCount + 1);
            
            existingAction.successRate = newSuccessRate;
            existingAction.usageCount += 1;
          } else {
            currentMetrics.actionEffectiveness.push({
              action,
              successRate: success ? 1.0 : 0.0,
              usageCount: 1,
            });
          }
          
          set({ usageMetrics: { ...currentMetrics } });
        },
        
        trackError: (_error: string) => {
          const state = get();
          if (!state.trackingEnabled || !state.currentSession) return;
          
          set({
            currentSession: {
              ...state.currentSession,
              errorCount: state.currentSession.errorCount + 1,
            },
          });
        },
        
        addQuestion: (question: string) => {
          const state = get();
          if (!state.trackingEnabled) return;
          
          // Add to current session
          if (state.currentSession) {
            set({
              currentSession: {
                ...state.currentSession,
                commonQuestions: [...state.currentSession.commonQuestions, question],
              },
            });
          }
          
          // Update top questions in metrics
          const currentMetrics = state.usageMetrics;
          const existingQuestion = currentMetrics.topQuestions.find(q => 
            q.question.toLowerCase() === question.toLowerCase()
          );
          
          if (existingQuestion) {
            existingQuestion.frequency += 1;
            existingQuestion.lastAsked = new Date();
          } else {
            currentMetrics.topQuestions.push({
              question,
              frequency: 1,
              lastAsked: new Date(),
            });
          }
          
          // Keep only top 50 questions
          currentMetrics.topQuestions = currentMetrics.topQuestions
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 50);
          
          set({ usageMetrics: { ...currentMetrics } });
        },
        
        updateUserSatisfaction: (rating: number) => {
          const state = get();
          if (!state.trackingEnabled || !state.currentSession) return;
          
          set({
            currentSession: {
              ...state.currentSession,
              userSatisfaction: rating,
            },
          });
        },
        
        getSessionAnalytics: () => {
          return get().currentSession;
        },
        
        getUsageMetrics: () => {
          return get().usageMetrics;
        },
        
        clearAnalytics: () => {
          set({
            currentSession: null,
            sessions: [],
            usageMetrics: initialUsageMetrics,
          });
        },
      }),
      {
        name: 'chat-analytics-store',
        partialize: (state) => ({
          sessions: state.sessions,
          usageMetrics: state.usageMetrics,
          trackingEnabled: state.trackingEnabled,
        }),
        onRehydrateStorage: () => (state) => {
          if (state?.sessions) {
            // Convert date strings back to Date objects after rehydration
            state.sessions = state.sessions.map(session => ({
              ...session,
              startTime: session.startTime instanceof Date ? session.startTime : new Date(session.startTime),
              endTime: session.endTime ? (session.endTime instanceof Date ? session.endTime : new Date(session.endTime)) : undefined,
            }));
          }
          if (state?.usageMetrics?.topQuestions) {
            state.usageMetrics.topQuestions = state.usageMetrics.topQuestions.map(q => ({
              ...q,
              lastAsked: q.lastAsked instanceof Date ? q.lastAsked : new Date(q.lastAsked),
            }));
          }
        },
      }
    ),
    {
      name: 'chat-analytics',
    }
  )
);

/**
 * Update usage metrics based on completed session
 */
function updateUsageMetrics(
  currentMetrics: ChatUsageMetrics, 
  completedSession: ChatSessionAnalytics,
  allSessions: ChatSessionAnalytics[]
): ChatUsageMetrics {
  const today = new Date().toISOString().split('T')[0];
  
  // Update daily usage
  const dailyUsage = [...currentMetrics.dailyUsage];
  const todayUsage = dailyUsage.find(d => d.date === today);
  
  if (todayUsage) {
    todayUsage.sessions += 1;
    todayUsage.messages += completedSession.messageCount;
    todayUsage.actions += completedSession.actionCount;
  } else {
    dailyUsage.push({
      date: today,
      sessions: 1,
      messages: completedSession.messageCount,
      actions: completedSession.actionCount,
    });
  }
  
  // Keep only last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const filteredDailyUsage = dailyUsage.filter(d => 
    new Date(d.date) >= ninetyDaysAgo
  );
  
  // Calculate averages
  const completedSessions = allSessions.filter(s => s.endTime);
  const averageSessionLength = completedSessions.length > 0
    ? completedSessions.reduce((sum, session) => {
        // Ensure dates are Date objects (handle localStorage deserialization)
        const endTime = session.endTime instanceof Date ? session.endTime : new Date(session.endTime!);
        const startTime = session.startTime instanceof Date ? session.startTime : new Date(session.startTime);
        const duration = endTime.getTime() - startTime.getTime();
        return sum + duration;
      }, 0) / completedSessions.length / 1000 // Convert to seconds
    : 0;
  
  const averageMessagesPerSession = allSessions.length > 0
    ? allSessions.reduce((sum, session) => sum + session.messageCount, 0) / allSessions.length
    : 0;
  
  const satisfactionRatings = allSessions
    .map(s => s.userSatisfaction)
    .filter((rating): rating is number => rating !== undefined);
  const userSatisfactionAverage = satisfactionRatings.length > 0
    ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
    : 0;
  
  // Estimate costs (rough calculation based on typical token usage)
  const totalMessages = allSessions.reduce((sum, session) => sum + session.messageCount, 0);
  const estimatedTokensUsed = totalMessages * 75; // Rough estimate: 75 tokens per message
  const estimatedCostUSD = (estimatedTokensUsed / 1000) * 0.001; // $0.001 per 1K tokens (GPT-3.5)
  const averageCostPerSession = allSessions.length > 0 
    ? estimatedCostUSD / allSessions.length 
    : 0;
  
  return {
    ...currentMetrics,
    dailyUsage: filteredDailyUsage,
    averageSessionLength,
    averageMessagesPerSession,
    userSatisfactionAverage,
    costMetrics: {
      totalTokensUsed: estimatedTokensUsed,
      estimatedCostUSD,
      averageCostPerSession,
    },
  };
}