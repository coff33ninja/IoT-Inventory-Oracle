import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, ItemStatus, AiSuggestedPart, Project } from "../types";
import { getAiChatStream } from "../services/geminiService";
import { SendIcon } from "./icons/SendIcon";
import { BotIcon } from "./icons/BotIcon";
import { UserIcon } from "./icons/UserIcon";
import { SpinnerIcon } from "./icons/SpinnerIcon";
import { useInventory } from "../contexts/InventoryContext";
import { useToast } from "../contexts/ToastContext";
import { ChatIcon } from "./icons/ChatIcon";
import { ProjectsIcon } from "./icons/ProjectsIcon";
import { PaperclipIcon } from "./icons/PaperclipIcon";
import apiClient from "../services/apiClient";
import { ChatConversation } from "../services/chatService";

interface ChatViewProps {
  initialMessage?: string | null;
}

const parseJsonBlock = <T,>(
  content: string,
  startMarker: string,
  endMarker: string
): { displayContent: string; jsonData: T | null } => {
  // Try with 'json' language identifier first
  let regex = new RegExp(
    "```json\\s*" + startMarker + "([\\s\\S]*?)" + endMarker + "\\s*```"
  );
  let match = content.match(regex);

  // If not found, try without language identifier
  if (!match) {
    regex = new RegExp(
      "```\\s*" + startMarker + "([\\s\\S]*?)" + endMarker + "\\s*```"
    );
    match = content.match(regex);
  }

  // Also try without code blocks (direct markers)
  if (!match) {
    regex = new RegExp(startMarker + "([\\s\\S]*?)" + endMarker);
    match = content.match(regex);
  }

  if (!match || !match[1]) {
    console.log(`No match found for markers ${startMarker} to ${endMarker}`);
    return { displayContent: content, jsonData: null };
  }

  const jsonString = match[1].trim();
  const displayContent = content.replace(match[0], "").trim();

  console.log(
    `Found JSON block for ${startMarker}:`,
    jsonString.substring(0, 100) + "..."
  );

  try {
    const jsonData = JSON.parse(jsonString) as T;
    console.log(`Successfully parsed JSON for ${startMarker}:`, jsonData);
    return { displayContent, jsonData };
  } catch (e) {
    console.error(`Failed to parse JSON for marker ${startMarker}:`, e);
    console.error("JSON string was:", jsonString);
    return { displayContent: content, jsonData: null }; // Return original content on error
  }
};

