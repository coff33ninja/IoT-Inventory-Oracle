import DatabaseService from './databaseService.js';
import { ChatMessage } from '../types.js';

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  summary?: string;
  messageCount: number;
}

export interface ChatContext {
  summary?: string;
  recentTopics: string[];
  mentionedComponents: string[];
  discussedProjects: string[];
}

class ChatService {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = new DatabaseService();
  }

  // Conversation management
  createNewConversation(title?: string): string {
    const defaultTitle = title || `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    return this.dbService.createConversation(defaultTitle);
  }

  getAllConversations(): ChatConversation[] {
    return this.dbService.getAllConversations();
  }

  getActiveConversationId(): string | null {
    return this.dbService.getActiveConversation();
  }

  switchToConversation(conversationId: string): void {
    this.dbService.setActiveConversation(conversationId);
  }

  updateConversationTitle(conversationId: string, title: string): void {
    this.dbService.updateConversationTitle(conversationId, title);
  }

  deleteConversation(conversationId: string): void {
    this.dbService.deleteConversation(conversationId);
  }

  // Message management
  addMessage(conversationId: string, message: ChatMessage): string {
    return this.dbService.addMessage(
      conversationId,
      message.role,
      message.content,
      message.groundingChunks,
      message.suggestedProject
    );
  }

  getConversationMessages(conversationId: string): ChatMessage[] {
    const dbMessages = this.dbService.getConversationMessages(conversationId);
    return dbMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      groundingChunks: msg.groundingChunks,
      suggestedProject: msg.suggestedProject
    }));
  }

  getRecentMessages(conversationId: string, limit: number = 20): ChatMessage[] {
    const dbMessages = this.dbService.getRecentMessages(conversationId, limit);
    return dbMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  // Context and memory
  getConversationContext(conversationId: string): ChatContext {
    return this.dbService.getConversationContext(conversationId);
  }

  updateConversationSummary(conversationId: string, summary: string): void {
    this.dbService.updateConversationSummary(conversationId, summary);
  }

  // Auto-generate conversation title based on first few messages
  async generateConversationTitle(conversationId: string): Promise<string> {
    const messages = this.getRecentMessages(conversationId, 3);
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) {
      return 'New Chat';
    }

    // Simple title generation based on first user message
    const firstMessage = userMessages[0].content;
    const words = firstMessage.split(' ').slice(0, 6);
    let title = words.join(' ');
    
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    this.updateConversationTitle(conversationId, title);
    return title;
  }

  // Memory-enhanced message preparation
  prepareMessageWithContext(conversationId: string, newMessage: string): {
    enhancedMessage: string;
    context: ChatContext;
  } {
    const context = this.getConversationContext(conversationId);
    
    let enhancedMessage = newMessage;
    
    // Add context if available
    if (context.summary || context.recentTopics.length > 0 || context.mentionedComponents.length > 0) {
      let contextInfo = '\n\n[CONVERSATION CONTEXT]\n';
      
      if (context.summary) {
        contextInfo += `Previous discussion summary: ${context.summary}\n`;
      }
      
      if (context.recentTopics.length > 0) {
        contextInfo += `Recent topics: ${context.recentTopics.join(', ')}\n`;
      }
      
      if (context.mentionedComponents.length > 0) {
        contextInfo += `Components discussed: ${context.mentionedComponents.join(', ')}\n`;
      }
      
      if (context.discussedProjects.length > 0) {
        contextInfo += `Projects mentioned: ${context.discussedProjects.join(', ')}\n`;
      }
      
      contextInfo += '[END CONTEXT]\n\n';
      enhancedMessage = contextInfo + newMessage;
    }
    
    return { enhancedMessage, context };
  }

  // Cleanup old conversations (keep last 50)
  cleanupOldConversations(): void {
    const conversations = this.getAllConversations();
    if (conversations.length > 50) {
      const toDelete = conversations.slice(50);
      toDelete.forEach(conv => {
        if (!conv.isActive) {
          this.deleteConversation(conv.id);
        }
      });
    }
  }

  close(): void {
    this.dbService.close();
  }
}

export default ChatService;