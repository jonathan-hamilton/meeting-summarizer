import React from 'react';
import { useChatStore } from '../../stores/chatStore';
import { ChatWidget } from './ChatWidget';
import { ChatPanel } from './ChatPanel';
import { ChatDiscovery } from './ChatDiscovery';

interface ChatContainerProps {
  isAuthenticated?: boolean;
  chatDiscoveryOpen?: boolean;
  onChatDiscoveryShown?: () => void | Promise<void>;
}

/**
 * Main chat container that orchestrates all chat components
 */
export const ChatContainer: React.FC<ChatContainerProps> = ({ 
  isAuthenticated = false, 
  chatDiscoveryOpen = false, 
  onChatDiscoveryShown 
}) => {
  const { isOpen, closeChat } = useChatStore();

  return (
    <>
      {/* Discovery dialog for first-time users - only when authenticated */}
      {isAuthenticated && (
        <ChatDiscovery open={chatDiscoveryOpen} onDiscoveryShown={onChatDiscoveryShown} />
      )}
      
      {/* Floating chat widget button - only when authenticated */}
      {isAuthenticated && <ChatWidget />}
      
      {/* Chat panel drawer - only when authenticated */}
      {isAuthenticated && <ChatPanel open={isOpen} onClose={closeChat} />}
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