const ChatView: React.FC<ChatViewProps> = ({ initialMessage }) => {
  const {
    inventory,
    addItem,
    addProject,
    projects,
    updateProject,
    updateItem,
  } = useInventory();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [autoPopulateEnabled, setAutoPopulateEnabled] = useState(() => {
    const saved = localStorage.getItem("iot-auto-populate");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Chat history state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [showConversationList, setShowConversationList] = useState(false);

  // Initialize conversations and load active conversation
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Load all conversations
        const allConversations = await apiClient.getAllConversations();
        setConversations(allConversations);

        // Get active conversation
        const { activeConversationId } =
          await apiClient.getActiveConversation();

        if (activeConversationId) {
          setCurrentConversationId(activeConversationId);
          // Load messages for active conversation
          const conversationMessages = await apiClient.getConversationMessages(
            activeConversationId
          );
          setMessages(conversationMessages);
        } else {
          // Create first conversation if none exist or no active conversation
          const { id } = await apiClient.createConversation("New Chat");
          setCurrentConversationId(id);
          const newConversation = {
            id,
            title: "New Chat",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            messageCount: 0,
          };
          setConversations([newConversation, ...allConversations]);
          console.log("Created new conversation:", id);
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        addToast("Failed to load chat history", "error");
        // Fallback: create a local conversation ID for this session
        const fallbackId = `local-${Date.now()}`;
        setCurrentConversationId(fallbackId);
        console.log("Using fallback conversation ID:", fallbackId);
      }
    };

    initializeChat();
  }, [addToast]);

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Limit file size to 1MB
      if (file.size > 1 * 1024 * 1024) {
        addToast("File size cannot exceed 1MB.", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setAttachedFile({ name: file.name, content });
      };
      reader.onerror = () => {
        addToast("Error reading file.", "error");
      };
      reader.readAsText(file);
    }
    // Allow selecting the same file again
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleSend = async () => {
    if ((input.trim() === "" && !attachedFile) || isLoading) return;

    let messageContent = input;
    if (attachedFile) {
      messageContent = `Please analyze the following document named "${
        attachedFile.name
      }":\n\n--- DOCUMENT CONTENT START ---\n${
        attachedFile.content
      }\n--- DOCUMENT CONTENT END ---\n\nMy request related to this document is: ${
        input || "Please provide a summary and suggest next steps."
      }`;
    }

    // Ensure we have a current conversation
    let conversationId = currentConversationId;
    if (!conversationId) {
      console.log("No current conversation, creating new one...");
      try {
        const { id } = await apiClient.createConversation("New Chat");
        conversationId = id;
        setCurrentConversationId(id);
        const newConversation = {
          id,
          title: "New Chat",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          messageCount: 0,
        };
        setConversations((prev) => [
          newConversation,
          ...prev.map((c) => ({ ...c, isActive: false })),
        ]);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        addToast("Failed to create conversation", "error");
        return;
      }
    }

    const userMessage: ChatMessage = { role: "user", content: messageContent };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachedFile(null); // Clear the file after preparing the message
    setIsLoading(true);

    try {
      // Save user message to database
      await apiClient.addMessage(conversationId, userMessage);

      // Get conversation context for better AI memory
      const conversationContext = await apiClient.getConversationContext(
        conversationId
      );

      const stream = await getAiChatStream(
        messageContent,
        messages,
        inventory,
        projects,
        conversationContext
      );

      const modelMessage: ChatMessage = {
        role: "model",
        content: "",
        groundingChunks: [],
      };
      setMessages((prev) => [...prev, modelMessage]);

      let fullResponse = "";
      let groundingChunks: any[] = [];
      let projectData: {
        projectName: string;
        components: { name: string; quantity: number }[];
      } | null = null;

      for await (const chunk of stream) {
        fullResponse += chunk.text;
        groundingChunks =
          chunk.candidates?.[0]?.groundingMetadata?.groundingChunks ||
          groundingChunks;

        const { jsonData } = parseJsonBlock<{
          projectName: string;
          components: { name: string; quantity: number }[];
        }>(
          fullResponse,
          "/// PROJECT_JSON_START ///",
          "/// PROJECT_JSON_END ///"
        );

        if (jsonData) {
          projectData = jsonData;
        }

        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1
              ? {
                  ...msg,
                  content: fullResponse,
                  groundingChunks,
                  suggestedProject: projectData || msg.suggestedProject,
                }
              : msg
          )
        );
      }

      // Save AI response to database
      const finalModelMessage: ChatMessage = {
        role: "model",
        content: fullResponse,
        groundingChunks,
        suggestedProject: projectData,
      };
      await apiClient.addMessage(conversationId, finalModelMessage);

      // Auto-generate conversation title if this is the first exchange
      if (messages.length === 0) {
        try {
          const { title } = await apiClient.generateConversationTitle(
            conversationId
          );
          await updateConversationTitle(conversationId, title);
        } catch (error) {
          console.error("Failed to generate conversation title:", error);
        }
      }

      // Auto-execute AI suggestions after the response is complete
      await autoExecuteAiSuggestions(fullResponse);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      const errorMessage: ChatMessage = {
        role: "model",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-execute AI suggestions based on response content
  const autoExecuteAiSuggestions = async (responseContent: string) => {
    // Check if auto-population is enabled
    const autoPopulateEnabled = localStorage.getItem("iot-auto-populate");
    const isEnabled =
      autoPopulateEnabled !== null ? JSON.parse(autoPopulateEnabled) : true;

    console.log("Auto-populate enabled:", isEnabled);
    console.log("Response content length:", responseContent.length);
    console.log("Current conversation ID:", currentConversationId);

    if (!isEnabled) {
      console.log("Auto-population disabled, skipping");
      return; // Skip auto-execution if disabled
    }

    // Note: We don't need to check currentConversationId here since auto-execution
    // doesn't require database operations - it just updates the UI state

    try {
      // Parse and auto-execute project suggestions
      const { jsonData: projectData } = parseJsonBlock<{
        projectName: string;
        components: { name: string; quantity: number }[];
      }>(
        responseContent,
        "/// PROJECT_JSON_START ///",
        "/// PROJECT_JSON_END ///"
      );

      if (projectData) {
        console.log("Found project data:", projectData);
        // Auto-create project if AI suggests one
        handleCreateProject(projectData.components, projectData.projectName);
        addToast(`Auto-created project: ${projectData.projectName}`, "success");
      } else {
        console.log("No project data found");
      }

      // Parse and auto-execute part suggestions
      const { jsonData: suggestions } = parseJsonBlock<AiSuggestedPart[]>(
        responseContent,
        "/// SUGGESTIONS_JSON_START ///",
        "/// SUGGESTIONS_JSON_END ///"
      );

      if (suggestions && suggestions.length > 0) {
        console.log("Found suggestions:", suggestions);
        // Auto-add suggested parts with AI-determined status
        let needCount = 0;
        let wantCount = 0;
        let haveCount = 0;

        for (const part of suggestions) {
          let status: ItemStatus;

          // Use AI-suggested status or default to WANT
          switch (part.status) {
            case "I Need":
              status = ItemStatus.NEED;
              needCount++;
              break;
            case "I Have":
              status = ItemStatus.HAVE;
              haveCount++;
              break;
            case "I Want":
            default:
              status = ItemStatus.WANT;
              wantCount++;
              break;
          }

          await handleAddToInventory(part, status);
        }

        // Create detailed toast message
        const statusParts = [];
        if (needCount > 0) statusParts.push(`${needCount} to Required`);
        if (wantCount > 0) statusParts.push(`${wantCount} to Wishlist`);
        if (haveCount > 0) statusParts.push(`${haveCount} to Inventory`);

        addToast(
          `Auto-added ${suggestions.length} parts: ${statusParts.join(", ")}`,
          "success"
        );
      } else {
        console.log("No suggestions found");
      }

      // Parse and auto-execute component moves
      const { jsonData: moveAction } = parseJsonBlock<{
        action: string;
        sourceProjectId: string;
        targetProjectId: string;
        componentName: string;
        quantity: number;
        reason: string;
      }>(responseContent, "/// MOVE_JSON_START ///", "/// MOVE_JSON_END ///");

      if (moveAction) {
        handleMoveComponent(moveAction);
        addToast(
          `Auto-moved component: ${moveAction.componentName}`,
          "success"
        );
      }

      // Parse and auto-execute inventory transfers
      const { jsonData: transferAction } = parseJsonBlock<{
        action: string;
        inventoryItemId: string;
        targetProjectId: string;
        quantity: number;
        reason: string;
      }>(
        responseContent,
        "/// TRANSFER_JSON_START ///",
        "/// TRANSFER_JSON_END ///"
      );

      if (transferAction) {
        handleTransferToProject(transferAction);
        addToast(`Auto-transferred component to project`, "success");
      }
    } catch (error) {
      console.error("Error auto-executing AI suggestions:", error);
      addToast("Error processing AI suggestions", "error");
    }
  };

  const handleAddToInventory = (part: AiSuggestedPart, status: ItemStatus) => {
    const newItem = {
      id: "", // Will be generated by context
      name: part.name,
      quantity: 1,
      location: "To be purchased",
      status: status,
      description: `Suggested by AI. Supplier: ${part.supplier}, Price: ${part.price}. Link: ${part.link}`,
      createdAt: new Date().toISOString(),
      imageUrl: undefined,
    };
    addItem(newItem);
    const statusName =
      status === ItemStatus.NEED
        ? "Required"
        : status === ItemStatus.WANT
        ? "Wishlist"
        : status === ItemStatus.HAVE
        ? "Inventory"
        : status;
    addToast(`${part.name} added to "${statusName}"!`, "success");
  };

  // Fix: Corrected the type for `projectData` to match what the AI returns, which lacks an 'id'.
  const handleCreateProject = (
    projectData: { name: string; quantity: number }[],
    projectName: string
  ) => {
    const projectComponents = projectData.map((aiComp) => {
      const inventoryItem = inventory.find(
        (invItem) => invItem.name.toLowerCase() === aiComp.name.toLowerCase()
      );
      return {
        id: inventoryItem
          ? inventoryItem.id
          : `ai-${Date.now()}-${aiComp.name.replace(/\s/g, "")}`,
        name: aiComp.name,
        quantity: aiComp.quantity,
        source: "ai-suggested" as const,
      };
    });

    const newProject: Omit<Project, "id" | "createdAt"> = {
      name: projectName,
      description: `AI-suggested project created on ${new Date().toLocaleDateString()}`,
      components: projectComponents,
      status: "In Progress",
      notes: `Project structure generated by IoT Oracle AI. Components identified:\n${projectData
        .map((c) => `- ${c.quantity} x ${c.name}`)
        .join("\n")}`,
    };

    addProject(newProject);
    addToast(`Project "${projectName}" created!`, "success");
  };

  const handleMoveComponent = (moveData: {
    action: string;
    sourceProjectId: string;
    targetProjectId: string;
    componentName: string;
    quantity: number;
    reason: string;
  }) => {
    const sourceProject = projects.find(
      (p) => p.id === moveData.sourceProjectId
    );
    const targetProject = projects.find(
      (p) => p.id === moveData.targetProjectId
    );

    if (!sourceProject || !targetProject) {
      addToast("Could not find source or target project", "error");
      return;
    }

    // Find the component in the source project
    const componentIndex = sourceProject.components.findIndex(
      (c) => c.name.toLowerCase() === moveData.componentName.toLowerCase()
    );

    if (componentIndex === -1) {
      addToast(
        `Component "${moveData.componentName}" not found in source project`,
        "error"
      );
      return;
    }

    const component = sourceProject.components[componentIndex];

    if (component.quantity < moveData.quantity) {
      addToast(
        `Not enough quantity available (has ${component.quantity}, requested ${moveData.quantity})`,
        "error"
      );
      return;
    }

    // Update source project (remove or reduce quantity)
    const updatedSourceComponents = [...sourceProject.components];
    if (component.quantity === moveData.quantity) {
      updatedSourceComponents.splice(componentIndex, 1);
    } else {
      updatedSourceComponents[componentIndex] = {
        ...component,
        quantity: component.quantity - moveData.quantity,
      };
    }

    // Update target project (add or increase quantity)
    const updatedTargetComponents = [...targetProject.components];
    const existingComponentIndex = updatedTargetComponents.findIndex(
      (c) => c.name.toLowerCase() === moveData.componentName.toLowerCase()
    );

    if (existingComponentIndex >= 0) {
      updatedTargetComponents[existingComponentIndex].quantity +=
        moveData.quantity;
    } else {
      updatedTargetComponents.push({
        id: component.id,
        name: component.name,
        quantity: moveData.quantity,
        source: component.source,
      });
    }

    // Apply updates
    updateProject({ ...sourceProject, components: updatedSourceComponents });
    updateProject({ ...targetProject, components: updatedTargetComponents });

    addToast(
      `Moved ${moveData.quantity}x ${moveData.componentName} from "${sourceProject.name}" to "${targetProject.name}"`,
      "success"
    );
  };

  const handleTransferToProject = (transferData: {
    action: string;
    inventoryItemId: string;
    targetProjectId: string;
    quantity: number;
    reason: string;
  }) => {
    const inventoryItem = inventory.find(
      (item) => item.id === transferData.inventoryItemId
    );
    const targetProject = projects.find(
      (p) => p.id === transferData.targetProjectId
    );

    if (!inventoryItem || !targetProject) {
      addToast("Could not find inventory item or target project", "error");
      return;
    }

    if (inventoryItem.quantity < transferData.quantity) {
      addToast(
        `Not enough quantity available (has ${inventoryItem.quantity}, requested ${transferData.quantity})`,
        "error"
      );
      return;
    }

    // Update inventory item (reduce quantity)
    const updatedInventoryItem = {
      ...inventoryItem,
      quantity: inventoryItem.quantity - transferData.quantity,
    };
    updateItem(updatedInventoryItem);

    // Update target project (add component)
    const updatedComponents = [...targetProject.components];
    const existingComponentIndex = updatedComponents.findIndex(
      (c) => c.name.toLowerCase() === inventoryItem.name.toLowerCase()
    );

    if (existingComponentIndex >= 0) {
      updatedComponents[existingComponentIndex].quantity +=
        transferData.quantity;
    } else {
      updatedComponents.push({
        id: inventoryItem.id,
        name: inventoryItem.name,
        quantity: transferData.quantity,
        source: "manual",
      });
    }

    updateProject({ ...targetProject, components: updatedComponents });

    addToast(
      `Transferred ${transferData.quantity}x ${inventoryItem.name} to project "${targetProject.name}"`,
      "success"
    );
  };

  const parseContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: "code",
        language: match[1] || "text",
        content: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: "text", content: content.substring(lastIndex) });
    }

    return parts.map((part, i) => {
      if (part.type === "code") {
        return (
          <pre
            key={i}
            className="bg-primary p-4 rounded-lg my-2 overflow-x-auto text-sm">
            <code className={`language-${part.language}`}>{part.content}</code>
          </pre>
        );
      }
      // Markdown table support
      if (part.content.includes("|--")) {
        const lines = part.content.trim().split("\n");
        const headerLine = lines.find((l) => l.includes("|--"));
        if (!headerLine)
          return (
            <p key={i} className="whitespace-pre-wrap">
              {part.content}
            </p>
          );

        const headerIndex = lines.indexOf(headerLine);
        const header = lines[headerIndex - 1]
          .split("|")
          .map((h) => h.trim())
          .filter(Boolean);
        const rows = lines.slice(headerIndex + 1).map((row) =>
          row
            .split("|")
            .map((c) => c.trim())
            .filter(Boolean)
        );
        return (
          <div key={i} className="my-2 overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color border border-border-color rounded-lg">
              <thead className="bg-primary">
                <tr>
                  {header.map((h, hi) => (
                    <th
                      key={hi}
                      className="px-4 py-2 text-left text-sm font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color bg-secondary">
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 text-sm">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // Process lists, bold, italics for the remaining text part
      let htmlContent = part.content;

      // Process list blocks
      htmlContent = htmlContent.replace(/((?:^- .*(?:\n|$))+)/gm, (match) => {
        const items = match
          .trim()
          .split("\n")
          .map((line) => line.substring(2).trim());
        return `
              <ul class="list-disc list-inside ml-4 my-2">
                  ${items.map((item) => `<li>${item}</li>`).join("")}
              </ul>
          `;
      });

      // Process bold and italics on the result
      htmlContent = htmlContent
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>");

      return (
        <div
          key={i}
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    });
  };

  // Listen for changes to auto-populate setting
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("iot-auto-populate");
      setAutoPopulateEnabled(saved !== null ? JSON.parse(saved) : true);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Conversation management functions
  const createNewConversation = async () => {
    try {
      const { id } = await apiClient.createConversation();
      const newConversation: ChatConversation = {
        id,
        title: "New Chat",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        messageCount: 0,
      };

      setConversations((prev) => [
        newConversation,
        ...prev.map((c) => ({ ...c, isActive: false })),
      ]);
      setCurrentConversationId(id);
      setMessages([]);
      setShowConversationList(false);
      addToast("New conversation started", "success");
    } catch (error) {
      console.error("Failed to create conversation:", error);
      addToast("Failed to create new conversation", "error");
    }
  };

  const switchConversation = async (conversationId: string) => {
    try {
      await apiClient.switchToConversation(conversationId);
      const conversationMessages = await apiClient.getConversationMessages(
        conversationId
      );

      setCurrentConversationId(conversationId);
      setMessages(conversationMessages);
      setConversations((prev) =>
        prev.map((c) => ({ ...c, isActive: c.id === conversationId }))
      );
      setShowConversationList(false);

      const conversation = conversations.find((c) => c.id === conversationId);
      addToast(
        `Switched to: ${conversation?.title || "Conversation"}`,
        "success"
      );
    } catch (error) {
      console.error("Failed to switch conversation:", error);
      addToast("Failed to switch conversation", "error");
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await apiClient.deleteConversation(conversationId);
      const updatedConversations = conversations.filter(
        (c) => c.id !== conversationId
      );
      setConversations(updatedConversations);

      if (conversationId === currentConversationId) {
        if (updatedConversations.length > 0) {
          await switchConversation(updatedConversations[0].id);
        } else {
          await createNewConversation();
        }
      }

      addToast("Conversation deleted", "success");
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      addToast("Failed to delete conversation", "error");
    }
  };

  const updateConversationTitle = async (
    conversationId: string,
    newTitle: string
  ) => {
    try {
      await apiClient.updateConversationTitle(conversationId, newTitle);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, title: newTitle } : c
        )
      );
    } catch (error) {
      console.error("Failed to update conversation title:", error);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Chat Assistant
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConversationList(!showConversationList)}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-secondary"
              title="Chat History">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={createNewConversation}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-secondary"
              title="New Chat">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>
        {autoPopulateEnabled && (
          <div className="flex items-center gap-2 text-xs bg-highlight/20 text-highlight px-2 py-1 rounded-full">
            <div className="w-2 h-2 bg-highlight rounded-full animate-pulse"></div>
            Auto-populate enabled
          </div>
        )}
      </div>

      {/* Conversation List Dropdown */}
      {showConversationList && (
        <div className="absolute top-16 left-0 right-0 bg-secondary border border-border-color rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto mb-4">
          <div className="p-3 border-b border-border-color">
            <h3 className="font-semibold text-text-primary">Chat History</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 border-b border-border-color last:border-b-0 hover:bg-primary cursor-pointer ${
                  conversation.isActive ? "bg-primary" : ""
                }`}
                onClick={() => switchConversation(conversation.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {new Date(conversation.updatedAt).toLocaleDateString()} •{" "}
                      {conversation.messageCount} messages
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                    className="ml-2 p-1 text-text-secondary hover:text-danger transition-colors"
                    title="Delete conversation">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto pr-2 space-y-4 sm:space-y-6 pb-4">
        {messages.map((msg, index) => {
          const {
            displayContent: contentAfterSuggestions,
            jsonData: suggestions,
          } = parseJsonBlock<AiSuggestedPart[]>(
            msg.content,
            "/// SUGGESTIONS_JSON_START ///",
            "/// SUGGESTIONS_JSON_END ///"
          );
          const { displayContent: contentAfterProject, jsonData: project } =
            parseJsonBlock<{
              projectName: string;
              components: { name: string; quantity: number }[];
            }>(
              contentAfterSuggestions,
              "/// PROJECT_JSON_START ///",
              "/// PROJECT_JSON_END ///"
            );
          const { displayContent: contentAfterMove, jsonData: moveAction } =
            parseJsonBlock<{
              action: string;
              sourceProjectId: string;
              targetProjectId: string;
              componentName: string;
              quantity: number;
              reason: string;
            }>(
              contentAfterProject,
              "/// MOVE_JSON_START ///",
              "/// MOVE_JSON_END ///"
            );
          const {
            displayContent: contentAfterTransfer,
            jsonData: transferAction,
          } = parseJsonBlock<{
            action: string;
            inventoryItemId: string;
            targetProjectId: string;
            quantity: number;
            reason: string;
          }>(
            contentAfterMove,
            "/// TRANSFER_JSON_START ///",
            "/// TRANSFER_JSON_END ///"
          );
          const {
            displayContent: contentAfterTemplate,
            jsonData: templateAction,
          } = parseJsonBlock<{
            action: string;
            templateId: string;
            templateName: string;
            matchingComponents: string[];
            missingComponents: string[];
            reason: string;
          }>(
            contentAfterTransfer,
            "/// TEMPLATE_JSON_START ///",
            "/// TEMPLATE_JSON_END ///"
          );
          const { displayContent, jsonData: analysisAction } = parseJsonBlock<{
            action: string;
            issues: Array<{ type: string; message: string }>;
            suggestions: Array<{
              type: string;
              component: string;
              alternative?: string;
              quantity?: number;
              reason: string;
            }>;
          }>(
            contentAfterTemplate,
            "/// ANALYSIS_JSON_START ///",
            "/// ANALYSIS_JSON_END ///"
          );

          return (
            <div
              key={index}
              className={`flex items-start gap-3 sm:gap-4 ${
                msg.role === "user" ? "justify-end" : ""
              }`}>
              {msg.role === "model" && (
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent flex items-center justify-center">
                  <BotIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-xl p-3 sm:p-4 rounded-xl ${
                  msg.role === "user" ? "bg-accent text-white" : "bg-secondary"
                }`}>
                <div className="prose prose-invert text-text-primary prose-p:my-0 prose-pre:my-2 prose-strong:text-text-primary prose-em:text-text-primary">
                  {parseContent(displayContent)}
                </div>

                {(suggestions ||
                  project ||
                  moveAction ||
                  transferAction ||
                  templateAction ||
                  analysisAction) && (
                  <div className="mt-4 pt-3 border-t border-border-color space-y-3">
                    <h4 className="text-sm font-semibold text-text-secondary">
                      Interactive Actions:
                    </h4>
                    {project && (
                      <div className="bg-primary/50 p-3 rounded-lg">
                        <p className="font-semibold text-text-primary text-sm flex items-center gap-2">
                          <ProjectsIcon /> {project.projectName}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleCreateProject(
                                project.components,
                                project.projectName
                              )
                            }
                            className="text-xs bg-highlight/20 text-highlight hover:bg-highlight/40 px-2 py-1 rounded-md transition-colors w-full text-center">
                            Create Project
                          </button>
                        </div>
                      </div>
                    )}
                    {moveAction && (
                      <div className="bg-primary/50 p-3 rounded-lg">
                        <p className="font-semibold text-text-primary text-sm">
                          Move Component
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {moveAction.quantity}x {moveAction.componentName} from{" "}
                          {projects.find(
                            (p) => p.id === moveAction.sourceProjectId
                          )?.name || "Unknown"}{" "}
                          to{" "}
                          {projects.find(
                            (p) => p.id === moveAction.targetProjectId
                          )?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {moveAction.reason}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleMoveComponent(moveAction)}
                            className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/40 px-2 py-1 rounded-md transition-colors w-full text-center">
                            Execute Move
                          </button>
                        </div>
                      </div>
                    )}
                    {transferAction && (
                      <div className="bg-primary/50 p-3 rounded-lg">
                        <p className="font-semibold text-text-primary text-sm">
                          Transfer from Inventory
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {transferAction.quantity}x{" "}
                          {inventory.find(
                            (item) => item.id === transferAction.inventoryItemId
                          )?.name || "Unknown"}{" "}
                          to{" "}
                          {projects.find(
                            (p) => p.id === transferAction.targetProjectId
                          )?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {transferAction.reason}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleTransferToProject(transferAction)
                            }
                            className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-2 py-1 rounded-md transition-colors w-full text-center">
                            Execute Transfer
                          </button>
                        </div>
                      </div>
                    )}
                    {templateAction && (
                      <div className="bg-primary/50 p-3 rounded-lg">
                        <p className="font-semibold text-text-primary text-sm">
                          📋 Project Template Suggestion
                        </p>
                        <p className="font-medium text-text-primary text-sm mt-1">
                          {templateAction.templateName}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {templateAction.reason}
                        </p>
                        <div className="mt-2 space-y-1">
                          {templateAction.matchingComponents.length > 0 && (
                            <p className="text-xs text-green-400">
                              ✓ You have:{" "}
                              {templateAction.matchingComponents.join(", ")}
                            </p>
                          )}
                          {templateAction.missingComponents.length > 0 && (
                            <p className="text-xs text-yellow-400">
                              ⚠ Missing:{" "}
                              {templateAction.missingComponents.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              addToast("Template feature coming soon!", "info")
                            }
                            className="text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 px-2 py-1 rounded-md transition-colors w-full text-center">
                            Use Template
                          </button>
                        </div>
                      </div>
                    )}
                    {analysisAction && (
                      <div className="bg-primary/50 p-3 rounded-lg">
                        <p className="font-semibold text-text-primary text-sm">
                          🔍 Component Analysis
                        </p>
                        {analysisAction.issues.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-red-400 mb-1">
                              Issues Found:
                            </p>
                            {analysisAction.issues.map((issue, idx) => (
                              <p
                                key={idx}
                                className="text-xs text-red-300 mb-1">
                                • {issue.message}
                              </p>
                            ))}
                          </div>
                        )}
                        {analysisAction.suggestions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-blue-400 mb-1">
                              Suggestions:
                            </p>
                            {analysisAction.suggestions.map(
                              (suggestion, idx) => (
                                <p
                                  key={idx}
                                  className="text-xs text-blue-300 mb-1">
                                  •{" "}
                                  {suggestion.type === "alternative"
                                    ? `Replace ${suggestion.component} with ${suggestion.alternative}`
                                    : `Add ${suggestion.quantity}x ${suggestion.component}`}
                                  : {suggestion.reason}
                                </p>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {suggestions?.map((part, partIdx) => (
                      <div
                        key={partIdx}
                        className="bg-primary/50 p-3 rounded-lg">
                        <p className="font-semibold text-text-primary text-sm">
                          {part.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleAddToInventory(part, ItemStatus.NEED)
                            }
                            className="text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40 px-2 py-1 rounded-md transition-colors">
                            To Required
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAddToInventory(part, ItemStatus.WANT)
                            }
                            className="text-xs bg-sky-500/20 text-sky-400 hover:bg-sky-500/40 px-2 py-1 rounded-md transition-colors">
                            To Wishlist
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                  <div className="mt-4 pt-2 border-t border-border-color">
                    <h4 className="text-xs font-semibold text-text-secondary mb-1">
                      Sources:
                    </h4>
                    <ul className="text-xs space-y-1">
                      {msg.groundingChunks.map(
                        (chunk, i) =>
                          chunk.web && (
                            <li key={i}>
                              <a
                                href={chunk.web.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-400 hover:underline break-all">
                                {chunk.web.title || chunk.web.uri}
                              </a>
                            </li>
                          )
                      )}
                    </ul>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center">
                  <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              )}
            </div>
          );
        })}
        {isLoading && messages[messages.length - 1]?.role !== "model" && (
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent flex items-center justify-center">
              <BotIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="max-w-xl p-3 sm:p-4 rounded-xl bg-secondary flex items-center">
              <SpinnerIcon /> <span className="ml-2">Thinking...</span>
            </div>
          </div>
        )}
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-text-secondary p-8 flex flex-col justify-center items-center h-full">
            <ChatIcon className="mx-auto w-12 h-12 sm:w-16 sm:h-16" />
            <p className="mt-4 text-base sm:text-lg">
              Start a conversation with your IoT Oracle.
            </p>
            <p className="text-xs sm:text-sm">
              Ask about your next project, what parts you need, or for coding
              help!
            </p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 shrink-0 bg-primary">
        {attachedFile && (
          <div className="mb-2 px-3 py-2 bg-primary border border-border-color rounded-lg flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <PaperclipIcon />
              <span
                className="text-text-secondary truncate font-medium"
                title={attachedFile.name}>
                {attachedFile.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-text-secondary hover:text-text-primary p-1 rounded-full text-lg leading-none"
              aria-label="Remove attached file"
              title="Remove attached file">
              &times;
            </button>
          </div>
        )}
        <div className="flex items-center bg-secondary border border-border-color rounded-lg p-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt,.md,.json,.js,.py,.c,.cpp,.h,.ino"
            id="file-upload"
            aria-label="Upload document file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Attach file"
            title="Attach file">
            <PaperclipIcon />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              attachedFile
                ? `Add a comment about ${attachedFile.name}...`
                : "Plan your next project..."
            }
            rows={1}
            className="flex-1 bg-transparent px-2 resize-none focus:outline-none max-h-40"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !attachedFile)}
            className="bg-accent p-2 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
            title="Send message">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
