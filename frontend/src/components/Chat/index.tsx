import React from 'react';
import { useChatStore } from '../../stores/chatStore';
import { ChatWidget } from './ChatWidget';
import { ChatPanel } from './ChatPanel';
import { ChatDiscovery } from './ChatDiscovery';

/**
 * Main chat container that orchestrates all chat components
 */
export const ChatContainer: React.FC = () => {
  const { isOpen, closeChat } = useChatStore();

  return (
    <>
      {/* Discovery dialog for first-time users */}
      <ChatDiscovery />
      
      {/* Floating chat widget button */}
      <ChatWidget />
      
      {/* Chat panel drawer */}
      <ChatPanel open={isOpen} onClose={closeChat} />
    </>
  );
};

// Export all chat components for convenience
export * from './ChatWidget';
export * from './ChatPanel';
export * from './ChatMessage';
export * from './ChatInput';
export * from './ChatActions';
export * from './ChatDiscovery';