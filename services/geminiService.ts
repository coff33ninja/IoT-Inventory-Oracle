import { GoogleGenAI, Chat, GenerateContentResponse, Content, Type } from "@google/genai";
import { InventoryItem, ChatMessage, AiInsights, MarketDataItem } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
            
            Current Inventory Context:
            You will be provided with a JSON array of the user's full inventory. Each item has a 'status' field which is critical to understanding the user's needs. The possible statuses are:
            - 'I Have': The user possesses this item. This is their current stock.
            - 'I Want': The item is on the user's wishlist for future projects.
            - 'I Need': The item is required for a current or planned project.
            - Other statuses like 'Salvaged', 'Returned', etc. are for user's own tracking.
            
            Use this JSON as your primary source of truth. When recommending projects, prioritize using items the user already 'Has'. When suggesting parts to buy, first check if they are already on the 'Want' or 'Need' lists before searching the web.
            
            Your Capabilities:
            1.  **Project Suggestion & Creation**: Based on the user's 'I Have' inventory, suggest interesting IoT projects they could build. Provide a detailed description, a component list (differentiating between what they have and what they might need from their wishlist), and starter code. If you suggest a project, you MUST also provide a JSON block for project creation.
            2.  **Part Sourcing**: If a project requires a part the user doesn't have, use your search tool to find it online. Present findings in a markdown table ('Part Name', 'Supplier', 'Price', 'Link'). This should be followed by a JSON block for interactive part addition.
            3.  **Code Generation**: Provide helpful code snippets (e.g., for Arduino, ESP32, Raspberry Pi) when requested. Wrap code in appropriate markdown code blocks with language identifiers.
            4.  **Conversation Memory**: Remember the context of the current conversation to provide coherent follow-up assistance.
            
            **CRITICAL OUTPUT FORMATTING RULES (JSON BLOCKS):**
            You MUST provide machine-readable JSON for interactive actions. These blocks must come AFTER your conversational text.
            
            - **For Part Suggestions:**
            \`\`\`json
            /// SUGGESTIONS_JSON_START ///
            [{"name": "Part Name", "supplier": "Supplier", "price": "Price", "link": "URL"}]
            /// SUGGESTIONS_JSON_END ///
            \`\`\`

            - **For Project Creation:**
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

            Interaction Style:
            Be concise, helpful, and professional. Format your responses for clarity using markdown.
            `,
            tools: [{googleSearch: {}}],
        },
    });
}

export const getAiChatStream = async (
    message: string,
    history: ChatMessage[],
    fullInventory: InventoryItem[]
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    
    const chat = getChat(history);
    
    const inventoryContext = `
      Here is the user's full inventory, including items with various statuses (I Have, I Want, I Need, etc.):
      ${JSON.stringify(fullInventory, null, 2)}
    `;

    const fullPrompt = `${inventoryContext}\n\nUser's request: ${message}`;
    
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