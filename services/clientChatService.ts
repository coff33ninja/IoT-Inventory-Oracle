import { ChatMessage } from "../types.js";

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
  messageCount: number;
  lastActivity: string;
}

/**
 * Client-side chat service that works with the API
 * This avoids importing server-side database services in the browser
 */
export class ClientChatService {
  private static readonly API_BASE = "/api/chat";

  static async getAllConversations(): Promise<ChatConversation[]> {
    try {
      const response = await fetch(`${this.API_BASE}/conversations`);
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return await response.json();
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  }

  static async createNewConversation(title: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.API_BASE}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Failed to create conversation");
      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  }

  static async getActiveConversationId(): Promise<string | null> {
    try {
      const response = await fetch(`${this.API_BASE}/conversations/active`);
      if (!response.ok) throw new Error("Failed to get active conversation");
      const result = await response.json();
      return result.activeConversationId;
    } catch (error) {
      console.error("Error getting active conversation:", error);
      return null;
    }
  }

  static async switchToConversation(conversationId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_BASE}/conversations/${conversationId}/activate`,
        {
          method: "PUT",
        }
      );
      return response.ok;
    } catch (error) {
      console.error("Error switching conversation:", error);
      return false;
    }
  }

  static async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_BASE}/conversations/${conversationId}/title`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }
      );
      return response.ok;
    } catch (error) {
      console.error("Error updating conversation title:", error);
      return false;
    }
  }

  static async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_BASE}/conversations/${conversationId}`,
        {
          method: "DELETE",
        }
      );
      return response.ok;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return false;
    }
  }

  static async getConversationMessages(
    conversationId: string
  ): Promise<ChatMessage[]> {
    try {
      const response = await fetch(
        `${this.API_BASE}/conversations/${conversationId}/messages`
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      return await response.json();
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

  static async addMessage(
    conversationId: string,
    message: ChatMessage
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.API_BASE}/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
        }
      );
      if (!response.ok) throw new Error("Failed to add message");
      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error("Error adding message:", error);
      return null;
    }
  }

  static async getConversationContext(
    conversationId: string
  ): Promise<ChatContext | null> {
    try {
      const response = await fetch(
        `${this.API_BASE}/conversations/${conversationId}/context`
      );
      if (!response.ok) throw new Error("Failed to get conversation context");
      return await response.json();
    } catch (error) {
      console.error("Error getting conversation context:", error);
      return null;
    }
  }

  static async updateConversationSummary(
    conversationId: string,
    summary: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_BASE}/conversations/${conversationId}/summary`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ summary }),
        }
      );
      return response.ok;
    } catch (error) {
      console.error("Error updating conversation summary:", error);
      return false;
    }
  }

  static async generateConversationTitle(
    conversationId: string
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.API_BASE}/conversations/${conversationId}/generate-title`,
        {
          method: "POST",
        }
      );
      if (!response.ok) throw new Error("Failed to generate title");
      const result = await response.json();
      return result.title;
    } catch (error) {
      console.error("Error generating conversation title:", error);
      return null;
    }
  }
}
