import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, ItemStatus, AiSuggestedPart, Project } from "../types";
import {
  getAiChatStream,
  analyzeProjectComplexity,
} from "../services/geminiService";
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
import ChatHistorySidebar from "./ChatHistorySidebar";

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
    allocateInventoryItems,
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
  const [isHistorySidebarCollapsed, setIsHistorySidebarCollapsed] =
    useState(false);

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

        // Check if it's a network error (server not running)
        if (error instanceof TypeError && error.message.includes("fetch")) {
          addToast("Chat server not available - using offline mode", "info");
          console.log("Server appears to be offline, using local fallback");
        } else {
          addToast("Failed to load chat history - using offline mode", "error");
        }

        // Fallback: create a local conversation with better UX
        const fallbackId = `local-${Date.now()}`;
        setCurrentConversationId(fallbackId);

        // Create a fallback conversation object
        const fallbackConversation = {
          id: fallbackId,
          title: "Offline Chat",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          messageCount: 0,
        };
        setConversations([fallbackConversation]);

        console.log("Using fallback conversation:", fallbackConversation);
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
                  suggestedProject:
                    projectData || msg.suggestedProject || undefined,
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
        projectDescription?: string;
        components: { name: string; quantity: number }[];
      }>(
        responseContent,
        "/// PROJECT_JSON_START ///",
        "/// PROJECT_JSON_END ///"
      );

      if (projectData) {
        console.log("Found project data:", projectData);
        // Auto-create project if AI suggests one
        handleCreateProject(
          projectData.components,
          projectData.projectName,
          projectData.projectDescription
        );
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

      // Parse and auto-execute project updates
      const { jsonData: projectUpdateAction } = parseJsonBlock<{
        action: string;
        projectId: string;
        projectName: string;
        updates: {
          status?: string;
          progress?: number;
          description?: string;
          notes?: string;
        };
        reason: string;
      }>(
        responseContent,
        "/// PROJECT_UPDATE_JSON_START ///",
        "/// PROJECT_UPDATE_JSON_END ///"
      );

      if (projectUpdateAction) {
        handleProjectUpdate(projectUpdateAction);
        addToast(
          `Updated project: ${projectUpdateAction.projectName}`,
          "success"
        );
      }

      // Parse and auto-execute inventory updates
      const { jsonData: inventoryUpdateAction } = parseJsonBlock<{
        action: string;
        itemId: string;
        itemName: string;
        updates: {
          status?: string;
          quantity?: number;
          location?: string;
          notes?: string;
        };
        reason: string;
      }>(
        responseContent,
        "/// INVENTORY_UPDATE_JSON_START ///",
        "/// INVENTORY_UPDATE_JSON_END ///"
      );

      if (inventoryUpdateAction) {
        handleInventoryUpdate(inventoryUpdateAction);
        addToast(
          `Updated inventory: ${inventoryUpdateAction.itemName}`,
          "success"
        );
      }

      // Parse and auto-execute price checks
      const { jsonData: priceCheckAction } = parseJsonBlock<{
        action: string;
        itemName: string;
        itemId: string;
        searchQuery: string;
        reason: string;
      }>(
        responseContent,
        "/// PRICE_CHECK_JSON_START ///",
        "/// PRICE_CHECK_JSON_END ///"
      );

      if (priceCheckAction) {
        handlePriceCheck(priceCheckAction);
        addToast(`Checking prices for: ${priceCheckAction.itemName}`, "info");
      }

      // Parse and auto-execute component relationships
      const { jsonData: componentRelationshipAction } = parseJsonBlock<{
        action: string;
        primaryComponent: {
          name: string;
          category: string;
          status: string;
        };
        relatedComponent: {
          name: string;
          category: string;
          status: string;
        };
        relationshipType: string;
        description: string;
        isRequired: boolean;
        createSeparateEntries: boolean;
        reason: string;
      }>(
        responseContent,
        "/// COMPONENT_RELATIONSHIP_JSON_START ///",
        "/// COMPONENT_RELATIONSHIP_JSON_END ///"
      );

      if (componentRelationshipAction) {
        handleComponentRelationship(componentRelationshipAction);
        addToast(
          `Created relationship: ${componentRelationshipAction.primaryComponent.name} ↔ ${componentRelationshipAction.relatedComponent.name}`,
          "success"
        );
      }

      // Parse and auto-execute component bundles
      const { jsonData: componentBundleAction } = parseJsonBlock<{
        action: string;
        bundleName: string;
        bundleDescription: string;
        bundleType: string;
        components: Array<{
          name: string;
          category: string;
        }>;
        reason: string;
      }>(
        responseContent,
        "/// COMPONENT_BUNDLE_JSON_START ///",
        "/// COMPONENT_BUNDLE_JSON_END ///"
      );

      if (componentBundleAction) {
        handleComponentBundle(componentBundleAction);
        addToast(
          `Created bundle: ${componentBundleAction.bundleName} with ${componentBundleAction.components.length} components`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error auto-executing AI suggestions:", error);
      addToast("Error processing AI suggestions", "error");
    }
  };

  const handleAddToInventory = async (
    part: AiSuggestedPart,
    status: ItemStatus
  ) => {
    // Use AI-suggested category or fallback to auto-suggestion
    let category = part.category;
    if (!category) {
      try {
        const { suggestCategory } = await import("../services/geminiService");
        category = await suggestCategory(part.name);
      } catch (error) {
        console.warn("Failed to auto-suggest category:", error);
      }
    }

    const newItem = {
      id: "", // Will be generated by context
      name: part.name,
      quantity: 1,
      location: status === ItemStatus.HAVE ? "Inventory" : "To be purchased",
      status: status,
      category: category,
      description: `Suggested by AI. Supplier: ${part.supplier}, Price: ${part.price}. Link: ${part.link}`,
      createdAt: new Date().toISOString(),
      imageUrl: undefined,
      // Add the new fields from AI suggestions
      manufacturer: part.manufacturer,
      modelNumber: part.modelNumber,
      supplier: part.supplier,
      purchasePrice: part.purchasePrice,
      currency: part.currency || "USD",
      condition: (part.condition as any) || "New",
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

  // Enhanced project creation with intelligent inventory allocation and sub-project support
  const handleCreateProject = async (
    projectData: { name: string; quantity: number }[],
    projectName: string,
    projectDescription?: string
  ) => {
    const projectComponents = [];
    const inventoryAllocations = [];
    const missingComponents = [];
    let allocatedFromInventory = 0;
    let totalComponents = projectData.length;

    // Analyze each component for inventory availability
    for (const aiComp of projectData) {
      const inventoryItem = inventory.find(
        (invItem) =>
          invItem.name.toLowerCase() === aiComp.name.toLowerCase() &&
          invItem.status === ItemStatus.HAVE
      );

      if (inventoryItem) {
        const availableQty =
          inventoryItem.quantity - (inventoryItem.allocatedQuantity || 0);
        const allocateQty = Math.min(aiComp.quantity, availableQty);

        if (allocateQty > 0) {
          // Component can be allocated from inventory
          projectComponents.push({
            id: `inventory-${inventoryItem.id}-${Date.now()}`,
            name: aiComp.name,
            quantity: allocateQty,
            source: "inventory" as const,
            inventoryItemId: inventoryItem.id,
            isAllocated: true,
          });

          inventoryAllocations.push({
            inventoryItemId: inventoryItem.id,
            quantity: allocateQty,
            projectId: "", // Will be set after project creation
            projectName: projectName,
          });

          allocatedFromInventory++;

          // If we need more than available, add the remainder as AI-suggested
          if (aiComp.quantity > allocateQty) {
            projectComponents.push({
              id: `ai-${Date.now()}-${aiComp.name.replace(
                /\s/g,
                ""
              )}-remainder`,
              name: aiComp.name,
              quantity: aiComp.quantity - allocateQty,
              source: "ai-suggested" as const,
            });
            missingComponents.push(
              `${aiComp.quantity - allocateQty} x ${aiComp.name}`
            );
          }
        } else {
          // No available quantity, add as AI-suggested
          projectComponents.push({
            id: `ai-${Date.now()}-${aiComp.name.replace(/\s/g, "")}`,
            name: aiComp.name,
            quantity: aiComp.quantity,
            source: "ai-suggested" as const,
          });
          missingComponents.push(`${aiComp.quantity} x ${aiComp.name}`);
        }
      } else {
        // Component not found in inventory, add as AI-suggested
        projectComponents.push({
          id: `ai-${Date.now()}-${aiComp.name.replace(/\s/g, "")}`,
          name: aiComp.name,
          quantity: aiComp.quantity,
          source: "ai-suggested" as const,
        });
        missingComponents.push(`${aiComp.quantity} x ${aiComp.name}`);
      }
    }

    // Create project notes with allocation info
    let notes = `Project structure generated by IoT Oracle AI on ${new Date().toLocaleDateString()}.\n\n`;
    notes += `Components identified:\n${projectData
      .map((c) => `- ${c.quantity} x ${c.name}`)
      .join("\n")}\n\n`;

    if (allocatedFromInventory > 0) {
      notes += `✅ Allocated from inventory: ${allocatedFromInventory}/${totalComponents} components\n`;
    }

    if (missingComponents.length > 0) {
      notes += `⚠️ Components needed:\n${missingComponents
        .map((c) => `- ${c}`)
        .join("\n")}\n`;
    }

    const newProject: Omit<Project, "id" | "createdAt"> = {
      name: projectName,
      description: `AI-suggested project with smart inventory allocation`,
      longDescription: `AI-generated project that automatically allocates available components from your inventory and identifies missing components for procurement.`,
      category: undefined,
      difficulty: "Intermediate",
      estimatedTime: undefined,
      components: projectComponents,
      instructions: undefined,
      updatedAt: new Date().toISOString(),
      status: "Planning",
      progress: 0,
      notes,
      tags: ["AI-Generated"],
    };

    try {
      // Analyze project complexity for potential sub-project breakdown
      let complexityAnalysis = null;
      if (projectDescription && projectDescription.length > 100) {
        try {
          complexityAnalysis = await analyzeProjectComplexity(
            projectName,
            projectDescription
          );
        } catch (error) {
          console.log(
            "Complexity analysis failed, proceeding with single project"
          );
        }
      }

      const createdProject = await addProject(newProject);

      // Allocate inventory items if any
      if (inventoryAllocations.length > 0) {
        const allocationsWithProjectId = inventoryAllocations.map((alloc) => ({
          ...alloc,
          projectId: createdProject.id,
        }));
        await allocateInventoryItems(allocationsWithProjectId);
      }

      // Create sub-projects if complexity analysis suggests it
      if (
        complexityAnalysis &&
        complexityAnalysis.isComplex &&
        complexityAnalysis.suggestedSubProjects.length > 0
      ) {
        const subProjectIds = [];

        for (const subProjectSuggestion of complexityAnalysis.suggestedSubProjects) {
          const subProjectComponents = subProjectSuggestion.components.map(
            (compName, index) => ({
              id: `sub-${Date.now()}-${index}`,
              name: compName,
              quantity: 1,
              source: "ai-suggested" as const,
            })
          );

          const subProject: Omit<Project, "id" | "createdAt"> = {
            name: `${projectName} - ${subProjectSuggestion.name}`,
            description: subProjectSuggestion.description,
            longDescription: `Sub-project of "${projectName}". ${subProjectSuggestion.description}`,
            category: newProject.category,
            difficulty: newProject.difficulty,
            estimatedTime: subProjectSuggestion.estimatedTime,
            components: subProjectComponents,
            instructions: undefined,
            updatedAt: new Date().toISOString(),
            status: "Planning",
            progress: 0,
            notes: `Sub-project created by AI analysis. Phase ${subProjectSuggestion.phase} of main project.`,
            tags: [
              "AI-Generated",
              "Sub-Project",
              `Phase-${subProjectSuggestion.phase}`,
            ],
            parentProjectId: createdProject.id,
            isSubProject: true,
            phase: subProjectSuggestion.phase,
            dependencies: subProjectSuggestion.dependencies,
          };

          const createdSubProject = await addProject(subProject);
          subProjectIds.push(createdSubProject.id);
        }

        // Update main project with sub-project references
        const updatedMainProject = {
          ...createdProject,
          subProjects: subProjectIds,
          notes: `${notes}\n\n🔗 Sub-projects created:\n${complexityAnalysis.suggestedSubProjects
            .map((sp, i) => `Phase ${sp.phase}: ${sp.name}`)
            .join("\n")}\n\nReasoning: ${complexityAnalysis.reasoning}`,
        };

        await updateProject(updatedMainProject);

        addToast(
          `Complex project "${projectName}" created with ${subProjectIds.length} sub-projects!`,
          "success"
        );
      } else {
        // Create detailed success message for single project
        let successMessage = `Project "${projectName}" created!`;
        if (allocatedFromInventory > 0) {
          successMessage += ` ${allocatedFromInventory} components allocated from inventory.`;
        }
        if (missingComponents.length > 0) {
          successMessage += ` ${missingComponents.length} components need to be acquired.`;
        }

        addToast(successMessage, "success");
      }
    } catch (error) {
      console.error("Failed to create AI project:", error);
      addToast("Failed to create project", "error");
    }
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

  const handleProjectUpdate = (updateData: {
    action: string;
    projectId: string;
    projectName: string;
    updates: {
      status?: string;
      progress?: number;
      description?: string;
      notes?: string;
    };
    reason: string;
  }) => {
    const project = projects.find((p) => p.id === updateData.projectId);

    if (!project) {
      addToast(`Could not find project: ${updateData.projectName}`, "error");
      return;
    }

    // Build the updated project object
    const updatedProject = { ...project };
    let changes: string[] = [];

    if (
      updateData.updates.status &&
      updateData.updates.status !== project.status
    ) {
      updatedProject.status = updateData.updates.status as any;
      changes.push(`status to "${updateData.updates.status}"`);
    }

    if (
      updateData.updates.progress !== undefined &&
      updateData.updates.progress !== project.progress
    ) {
      updatedProject.progress = updateData.updates.progress;
      changes.push(`progress to ${updateData.updates.progress}%`);
    }

    if (
      updateData.updates.description &&
      updateData.updates.description !== project.description
    ) {
      updatedProject.description = updateData.updates.description;
      changes.push("description");
    }

    if (updateData.updates.notes) {
      const timestamp = new Date().toLocaleString();
      const newNote = `\n\n[${timestamp}] AI Update: ${updateData.updates.notes}`;
      updatedProject.notes = (project.notes || "") + newNote;
      changes.push("notes");
    }

    if (changes.length > 0) {
      updatedProject.updatedAt = new Date().toISOString();
      updateProject(updatedProject);

      addToast(`Updated ${project.name}: ${changes.join(", ")}`, "success");
    } else {
      addToast("No changes needed for project", "info");
    }
  };

  const handleInventoryUpdate = (updateData: {
    action: string;
    itemId: string;
    itemName: string;
    updates: {
      status?: string;
      quantity?: number;
      location?: string;
      serialNumber?: string;
      modelNumber?: string;
      manufacturer?: string;
      purchaseDate?: string;
      receivedDate?: string;
      purchasePrice?: number;
      currency?: string;
      supplier?: string;
      invoiceNumber?: string;
      condition?: string;
      notes?: string;
    };
    reason: string;
  }) => {
    const item = inventory.find((i) => i.id === updateData.itemId);

    if (!item) {
      addToast(
        `Could not find inventory item: ${updateData.itemName}`,
        "error"
      );
      return;
    }

    // Build the updated item object
    const updatedItem = { ...item };
    let changes: string[] = [];

    if (
      updateData.updates.status &&
      updateData.updates.status !== item.status
    ) {
      updatedItem.status = updateData.updates.status as any;
      changes.push(`status to "${updateData.updates.status}"`);
    }

    if (
      updateData.updates.quantity !== undefined &&
      updateData.updates.quantity !== item.quantity
    ) {
      updatedItem.quantity = updateData.updates.quantity;
      changes.push(`quantity to ${updateData.updates.quantity}`);
    }

    if (
      updateData.updates.location &&
      updateData.updates.location !== item.location
    ) {
      updatedItem.location = updateData.updates.location;
      changes.push(`location to "${updateData.updates.location}"`);
    }

    // Handle all the new fields
    if (
      updateData.updates.serialNumber &&
      updateData.updates.serialNumber !== item.serialNumber
    ) {
      updatedItem.serialNumber = updateData.updates.serialNumber;
      changes.push(`serial number to "${updateData.updates.serialNumber}"`);
    }

    if (
      updateData.updates.modelNumber &&
      updateData.updates.modelNumber !== item.modelNumber
    ) {
      updatedItem.modelNumber = updateData.updates.modelNumber;
      changes.push(`model number to "${updateData.updates.modelNumber}"`);
    }

    if (
      updateData.updates.manufacturer &&
      updateData.updates.manufacturer !== item.manufacturer
    ) {
      updatedItem.manufacturer = updateData.updates.manufacturer;
      changes.push(`manufacturer to "${updateData.updates.manufacturer}"`);
    }

    if (
      updateData.updates.purchaseDate &&
      updateData.updates.purchaseDate !== item.purchaseDate
    ) {
      updatedItem.purchaseDate = updateData.updates.purchaseDate;
      changes.push(`purchase date to "${updateData.updates.purchaseDate}"`);
    }

    if (
      updateData.updates.receivedDate &&
      updateData.updates.receivedDate !== item.receivedDate
    ) {
      updatedItem.receivedDate = updateData.updates.receivedDate;
      changes.push(`received date to "${updateData.updates.receivedDate}"`);
    }

    if (
      updateData.updates.purchasePrice !== undefined &&
      updateData.updates.purchasePrice !== item.purchasePrice
    ) {
      updatedItem.purchasePrice = updateData.updates.purchasePrice;
      changes.push(
        `purchase price to ${updateData.updates.currency || "$"}${
          updateData.updates.purchasePrice
        }`
      );
    }

    if (
      updateData.updates.currency &&
      updateData.updates.currency !== item.currency
    ) {
      updatedItem.currency = updateData.updates.currency;
      changes.push(`currency to "${updateData.updates.currency}"`);
    }

    if (
      updateData.updates.supplier &&
      updateData.updates.supplier !== item.supplier
    ) {
      updatedItem.supplier = updateData.updates.supplier;
      changes.push(`supplier to "${updateData.updates.supplier}"`);
    }

    if (
      updateData.updates.invoiceNumber &&
      updateData.updates.invoiceNumber !== item.invoiceNumber
    ) {
      updatedItem.invoiceNumber = updateData.updates.invoiceNumber;
      changes.push(`invoice number to "${updateData.updates.invoiceNumber}"`);
    }

    if (
      updateData.updates.condition &&
      updateData.updates.condition !== item.condition
    ) {
      updatedItem.condition = updateData.updates.condition as any;
      changes.push(`condition to "${updateData.updates.condition}"`);
    }

    if (updateData.updates.notes) {
      const timestamp = new Date().toLocaleString();
      const newNote = `\n\n[${timestamp}] AI Update: ${updateData.updates.notes}`;
      updatedItem.description = (item.description || "") + newNote;
      changes.push("notes");
    }

    if (changes.length > 0) {
      updateItem(updatedItem);

      addToast(`Updated ${item.name}: ${changes.join(", ")}`, "success");
    } else {
      addToast("No changes needed for inventory item", "info");
    }
  };

  const handlePriceCheck = async (priceData: {
    action: string;
    itemName: string;
    itemId: string;
    searchQuery: string;
    reason: string;
  }) => {
    try {
      // Find the inventory item
      const item = inventory.find((i) => i.id === priceData.itemId);

      if (!item) {
        addToast(
          `Could not find inventory item: ${priceData.itemName}`,
          "error"
        );
        return;
      }

      // Check if we have recent market data (less than 24 hours old)
      const now = new Date();
      const lastRefreshed = item.lastRefreshed
        ? new Date(item.lastRefreshed)
        : null;
      const isDataFresh =
        lastRefreshed &&
        now.getTime() - lastRefreshed.getTime() < 24 * 60 * 60 * 1000;

      if (isDataFresh && item.marketData && item.marketData.length > 0) {
        addToast(`Using recent price data for ${item.name}`, "info");
        return;
      }

      // Get fresh market data using the AI service
      const { getComponentIntelligence } = await import(
        "../services/geminiService"
      );
      const intelligence = await getComponentIntelligence(item.name);

      // Update the item with new market data
      const updatedItem = {
        ...item,
        marketData: intelligence.marketData,
        lastRefreshed: new Date().toISOString(),
      };

      updateItem(updatedItem);

      addToast(
        `Updated prices for ${item.name} - found ${intelligence.marketData.length} suppliers`,
        "success"
      );
    } catch (error) {
      console.error("Failed to check prices:", error);
      addToast(`Failed to check prices for ${priceData.itemName}`, "error");
    }
  };

  const handleComponentRelationship = async (relationshipAction: {
    action: string;
    primaryComponent: {
      name: string;
      category: string;
      status: string;
    };
    relatedComponent: {
      name: string;
      category: string;
      status: string;
    };
    relationshipType: string;
    description: string;
    isRequired: boolean;
    createSeparateEntries: boolean;
    reason: string;
  }) => {
    try {
      console.log("Creating component relationship:", relationshipAction);

      if (relationshipAction.createSeparateEntries) {
        // Create primary component
        const primaryStatus =
          relationshipAction.primaryComponent.status === "I Have"
            ? ItemStatus.HAVE
            : relationshipAction.primaryComponent.status === "I Need"
            ? ItemStatus.NEED
            : ItemStatus.WANT;

        const primaryItem = {
          id: "", // Will be generated
          name: relationshipAction.primaryComponent.name,
          quantity: 1,
          location: "Inventory",
          status: primaryStatus,
          category: relationshipAction.primaryComponent.category,
          description: `${relationshipAction.relationshipType} ${relationshipAction.relatedComponent.name}. ${relationshipAction.description}`,
          createdAt: new Date().toISOString(),
        };

        await addItem(primaryItem);

        // Create related component
        const relatedStatus =
          relationshipAction.relatedComponent.status === "I Have"
            ? ItemStatus.HAVE
            : relationshipAction.relatedComponent.status === "I Need"
            ? ItemStatus.NEED
            : ItemStatus.WANT;

        const relatedItem = {
          id: "", // Will be generated
          name: relationshipAction.relatedComponent.name,
          quantity: 1,
          location: "Inventory",
          status: relatedStatus,
          category: relationshipAction.relatedComponent.category,
          description: `Works with ${relationshipAction.primaryComponent.name}. ${relationshipAction.description}`,
          createdAt: new Date().toISOString(),
        };

        await addItem(relatedItem);

        // Create relationship between components (this would require API call)
        console.log(
          `Would create relationship between components when API is available`
        );

        addToast(
          `Created separate entries: ${relationshipAction.primaryComponent.name} and ${relationshipAction.relatedComponent.name}`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error creating component relationship:", error);
      addToast("Failed to create component relationship", "error");
    }
  };

  const handleComponentBundle = async (bundleAction: {
    action: string;
    bundleName: string;
    bundleDescription: string;
    bundleType: string;
    components: Array<{
      name: string;
      category: string;
    }>;
    reason: string;
  }) => {
    try {
      console.log("Creating component bundle:", bundleAction);

      // Create individual components first
      const createdComponentIds: string[] = [];

      for (const component of bundleAction.components) {
        const item = {
          id: "", // Will be generated
          name: component.name,
          quantity: 1,
          location: "Inventory",
          status: ItemStatus.HAVE, // Assume bundle components are owned
          category: component.category,
          description: `Part of ${bundleAction.bundleName} bundle. ${bundleAction.bundleDescription}`,
          createdAt: new Date().toISOString(),
        };

        await addItem(item);
        // Note: In a real implementation, we'd need the API to return the created item ID
        createdComponentIds.push(`generated-id-${Date.now()}-${Math.random()}`);
      }

      // Create bundle (this would require API call to bundle service)
      console.log(
        `Would create bundle "${bundleAction.bundleName}" with components:`,
        createdComponentIds
      );

      addToast(
        `Created bundle "${bundleAction.bundleName}" with ${bundleAction.components.length} components`,
        "success"
      );
    } catch (error) {
      console.error("Error creating component bundle:", error);
      addToast("Failed to create component bundle", "error");
    }
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
    <div className="flex h-full w-full relative">
      {/* Main Chat Area */}
      <div
        className={`flex flex-col h-full transition-all duration-300 ${
          isHistorySidebarCollapsed ? "mr-12" : "mr-80"
        } flex-1`}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
              Chat Assistant
            </h1>
            <div className="flex items-center gap-2">
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
            const {
              displayContent: contentAfterAnalysis,
              jsonData: analysisAction,
            } = parseJsonBlock<{
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
            const {
              displayContent: contentAfterProjectUpdate,
              jsonData: projectUpdateAction,
            } = parseJsonBlock<{
              action: string;
              projectId: string;
              projectName: string;
              updates: {
                status?: string;
                progress?: number;
                description?: string;
                notes?: string;
              };
              reason: string;
            }>(
              contentAfterAnalysis,
              "/// PROJECT_UPDATE_JSON_START ///",
              "/// PROJECT_UPDATE_JSON_END ///"
            );
            const {
              displayContent: contentAfterInventoryUpdate,
              jsonData: inventoryUpdateAction,
            } = parseJsonBlock<{
              action: string;
              itemId: string;
              itemName: string;
              updates: {
                status?: string;
                quantity?: number;
                location?: string;
                notes?: string;
              };
              reason: string;
            }>(
              contentAfterProjectUpdate,
              "/// INVENTORY_UPDATE_JSON_START ///",
              "/// INVENTORY_UPDATE_JSON_END ///"
            );
            const { displayContent, jsonData: priceCheckAction } =
              parseJsonBlock<{
                action: string;
                itemName: string;
                itemId: string;
                searchQuery: string;
                reason: string;
              }>(
                contentAfterInventoryUpdate,
                "/// PRICE_CHECK_JSON_START ///",
                "/// PRICE_CHECK_JSON_END ///"
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
                    msg.role === "user"
                      ? "bg-accent text-white"
                      : "bg-secondary"
                  }`}>
                  <div className="prose prose-invert text-text-primary prose-p:my-0 prose-pre:my-2 prose-strong:text-text-primary prose-em:text-text-primary">
                    {parseContent(displayContent)}
                  </div>

                  {(suggestions ||
                    project ||
                    moveAction ||
                    transferAction ||
                    templateAction ||
                    analysisAction ||
                    projectUpdateAction ||
                    inventoryUpdateAction ||
                    priceCheckAction) && (
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
                            {moveAction.quantity}x {moveAction.componentName}{" "}
                            from{" "}
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
                              (item) =>
                                item.id === transferAction.inventoryItemId
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
                                addToast(
                                  "Template feature coming soon!",
                                  "info"
                                )
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
                      {projectUpdateAction && (
                        <div className="bg-primary/50 p-3 rounded-lg">
                          <p className="font-semibold text-text-primary text-sm flex items-center gap-2">
                            <ProjectsIcon /> Update:{" "}
                            {projectUpdateAction.projectName}
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            {projectUpdateAction.reason}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleProjectUpdate(projectUpdateAction)
                              }
                              className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 px-2 py-1 rounded-md transition-colors w-full text-center">
                              Apply Updates
                            </button>
                          </div>
                          <div className="mt-2 text-xs text-text-secondary">
                            {projectUpdateAction.updates &&
                              Object.entries(projectUpdateAction.updates).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex justify-between">
                                    <span className="capitalize">{key}:</span>
                                    <span className="text-text-primary">
                                      {value}
                                    </span>
                                  </div>
                                )
                              )}
                          </div>
                        </div>
                      )}
                      {inventoryUpdateAction && (
                        <div className="bg-primary/50 p-3 rounded-lg">
                          <p className="font-semibold text-text-primary text-sm flex items-center gap-2">
                            📦 Update: {inventoryUpdateAction.itemName}
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            {inventoryUpdateAction.reason}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleInventoryUpdate(inventoryUpdateAction)
                              }
                              className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/40 px-2 py-1 rounded-md transition-colors w-full text-center">
                              Apply Updates
                            </button>
                          </div>
                          <div className="mt-2 text-xs text-text-secondary">
                            {inventoryUpdateAction.updates &&
                              Object.entries(inventoryUpdateAction.updates).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex justify-between">
                                    <span className="capitalize">{key}:</span>
                                    <span className="text-text-primary">
                                      {value}
                                    </span>
                                  </div>
                                )
                              )}
                          </div>
                        </div>
                      )}
                      {priceCheckAction && (
                        <div className="bg-primary/50 p-3 rounded-lg">
                          <p className="font-semibold text-text-primary text-sm flex items-center gap-2">
                            💰 Price Check: {priceCheckAction.itemName}
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            {priceCheckAction.reason}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              type="button"
                              onClick={() => handlePriceCheck(priceCheckAction)}
                              className="text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40 px-2 py-1 rounded-md transition-colors w-full text-center">
                              Check Current Prices
                            </button>
                          </div>
                          <div className="mt-2 text-xs text-text-secondary">
                            <p>Search: {priceCheckAction.searchQuery}</p>
                          </div>
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
                              onClick={async () =>
                                await handleAddToInventory(
                                  part,
                                  ItemStatus.NEED
                                )
                              }
                              className="text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40 px-2 py-1 rounded-md transition-colors">
                              To Required
                            </button>
                            <button
                              type="button"
                              onClick={async () =>
                                await handleAddToInventory(
                                  part,
                                  ItemStatus.WANT
                                )
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

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        conversations={conversations}
        activeConversationId={currentConversationId}
        onSwitchConversation={switchConversation}
        onDeleteConversation={deleteConversation}
        onNewConversation={createNewConversation}
        isCollapsed={isHistorySidebarCollapsed}
        onToggleCollapse={() =>
          setIsHistorySidebarCollapsed(!isHistorySidebarCollapsed)
        }
      />
    </div>
  );
};

export default ChatView;
