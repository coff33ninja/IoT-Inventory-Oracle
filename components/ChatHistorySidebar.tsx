import React, { useState } from 'react';
import { ChatConversation } from '../services/chatService';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface ChatHistorySidebarProps {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  onSwitchConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  conversations,
  activeConversationId,
  onSwitchConversation,
  onDeleteConversation,
  onNewConversation,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateTitle = (title: string, maxLength: number = 25) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  return (
    <div className={`fixed top-0 right-0 h-full bg-secondary border-l border-border-color flex flex-col transition-all duration-300 ease-in-out z-30 ${
      isCollapsed ? 'w-12' : 'w-80'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b border-border-color flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div>
            <h3 className="font-semibold text-text-primary">Chat History</h3>
            <p className="text-xs text-text-secondary">{conversations.length} conversations</p>
          </div>
        )}
        
        <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
          {!isCollapsed && (
            <button
              onClick={onNewConversation}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-primary rounded-md transition-colors"
              title="New conversation"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}
          
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-primary rounded-md transition-colors"
              title={isCollapsed ? 'Expand history' : 'Collapse history'}
            >
              {isCollapsed ? <ChevronLeftIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* New Conversation Button (collapsed state) */}
      {isCollapsed && (
        <div className="p-2 border-b border-border-color flex justify-center">
          <button
            onClick={onNewConversation}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-primary rounded-md transition-colors"
            title="New conversation"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          // Collapsed view - show dots for conversations
          <div className="p-2 space-y-2">
            {conversations.slice(0, 10).map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSwitchConversation(conversation.id)}
                className={`w-full p-2 rounded-md transition-colors ${
                  conversation.id === activeConversationId
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-secondary hover:bg-primary hover:text-text-primary'
                }`}
                title={conversation.title}
              >
                <div className={`w-2 h-2 rounded-full mx-auto ${
                  conversation.id === activeConversationId ? 'bg-accent' : 'bg-text-secondary'
                }`} />
              </button>
            ))}
          </div>
        ) : (
          // Expanded view - show full conversation list
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  conversation.id === activeConversationId
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-primary hover:bg-primary'
                }`}
                onClick={() => onSwitchConversation(conversation.id)}
                onMouseEnter={() => setHoveredConversation(conversation.id)}
                onMouseLeave={() => setHoveredConversation(null)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {truncateTitle(conversation.title)}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-text-secondary">
                        {formatDate(conversation.updatedAt)}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {conversation.messageCount} msgs
                      </span>
                    </div>
                    {conversation.summary && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                        {conversation.summary}
                      </p>
                    )}
                  </div>
                  
                  {hoveredConversation === conversation.id && conversation.id !== activeConversationId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      className="ml-2 p-1 text-text-secondary hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete conversation"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {conversations.length === 0 && (
              <div className="text-center py-8 text-text-secondary">
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start chatting to see history</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border-color">
          <div className="text-xs text-text-secondary text-center">
            <p>Conversations are saved automatically</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistorySidebar;