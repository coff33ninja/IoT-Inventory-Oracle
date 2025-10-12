import { GoogleGenAI, Chat, GenerateContentResponse, Content, Type } from "@google/genai";
import { InventoryItem, ChatMessage, AiInsights, MarketDataItem } from "../types";

if (!import.meta.env.VITE_API_KEY) {
  throw new Error("VITE_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const model = 'gemini-2.5-flash';

const getChat = (history: ChatMessage[]): Chat => {
    const formattedHistory: Content[] = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));
    
    return ai.chats.create({
        model: model,
        history: formattedHistory,
        config: {
            systemInstruction: `You are an expert IoT project assistant and inventory manager called 'IoT Oracle'. 
            Your primary role is to help users manage their electronics components inventory and plan their projects.
            
            Current Inventory & Project Context:
            You will be provided with:
            1. A JSON array of the user's full inventory with status fields ('I Have', 'I Want', 'I Need', etc.)
            2. A JSON array of the user's current projects with their components
            3. A conversation context summary with recent operations and active discussions
            
            **ENHANCED CAPABILITIES FOR CROSS-PROJECT MANAGEMENT:**
            
            1. **Project & Inventory Management**: You can help users move components between projects, transfer items from inventory to projects, and reorganize their setup. Always reference specific project IDs and item IDs when suggesting moves.
            
            2. **Context-Aware Recommendations**: Use the conversation context to understand what the user has been working on recently. If they've been discussing a specific project, maintain that context across multiple messages.
            
            3. **Cross-Project Analysis**: Compare projects to identify shared components, suggest consolidation opportunities, or recommend splitting large projects.
            
            4. **Smart Component Allocation**: When users ask about moving items between projects, analyze the impact on both source and destination projects before making recommendations.
            
            5. **Project Suggestion & Creation**: Based on the user's 'I Have' inventory, suggest interesting IoT projects they could build. Provide a detailed description, a component list (differentiating between what they have and what they might need from their wishlist), and starter code. If you suggest a project, you MUST also provide a JSON block for project creation.
            
            6. **Part Sourcing**: If a project requires a part the user doesn't have, use your search tool to find it online. Present findings in a markdown table ('Part Name', 'Supplier', 'Price', 'Link'). This should be followed by a JSON block for interactive part addition.
            
            7. **Code Generation**: Provide helpful code snippets (e.g., for Arduino, ESP32, Raspberry Pi) when requested. Wrap code in appropriate markdown code blocks with language identifiers.
            
            8. **Document Analysis**: The user may upload a document (e.g., a project plan, datasheet notes, or code file). The content will be provided in their prompt, clearly marked. Your task is to analyze this document and respond to the user's request based on its content.
            
            **CRITICAL OUTPUT FORMATTING RULES (JSON BLOCKS):**
            You MUST provide machine-readable JSON for interactive actions. These blocks must come AFTER your conversational text.
            
            **AUTO-POPULATION BEHAVIOR:**
            When users discuss projects or components, you should PROACTIVELY suggest and auto-populate:
            1. Missing components they might need (as SUGGESTIONS_JSON)
            2. Project structures when they describe what they want to build (as PROJECT_JSON)
            3. Component moves when discussing optimization (as MOVE_JSON or TRANSFER_JSON)
            
            Be generous with suggestions - it's better to suggest too much than too little. Users can always remove items later.
            
            **TRIGGER SCENARIOS FOR AUTO-POPULATION:**
            - User mentions wanting to build something → Suggest PROJECT_JSON
            - User asks "what do I need for..." → Suggest SUGGESTIONS_JSON with missing parts
            - User discusses project optimization → Suggest MOVE_JSON or TRANSFER_JSON
            - User mentions a specific component → Suggest related components in SUGGESTIONS_JSON
            - User asks about project ideas → Suggest multiple PROJECT_JSON blocks
            - User describes a problem they want to solve → Suggest PROJECT_JSON with solution
            - User mentions learning about electronics → Suggest beginner-friendly PROJECT_JSON
            - User talks about upgrading existing projects → Suggest SUGGESTIONS_JSON with better components
            
            **PROACTIVE BEHAVIOR EXAMPLES:**
            - If user says "I want to monitor temperature" → Auto-suggest temperature sensor project
            - If user says "I have an Arduino" → Auto-suggest 3-5 beginner projects they can build
            - If user mentions "LED" → Auto-suggest LED strip controller, RGB projects, etc.
            - If user talks about "automation" → Auto-suggest home automation projects
            
            Always include JSON blocks when these scenarios occur, even if the user doesn't explicitly ask for them. Be generous with suggestions!
            
            - **For Part Suggestions (AUTO-POPULATED):**
            \`\`\`json
            /// SUGGESTIONS_JSON_START ///
            [{"name": "Part Name", "supplier": "Supplier", "price": "Price", "link": "URL"}]
            /// SUGGESTIONS_JSON_END ///
            \`\`\`

            - **For Project Creation (AUTO-POPULATED):**
            \`\`\`json
            /// PROJECT_JSON_START ///
            {
              "projectName": "The Name of Your Suggested Project",
              "components": [
                { "name": "Component Name from Project", "quantity": 1 },
                { "name": "Another Component", "quantity": 4 }
              ]
            }
            /// PROJECT_JSON_END ///
            \`\`\`

            - **For Component Moves/Transfers (NEW):**
            \`\`\`json
            /// MOVE_JSON_START ///
            {
              "action": "move_component",
              "sourceProjectId": "project-id-123",
              "targetProjectId": "project-id-456", 
              "componentName": "Arduino Uno",
              "quantity": 1,
              "reason": "Better suited for the new project requirements"
            }
            /// MOVE_JSON_END ///
            \`\`\`

            - **For Inventory to Project Transfers (NEW):**
            \`\`\`json
            /// TRANSFER_JSON_START ///
            {
              "action": "transfer_to_project",
              "inventoryItemId": "item-id-123",
              "targetProjectId": "project-id-456",
              "quantity": 2,
              "reason": "Adding available components to project"
            }
            /// TRANSFER_JSON_END ///
            \`\`\`

            - **For Project Templates (NEW):**
            \`\`\`json
            /// TEMPLATE_JSON_START ///
            {
              "action": "suggest_template",
              "templateId": "smart-led-strip",
              "templateName": "Smart LED Strip Controller",
              "matchingComponents": ["ESP32", "RGB LED Strip"],
              "missingComponents": ["MOSFET", "12V Power Supply"],
              "reason": "Based on your available components, this template is 60% ready"
            }
            /// TEMPLATE_JSON_END ///
            \`\`\`

            - **For Component Analysis (NEW):**
            \`\`\`json
            /// ANALYSIS_JSON_START ///
            {
              "action": "component_analysis",
              "issues": [
                {"type": "compatibility", "message": "ESP32 voltage levels may not be compatible with 5V sensors"},
                {"type": "missing", "message": "Project requires pull-up resistors for I2C communication"}
              ],
              "suggestions": [
                {"type": "alternative", "component": "ESP32", "alternative": "Arduino Uno", "reason": "Better 5V compatibility"},
                {"type": "addition", "component": "10kΩ Resistor", "quantity": 2, "reason": "Required for I2C pull-ups"}
              ]
            }
            /// ANALYSIS_JSON_END ///
            \`\`\`

            **IMPORTANT CONTEXT MANAGEMENT:**
            - Always reference specific IDs when discussing projects or inventory items
            - Remember recent operations and build upon them in follow-up responses
            - If context seems lost, ask for clarification rather than making assumptions
            - When suggesting moves between projects, explain the reasoning and potential impact

            Interaction Style:
            Be concise, helpful, and professional. Format your responses for clarity using markdown. Maintain conversation continuity by referencing previous discussions when relevant.
            `,
            tools: [{googleSearch: {}}],
        },
    });
}

// Enhanced context management for better cross-conversation memory
interface ContextSummary {
    recentProjects: Array<{id: string, name: string, status: string, componentCount: number}>;
    recentOperations: Array<{type: 'move' | 'create' | 'update', entity: string, details: string}>;
    activeDiscussion: string | null;
}

const createContextSummary = (history: ChatMessage[], projects: any[]): ContextSummary => {
    const recentProjects = projects.slice(-5).map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        componentCount: p.components.length
    }));

    // Extract recent operations from chat history
    const recentOperations: ContextSummary['recentOperations'] = [];
    const recentMessages = history.slice(-10);
    
    for (const msg of recentMessages) {
        if (msg.content.includes('moved') || msg.content.includes('transferred')) {
            recentOperations.push({
                type: 'move',
                entity: 'item',
                details: msg.content.substring(0, 100) + '...'
            });
        }
        if (msg.content.includes('created project') || msg.content.includes('new project')) {
            recentOperations.push({
                type: 'create',
                entity: 'project',
                details: msg.content.substring(0, 100) + '...'
            });
        }
    }

    // Determine active discussion topic
    let activeDiscussion = null;
    const lastUserMessage = [...history].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
        if (lastUserMessage.content.toLowerCase().includes('project')) {
            activeDiscussion = 'project_management';
        } else if (lastUserMessage.content.toLowerCase().includes('move') || 
                   lastUserMessage.content.toLowerCase().includes('transfer')) {
            activeDiscussion = 'item_management';
        }
    }

    return { recentProjects, recentOperations, activeDiscussion };
};

const pruneHistory = (history: ChatMessage[], maxMessages: number = 20): ChatMessage[] => {
    if (history.length <= maxMessages) return history;
    
    // Keep first 2 messages (usually contain important context)
    // Keep last maxMessages-2 messages (recent conversation)
    const start = history.slice(0, 2);
    const end = history.slice(-(maxMessages - 2));
    
    // Add a summary message to bridge the gap
    const summaryMessage: ChatMessage = {
        role: 'model',
        content: '[Context Summary: Previous conversation covered project planning and component management. Continuing from recent discussion...]'
    };
    
    return [...start, summaryMessage, ...end];
};

export const getAiChatStream = async (
    message: string,
    history: ChatMessage[],
    fullInventory: InventoryItem[],
    projects: any[] = []
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    
    // Prune history to manage context limits while preserving key information
    const prunedHistory = pruneHistory(history);
    const contextSummary = createContextSummary(history, projects);
    
    const chat = getChat(prunedHistory);
    
    const inventoryContext = `
      Here is the user's full inventory, including items with various statuses (I Have, I Want, I Need, etc.):
      ${JSON.stringify(fullInventory, null, 2)}
    `;

    const projectContext = projects.length > 0 ? `
      Here are the user's current projects:
      ${JSON.stringify(projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          components: p.components,
          description: p.description
      })), null, 2)}
    ` : '';

    const contextSummaryText = `
      CONVERSATION CONTEXT:
      - Recent Projects: ${contextSummary.recentProjects.map(p => `${p.name} (${p.status}, ${p.componentCount} components)`).join(', ')}
      - Recent Operations: ${contextSummary.recentOperations.map(op => `${op.type} ${op.entity}: ${op.details}`).join('; ')}
      - Active Discussion: ${contextSummary.activeDiscussion || 'general'}
      
      IMPORTANT: You can reference specific projects and inventory items by their IDs. When suggesting moves or transfers between projects, always specify the exact project IDs and item IDs involved.
    `;

    const fullPrompt = `${contextSummaryText}\n\n${inventoryContext}\n\n${projectContext}\n\nUser's request: ${message}`;
    
    try {
        const response = await chat.sendMessageStream({ message: fullPrompt });
        return response;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to get a response from the AI.");
    }
};

export const generateDescription = async (itemName: string): Promise<string> => {
    try {
        const prompt = `Provide a concise, one-sentence technical description for the following electronics component: "${itemName}". Focus on its primary function and key specifications.`;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text.trim();
    } catch(error) {
        console.error("Gemini description generation failed:", error);
        throw new Error("Failed to generate description from AI.");
    }
};

export const suggestCategory = async (itemName: string): Promise<string> => {
    try {
        const prompt = `Categorize the following electronic component: "${itemName}".
        Choose the single best category from this list:
        - Microcontroller
        - Development Board
        - Single-Board Computer
        - Sensor
        - Actuator
        - Display
        - Power Supply
        - Connector
        - Passive Component (e.g., resistor, capacitor)
        - Active Component (e.g., transistor, diode)
        - Module / Shield
        - Cable / Wire
        - Miscellaneous

        Your response must be ONLY the category name, with no extra text or explanation.`;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        
        return response.text.trim();

    } catch(error) {
        console.error("Gemini category suggestion failed:", error);
        throw new Error("Failed to suggest category from AI.");
    }
};

export const getComponentIntelligence = async (itemName: string): Promise<{ aiInsights: AiInsights, marketData: MarketDataItem[] }> => {
    try {
        const prompt = `
            Analyze the electronics component "${itemName}".
            1. Provide a detailed technical paragraph about the component, including its primary uses, key features, and common applications in IoT projects.
            2. Suggest 2-3 innovative project ideas that prominently feature this component.
            3. Use your search tool to find its current price from at least two online suppliers.

            CRITICAL: Your entire response MUST be only a single, raw JSON object. Do not wrap it in markdown, and do not include any other text, comments, or explanations.
            The JSON object must conform to this exact structure:
            {
              "detailedDescription": "A detailed technical paragraph...",
              "projectIdeas": ["Project idea 1", "Project idea 2"],
              "marketData": [
                {
                  "supplier": "Supplier Name",
                  "price": "$12.99",
                  "link": "https://example.com/product_link"
                }
              ]
            }
        `;
        
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                // responseMimeType and responseSchema are not compatible with tools
                tools: [{googleSearch: {}}],
            }
        });

        let jsonString = response.text.trim();
        // Clean potential markdown wrappers just in case the model adds them
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.substring(7, jsonString.length - 3).trim();
        } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.substring(3, jsonString.length - 3).trim();
        }
        
        const parsedJson = JSON.parse(jsonString);
        
        const result = {
            aiInsights: {
                detailedDescription: parsedJson.detailedDescription,
                projectIdeas: parsedJson.projectIdeas
            },
            marketData: parsedJson.marketData
        };

        if (!result.aiInsights || !result.marketData) {
            throw new Error("Parsed JSON from AI is missing required fields.");
        }

        return result;

    } catch (error) {
        console.error("Gemini component intelligence failed:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the AI's JSON response for component intelligence.");
        }
        throw new Error("Failed to get component intelligence from AI.");
    }
};

export const analyzeGithubRepo = async (repoUrl: string): Promise<{ name: string; quantity: number }[]> => {
    try {
        const prompt = `
            Analyze the public GitHub repository at ${repoUrl}.
            Examine its code, especially files like 'platformio.ini', 'Cargo.toml', '.ino' sketches, 'requirements.txt', or 'package.json' to identify the physical electronic hardware components required to build the project.
            List only the physical components (like sensors, microcontrollers, motors, shields), not abstract software libraries.
            Your response MUST be only a single, raw JSON object, with no markdown formatting or other text.
            The JSON object should be an array where each item represents a component and has a 'name' (string) and 'quantity' (integer).
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            quantity: { type: Type.INTEGER },
                        },
                        required: ["name", "quantity"],
                    },
                },
            },
        });
        
        const jsonString = response.text.trim();
        const parsedJson = JSON.parse(jsonString);

        if (!Array.isArray(parsedJson)) {
            throw new Error("AI response was not a JSON array.");
        }
        
        return parsedJson;

    } catch (error) {
        console.error("Gemini GitHub analysis failed:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the AI's JSON response for GitHub analysis.");
        }
        throw new Error("Failed to get component list from AI for the GitHub repository.");
    }
}