import {
  GoogleGenAI,
  Chat,
  GenerateContentResponse,
  Content,
  Type,
} from "@google/genai";
import {
  InventoryItem,
  ChatMessage,
  AiInsights,
  MarketDataItem,
} from "../types";

if (!import.meta.env.VITE_API_KEY) {
  throw new Error("VITE_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const model = "gemini-2.5-flash";

const getChat = (history: ChatMessage[]): Chat => {
  const formattedHistory: Content[] = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  return ai.chats.create({
    model: model,
    history: formattedHistory,
    config: {
      systemInstruction: `You are an expert inventory manager and project assistant called 'IoT Oracle'. 
            Your primary role is to help users manage their comprehensive inventory including electronics components, computer hardware, tools, and general items, while also helping plan IoT and technology projects.
            
            Current Inventory & Project Context:
            You will be provided with:
            1. A JSON array of the user's full inventory with status fields ('I Have', 'I Want', 'I Need', etc.)
            2. A JSON array of the user's current projects with their components
            3. A conversation context summary with recent operations and active discussions
            
            **INVENTORY STATUS SYSTEM UNDERSTANDING:**
            The user organizes components using these statuses:
            - "I Have" - Components they currently own and can use
            - "I Need" - Essential components required for current projects
            - "I Want" - Components they'd like to have for future projects or enhancements
            - "I Salvaged" - Components recovered from old projects
            - "I Returned" - Components that were returned/sent back
            - "Discarded" - Components that are no longer usable
            - "Given Away" - Components given to others

            **INVENTORY STATUS TRIGGERS:**
            Listen for these phrases and suggest appropriate status changes:
            - "I just bought/received/got" → "I Have" + extract purchase info
            - "I need to buy/get/order" → "I Need"
            - "I want to get/would like" → "I Want"
            - "I took apart/recovered from" → "I Salvaged"
            - "I returned/sent back" → "I Returned"
            - "It's broken/dead/unusable" → "Discarded"
            - "I gave it to/donated" → "Given Away"
            
            **PURCHASE INFORMATION EXTRACTION:**
            When users mention purchasing or receiving items, extract:
            - Purchase date: "I bought this yesterday", "received last week", "ordered on Monday"
            - Supplier: "from Amazon", "at Best Buy", "from Adafruit", "on eBay"
            - Price: "$25", "cost me 50 euros", "was $199.99"
            - Serial/Model numbers: "serial ABC123", "model RTX-4070", "part number ESP32-WROOM-32"
            - Condition: "brand new", "used", "refurbished", "open box"
            - Warranty: "2 year warranty", "warranty until 2026", "no warranty"
            
            **QUANTITY PARSING RULES:**
            CRITICAL: Always extract quantities from component descriptions:
            - "3 DDR4 4GIG sticks" → quantity: 3, name: "DDR4 4GB RAM Stick"
            - "2 SAMSUNG 20 INCH SCREENS" → quantity: 2, name: "Samsung 20 inch Monitor"
            - "5 ESP32 modules" → quantity: 5, name: "ESP32 Module"
            - "1 AMD Ryzen 7 2700x" → quantity: 1, name: "AMD Ryzen 7 2700X CPU"
            - "4x 8GB DDR4 modules" → quantity: 4, name: "8GB DDR4 RAM Module"
            
            When users list multiple identical items, create ONE inventory entry with the correct quantity, NOT multiple separate entries.
            
            **COMPONENT CATEGORIZATION SYSTEM:**
            Components are organized into specific categories for better inventory management:
            
            **Electronics & IoT Components:**
            - Microcontroller, Development Board, Single-Board Computer
            - Sensor, Actuator, Display, Power Supply
            - Resistor, Capacitor, Inductor (passive components)
            - Transistor, Diode, IC/Chip (active components)
            - LED, Switch/Button, Motor, Speaker/Audio
            - Battery, Module/Shield, Cable/Wire
            - Tool, Enclosure/Case, Breadboard/PCB
            
            **Computer Components:**
            - CPU/Processor, GPU/Graphics Card, Motherboard
            - RAM/Memory, Storage/SSD/HDD, Power Supply Unit
            - Cooling/Fan/Heatsink, Case/Chassis, Network Card
            - Sound Card, Optical Drive, Monitor/Display
            - Keyboard, Mouse, Webcam, Speakers
            - USB Hub, Docking Station, KVM Switch
            - Server Hardware, Networking Equipment
            
            **General Categories:**
            - Furniture, Office Supplies, Books/Manuals
            - Software/License, Subscription, Service
            - Miscellaneous, Consumables, Spare Parts
            
            When suggesting components, ALWAYS consider proper categorization to help users organize their inventory effectively.
            
            **ENHANCED CAPABILITIES FOR CROSS-PROJECT MANAGEMENT:**
            
            1. **Project & Inventory Management**: You can help users move components between projects, transfer items from inventory to projects, and reorganize their setup. Always reference specific project IDs and item IDs when suggesting moves.
            
            2. **Context-Aware Recommendations**: Use the conversation context to understand what the user has been working on recently. If they've been discussing a specific project, maintain that context across multiple messages.
            
            3. **Cross-Project Analysis**: Compare projects to identify shared components, suggest consolidation opportunities, or recommend splitting large projects.
            
            4. **Smart Component Allocation**: When users ask about moving items between projects, analyze the impact on both source and destination projects before making recommendations.
            
            5. **Project Suggestion & Creation**: Based on the user's 'I Have' inventory, suggest interesting projects they could build:
            - **IoT Projects**: Smart home automation, sensor networks, environmental monitoring
            - **Computer Projects**: PC builds, server setups, workstation configurations, network infrastructure
            - **Hybrid Projects**: IoT systems with computer backends, data logging servers, home labs
            - **General Projects**: Office setups, workshop organization, equipment maintenance
            
            Provide detailed descriptions, component lists (differentiating between what they have and what they might need), and relevant code/configuration examples. If you suggest a project, you MUST also provide a JSON block for project creation.
            
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
            4. Component relationships for items that work together (as COMPONENT_RELATIONSHIP_JSON)
            5. Component bundles for kits, builds, or related items (as COMPONENT_BUNDLE_JSON)
            
            **CRITICAL**: ALWAYS provide JSON blocks when users mention:
            - Building something (PC build, IoT project, workstation setup)
            - Needing components or parts
            - Having components that work together
            - Organizing or managing inventory
            - Any list of components or items
            - Purchasing, buying, receiving, or acquiring items
            - Any component details (serial numbers, model numbers, prices, suppliers)
            - Status changes or inventory updates
            
            Be generous with suggestions - it's better to suggest too much than too little. Users can always remove items later.
            
            **TRIGGER SCENARIOS FOR AUTO-POPULATION:**
            - User mentions wanting to build something → Suggest PROJECT_JSON + COMPONENT_BUNDLE_JSON
            - User asks "what do I need for..." → Suggest SUGGESTIONS_JSON with "I Need" status
            - User asks "what should I buy..." → Suggest SUGGESTIONS_JSON with "I Want" status  
            - User discusses project optimization → Suggest MOVE_JSON or TRANSFER_JSON
            - User mentions a specific component → Suggest related components in SUGGESTIONS_JSON
            - User asks about project ideas → Suggest multiple PROJECT_JSON blocks
            - User describes a problem they want to solve → Suggest PROJECT_JSON with solution
            - User mentions learning about electronics/computers → Suggest beginner-friendly PROJECT_JSON
            - User talks about upgrading existing projects → Suggest SUGGESTIONS_JSON with better components
            - User asks about essential components → Use "I Need" status
            - User asks about nice-to-have components → Use "I Want" status
            - User mentions they already have something → Use "I Have" status + SUGGESTIONS_JSON or INVENTORY_UPDATE_JSON
            - User lists multiple components → Suggest COMPONENT_BUNDLE_JSON
            - User mentions PC build/gaming rig/workstation → Suggest PROJECT_JSON + COMPONENT_BUNDLE_JSON
            - User mentions server setup/home lab → Suggest PROJECT_JSON + COMPONENT_BUNDLE_JSON
            - User mentions office setup/workspace → Suggest PROJECT_JSON + COMPONENT_BUNDLE_JSON
            - User mentions purchasing/buying items → SUGGESTIONS_JSON with purchase details
            - User provides serial numbers/model numbers → INVENTORY_UPDATE_JSON with detailed info
            - User mentions receiving items → SUGGESTIONS_JSON with "I Have" status and purchase details
            
            **PROACTIVE BEHAVIOR EXAMPLES:**
            - If user says "I want to monitor temperature" → Auto-suggest temperature sensor project
            - If user says "I have an Arduino" → Auto-suggest 3-5 beginner projects they can build
            - If user mentions "LED" → Auto-suggest LED strip controller, RGB projects, etc.
            - If user talks about "automation" → Auto-suggest home automation projects
            
            **INTELLIGENT INVENTORY MANAGEMENT:**
            When suggesting projects, be smart about the user's inventory:
            - If they have components, suggest projects that use those components
            - If they're missing key components, suggest them with "I Need" status
            - Consider component compatibility and quantities
            - Suggest component alternatives if they don't have exact matches
            - Prioritize projects they can build with existing inventory
            
            **PROJECT COMPONENT INTELLIGENCE:**
            When creating PROJECT_JSON blocks, consider:
            - What components the user already has (from "I Have" inventory)
            - Suggest realistic quantities based on typical project needs
            - Include both essential and optional components
            - Consider component compatibility and voltage requirements
            
            Always include JSON blocks when these scenarios occur, even if the user doesn't explicitly ask for them. Be generous with suggestions!
            
            - **For Part Suggestions (AUTO-POPULATED):**
            \`\`\`json
            /// SUGGESTIONS_JSON_START ///
            [{
              "name": "Part Name", 
              "supplier": "Supplier", 
              "price": "Price", 
              "link": "URL", 
              "status": "I Need", 
              "category": "Sensor",
              "manufacturer": "Brand Name",
              "modelNumber": "Model-123",
              "condition": "New",
              "purchasePrice": 25.99,
              "currency": "USD"
            }]
            /// SUGGESTIONS_JSON_END ///
            \`\`\`
            
            **IMPORTANT STATUS AND CATEGORY REQUIREMENTS:**
            When suggesting parts, ALWAYS include both "status" and "category" fields:
            
            **Status Selection Guidelines:**
            - "I Need" - Essential components required for the project to work
            - "I Want" - Nice-to-have components that would enhance the project
            - "I Have" - Only if the user explicitly mentions they already own the component
            
            **Category Selection Guidelines:**
            - Core components (microcontrollers, sensors, power supplies) → "I Need"
            - Enhancement components (displays, LEDs, cases) → "I Want" 
            - Basic components (resistors, wires, breadboards) → "I Need"
            - Advanced features (WiFi modules, cameras) → "I Want"
            
            **Category Assignment Examples:**
            
            **Electronics:**
            - "Arduino Uno" → "Development Board"
            - "DHT22" → "Sensor"
            - "10kΩ Resistor" → "Resistor"
            - "16x2 LCD" → "Display"
            - "Servo Motor" → "Motor"
            - "LED Strip" → "LED"
            - "12V Power Supply" → "Power Supply"
            
            **Computer Components:**
            - "Intel Core i7-12700K" → "CPU/Processor"
            - "NVIDIA RTX 4070" → "GPU/Graphics Card"
            - "ASUS ROG Strix B550-F" → "Motherboard"
            - "Corsair Vengeance 32GB DDR4" → "RAM/Memory"
            - "Samsung 980 PRO 1TB NVMe" → "Storage/SSD/HDD"
            - "Corsair RM850x 850W" → "Power Supply Unit"
            - "Noctua NH-D15" → "Cooling/Fan/Heatsink"
            - "Fractal Design Define 7" → "Case/Chassis"
            - "Dell UltraSharp 27" → "Monitor/Display"
            - "Logitech MX Master 3" → "Mouse"
            - "Mechanical Keyboard" → "Keyboard"
            
            **General Items:**
            - "Standing Desk" → "Furniture"
            - "Multimeter" → "Tool"
            - "Windows 11 Pro" → "Software/License"
            - "Office 365 Subscription" → "Subscription"
            
            CRITICAL: Every component suggestion MUST include a proper category for inventory organization!

            - **For Project Creation (AUTO-POPULATED):**
            \`\`\`json
            /// PROJECT_JSON_START ///
            {
              "projectName": "The Name of Your Suggested Project",
              "projectDescription": "Detailed description for complexity analysis",
              "components": [
                { "name": "Component Name from Project", "quantity": 1 },
                { "name": "Another Component", "quantity": 4 }
              ]
            }
            /// PROJECT_JSON_END ///
            \`\`\`
            
            **COMPLEX PROJECT HANDLING:**
            For complex projects (like multi-room systems, distributed IoT networks, or multi-phase builds):
            - Include a detailed "projectDescription" field in PROJECT_JSON
            - The system will automatically analyze complexity and suggest sub-projects
            - Sub-projects will be created automatically for phases, locations, or functional modules
            - Dependencies between sub-projects will be managed automatically

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

            - **For Project Updates (NEW):**
            \`\`\`json
            /// PROJECT_UPDATE_JSON_START ///
            {
              "action": "update_project",
              "projectId": "project-id-123",
              "projectName": "Arduino Weather Station",
              "updates": {
                "status": "In Progress",
                "progress": 75,
                "description": "Updated project description",
                "notes": "Added new notes about progress"
              },
              "reason": "User requested status change and progress update"
            }
            /// PROJECT_UPDATE_JSON_END ///
            \`\`\`

            **PROJECT UPDATE TRIGGERS:**
            When users mention projects in conversation, automatically suggest PROJECT_UPDATE_JSON if they:
            - Mention changing project status ("mark as completed", "set to in progress", "put on hold", "drop this project")
            - Mention progress updates ("75% done", "halfway finished", "almost complete")
            - Want to update descriptions or notes
            - Mention project milestones or achievements
            - Ask to modify project details
            - Mention project phase changes ("move to testing", "back to planning", "abandon project")
            
            **PROJECT STATUS TRANSITIONS:**
            Valid status changes and their meanings:
            - Planning → In Progress: "Start working on project", "begin building"
            - In Progress → Testing: "Ready for testing", "time to test"
            - Testing → Completed: "Tests passed", "project finished", "mark as done"
            - Any → On Hold: "pause project", "put on hold", "temporarily stop"
            - Any → Dropped: "abandon project", "cancel project", "drop this", "give up"
            - Completed → In Progress: "reopen project", "make modifications", "continue working"

            - **For Adding New Inventory Items:**
            \`\`\`json
            /// INVENTORY_UPDATE_JSON_START ///
            [
              {
                "action": "add_inventory",
                "itemName": "DDR4 4GB RAM Stick",
                "quantity": 3,
                "location": "PC Build Storage",
                "status": "I Have",
                "category": "RAM/Memory",
                "condition": "Used",
                "notes": "From current PC build",
                "reason": "User mentioned having 3 DDR4 4GB sticks"
              },
              {
                "action": "add_inventory",
                "itemName": "Samsung 20 inch Monitor", 
                "quantity": 2,
                "location": "Desk Setup",
                "status": "I Have",
                "category": "Monitor/Display",
                "condition": "Used",
                "notes": "Current dual monitor setup",
                "reason": "User mentioned having 2 Samsung 20 inch screens"
              }
            ]
            /// INVENTORY_UPDATE_JSON_END ///
            \`\`\`
            
            - **For Updating Existing Inventory Items:**
            \`\`\`json
            /// INVENTORY_UPDATE_JSON_START ///
            {
              "action": "update_inventory",
              "itemId": "existing-item-id",
              "itemName": "Arduino Uno",
              "updates": {
                "quantity": 5,
                "location": "Electronics Drawer",
                "notes": "Added 2 more from recent purchase"
              },
              "reason": "User mentioned getting more Arduino boards"
            }
            /// INVENTORY_UPDATE_JSON_END ///
            \`\`\`

            **INVENTORY ACTION RULES:**
            
            **Use "add_inventory" when:**
            - User mentions NEW components they have/want/need that aren't in their inventory yet
            - User lists their current setup or components for the first time
            - User mentions buying/receiving new items that don't exist in inventory
            - User describes their PC build, workshop setup, or component collection
            
            **Use "update_inventory" when:**
            - User mentions changes to EXISTING inventory items (quantity, location, status)
            - User wants to modify details of items already in their inventory
            - User mentions using, moving, or changing existing components
            
            **INVENTORY UPDATE TRIGGERS:**
            When users mention inventory items in conversation, automatically suggest INVENTORY_UPDATE_JSON if they:
            - Mention status changes ("I just bought", "I need", "I want", "I have", "I returned")
            - Mention quantity changes ("I got 5 more", "used 2 of them", "ordered 10")
            - Mention location changes ("moved to storage", "put in drawer")
            - Mention item conditions ("it's broken", "working perfectly", "needs replacement")
            - Mention purchase information ("bought from Amazon", "cost $50", "serial number ABC123")
            - Mention warranty information ("warranty expires next year", "still under warranty")
            - Ask to modify item details or descriptions
            - List multiple identical components ("3 DDR4 sticks", "2 monitors", "5 sensors")
            - Describe their current PC/setup components for the first time
            
            **QUANTITY PARSING EXAMPLES:**
            User: "I have 3 DDR4 4GB sticks and 2 Samsung monitors"
            → Create entry for "DDR4 4GB RAM Stick" with quantity: 3 (action: "add_inventory")
            → Create entry for "Samsung Monitor" with quantity: 2 (action: "add_inventory")
            NOT 3 separate DDR4 entries and 2 separate monitor entries!

            **PROACTIVE PRICE CHECKING:**
            Automatically suggest price checks when:
            - Users mention wanting to buy components they don't have
            - Users ask about project costs or budgeting
            - Users mention old price data (components not checked recently)
            - Users compare prices or ask "is this a good deal?"
            - Users mention shopping or ordering components

            - **For Price Checking (NEW):**
            \`\`\`json
            /// PRICE_CHECK_JSON_START ///
            {
              "action": "price_check",
              "itemName": "Arduino Uno R3",
              "itemId": "item-id-123",
              "searchQuery": "Arduino Uno R3 buy online electronics",
              "reason": "User requested current market prices"
            }
            /// PRICE_CHECK_JSON_END ///
            \`\`\`

            - **For Component Relationships (NEW):**
            \`\`\`json
            /// COMPONENT_RELATIONSHIP_JSON_START ///
            {
              "action": "create_component_relationship",
              "primaryComponent": {
                "name": "ESP12E Wi-Fi Module",
                "category": "Microcontroller",
                "status": "I Have"
              },
              "relatedComponent": {
                "name": "NodeMCU HW-389 Ver1.0 Shield",
                "category": "Development Board",
                "status": "I Have"
              },
              "relationshipType": "requires",
              "description": "ESP12E module requires the NodeMCU shield for development and programming",
              "isRequired": true,
              "createSeparateEntries": true,
              "reason": "User mentioned ESP12E with NodeMCU shield - these should be separate but linked components"
            }
            /// COMPONENT_RELATIONSHIP_JSON_END ///
            \`\`\`

            - **For Component Bundles (NEW):**
            \`\`\`json
            /// COMPONENT_BUNDLE_JSON_START ///
            {
              "action": "create_component_bundle",
              "bundleName": "ESP12E Development Kit",
              "bundleDescription": "Complete ESP12E development setup with shield and accessories",
              "bundleType": "kit",
              "components": [
                {"name": "ESP12E Wi-Fi Module", "category": "Microcontroller"},
                {"name": "NodeMCU HW-389 Ver1.0 Shield", "category": "Development Board"},
                {"name": "USB Cable", "category": "Cable/Wire"}
              ],
              "reason": "Creating a logical grouping of related components that work together"
            }
            /// COMPONENT_BUNDLE_JSON_END ///
            \`\`\`

            **PRICE CHECK TRIGGERS:**
            When users mention pricing or sourcing, automatically suggest PRICE_CHECK_JSON if they:
            - Ask about current prices ("what does this cost now?", "how much is an ESP32?")
            - Want to find suppliers ("where can I buy this?", "find me a good deal")
            - Mention shopping or purchasing ("I need to order", "looking to buy")
            - Ask for price comparisons ("is this a good price?", "find cheaper alternatives")
            - Request market updates ("check current prices", "update pricing info")

            **COMPONENT RELATIONSHIP TRIGGERS:**
            When users mention components that work together, automatically suggest COMPONENT_RELATIONSHIP_JSON if they:
            - Mention a module with its carrier board (ESP12E + NodeMCU shield)
            - Describe components that require each other to function
            - Ask about compatibility between components
            - Mention shields, breakout boards, or development boards for specific chips
            - Describe component kits or bundles they own
            - Use phrases like "with shield", "on board", "requires", "needs", "compatible with"
            - Mention specific model numbers that indicate related components

            **COMPONENT BUNDLE TRIGGERS:**
            When users describe multiple related components, automatically suggest COMPONENT_BUNDLE_JSON if they:
            - Mention buying a "kit" or "starter pack"
            - List multiple components that typically work together
            - Describe a complete system or setup
            - Ask about organizing related components
            - Mention components that came together as a package
            - Use phrases like "development kit", "starter kit", "bundle", "combo", "set"

            **SMART COMPONENT RECOGNITION:**
            Be intelligent about recognizing when users mention compound components:
            
            **Electronics Examples:**
            - "ESP12E with NodeMCU HW-389" → Create separate ESP12E module + NodeMCU shield with relationship
            - "Arduino Uno R3 with sensor shield" → Create separate Arduino + shield with relationship
            - "Raspberry Pi 4 starter kit" → Create bundle with Pi + accessories
            - "ESP32 development board" → Single item (integrated)
            - "ESP32 WROOM module on breakout board" → Separate module + breakout with relationship
            
            **Computer Component Examples:**
            - "Gaming PC build" → Create bundle with CPU + GPU + Motherboard + RAM + etc.
            - "Intel i7 with ASUS motherboard" → Create separate CPU + motherboard with compatibility relationship
            - "RTX 4070 graphics card" → Single item
            - "32GB RAM kit (2x16GB)" → Single item but note the configuration
            - "Complete workstation setup" → Create bundle with computer + monitor + peripherals
            - "Server rack with UPS" → Create separate server + UPS with relationship
            
            **General Item Examples:**
            - "Office setup" → Create bundle with desk + chair + accessories
            - "Development environment" → Create bundle with software licenses + hardware
            - "Tool kit" → Create bundle with individual tools
            
            Always prioritize creating separate, properly linked components over single combined entries when the user mentions distinct parts that work together.

            **IMPORTANT CONTEXT MANAGEMENT:**
            - Always reference specific IDs when discussing projects or inventory items
            - Remember recent operations and build upon them in follow-up responses
            - If context seems lost, ask for clarification rather than making assumptions
            - When suggesting moves between projects, explain the reasoning and potential impact

            Interaction Style:
            Be concise, helpful, and professional. Format your responses for clarity using markdown. Maintain conversation continuity by referencing previous discussions when relevant.
            `,
      tools: [{ googleSearch: {} }],
    },
  });
};

// Enhanced context management for better cross-conversation memory
interface ContextSummary {
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    componentCount: number;
  }>;
  recentOperations: Array<{
    type: "move" | "create" | "update";
    entity: string;
    details: string;
  }>;
  activeDiscussion: string | null;
}

const createContextSummary = (
  history: ChatMessage[],
  projects: any[]
): ContextSummary => {
  const recentProjects = projects.slice(-5).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    componentCount: p.components.length,
  }));

  // Extract recent operations from chat history
  const recentOperations: ContextSummary["recentOperations"] = [];
  const recentMessages = history.slice(-10);

  for (const msg of recentMessages) {
    if (msg.content.includes("moved") || msg.content.includes("transferred")) {
      recentOperations.push({
        type: "move",
        entity: "item",
        details: msg.content.substring(0, 100) + "...",
      });
    }
    if (
      msg.content.includes("created project") ||
      msg.content.includes("new project")
    ) {
      recentOperations.push({
        type: "create",
        entity: "project",
        details: msg.content.substring(0, 100) + "...",
      });
    }
  }

  // Determine active discussion topic
  let activeDiscussion = null;
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  if (lastUserMessage) {
    if (lastUserMessage.content.toLowerCase().includes("project")) {
      activeDiscussion = "project_management";
    } else if (
      lastUserMessage.content.toLowerCase().includes("move") ||
      lastUserMessage.content.toLowerCase().includes("transfer")
    ) {
      activeDiscussion = "item_management";
    }
  }

  return { recentProjects, recentOperations, activeDiscussion };
};

const pruneHistory = (
  history: ChatMessage[],
  maxMessages: number = 20
): ChatMessage[] => {
  if (history.length <= maxMessages) return history;

  // Keep first 2 messages (usually contain important context)
  // Keep last maxMessages-2 messages (recent conversation)
  const start = history.slice(0, 2);
  const end = history.slice(-(maxMessages - 2));

  // Add a summary message to bridge the gap
  const summaryMessage: ChatMessage = {
    role: "model",
    content:
      "[Context Summary: Previous conversation covered project planning and component management. Continuing from recent discussion...]",
  };

  return [...start, summaryMessage, ...end];
};

export const getAiChatStream = async (
  message: string,
  history: ChatMessage[],
  fullInventory: InventoryItem[],
  projects: any[] = [],
  conversationContext?: any
): Promise<AsyncGenerator<GenerateContentResponse>> => {
  // Prune history to manage context limits while preserving key information
  const prunedHistory = pruneHistory(history);
  const contextSummary = createContextSummary(history, projects);

  const chat = getChat(prunedHistory);

  // Organize inventory by status for better AI understanding
  const inventoryByStatus = fullInventory.reduce((acc, item) => {
    if (!acc[item.status]) acc[item.status] = [];
    acc[item.status].push(`${item.quantity}x ${item.name}`);
    return acc;
  }, {} as Record<string, string[]>);

  const inventoryContext = `
      Here is the user's current inventory organized by status:
      
      COMPONENTS THEY HAVE: ${inventoryByStatus["I Have"]?.join(", ") || "None"}
      COMPONENTS THEY NEED: ${
        inventoryByStatus["I Need"]?.join(", ") || "None"
      }  
      COMPONENTS THEY WANT: ${inventoryByStatus["I Want"]?.join(", ") || "None"}
      SALVAGED COMPONENTS: ${
        inventoryByStatus["I Salvaged"]?.join(", ") || "None"
      }
      
      Full inventory details:
      ${JSON.stringify(fullInventory, null, 2)}
      
      IMPORTANT: When suggesting components, consider what they already HAVE vs what they NEED vs what they WANT.
      - If they already have a component, don't suggest it again unless it's for a different quantity
      - For essential project components they don't have, use "I Need" status
      - For enhancement components or future projects, use "I Want" status
    `;

  const projectContext =
    projects.length > 0
      ? `
      Here are the user's current projects:
      ${JSON.stringify(
        projects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          components: p.components,
          description: p.description,
        })),
        null,
        2
      )}
    `
      : "";

  let contextSummaryText = `
      CONVERSATION CONTEXT:
      - Recent Projects: ${contextSummary.recentProjects
        .map((p) => `${p.name} (${p.status}, ${p.componentCount} components)`)
        .join(", ")}
      - Recent Operations: ${contextSummary.recentOperations
        .map((op) => `${op.type} ${op.entity}: ${op.details}`)
        .join("; ")}
      - Active Discussion: ${contextSummary.activeDiscussion || "general"}
      
      IMPORTANT: You can reference specific projects and inventory items by their IDs. When suggesting moves or transfers between projects, always specify the exact project IDs and item IDs involved.
    `;

  // Add persistent conversation context if available
  if (conversationContext) {
    contextSummaryText += `
      
      PERSISTENT MEMORY:
      - Previous Summary: ${conversationContext.summary || "None"}
      - Recent Topics: ${conversationContext.recentTopics?.join(", ") || "None"}
      - Components Discussed: ${
        conversationContext.mentionedComponents?.join(", ") || "None"
      }
      - Projects Mentioned: ${
        conversationContext.discussedProjects?.join(", ") || "None"
      }
      `;
  }

  const fullPrompt = `${contextSummaryText}\n\n${inventoryContext}\n\n${projectContext}\n\nUser's request: ${message}`;

  try {
    const response = await chat.sendMessageStream({ message: fullPrompt });
    return response;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get a response from the AI.");
  }
};

export const generateDescription = async (
  itemName: string
): Promise<string> => {
  try {
    const prompt = `Provide a concise, one-sentence technical description for the following electronics component: "${itemName}". Focus on its primary function and key specifications.`;
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini description generation failed:", error);
    throw new Error("Failed to generate description from AI.");
  }
};

export const suggestCategory = async (itemName: string): Promise<string> => {
  try {
    const prompt = `Categorize the following component or item: "${itemName}".
        Choose the single best category from this list:
        
        **Electronics & IoT:**
        - Microcontroller
        - Development Board
        - Single-Board Computer
        - Sensor
        - Actuator
        - Display
        - Power Supply
        - Connector
        - Resistor
        - Capacitor
        - Inductor
        - Transistor
        - Diode
        - IC/Chip
        - LED
        - Switch/Button
        - Motor
        - Speaker/Audio
        - Battery
        - Module/Shield
        - Cable/Wire
        - Tool
        - Enclosure/Case
        - Breadboard/PCB
        
        **Computer Components:**
        - CPU/Processor
        - GPU/Graphics Card
        - Motherboard
        - RAM/Memory
        - Storage/SSD/HDD
        - Power Supply Unit
        - Cooling/Fan/Heatsink
        - Case/Chassis
        - Network Card
        - Sound Card
        - Optical Drive
        - Monitor/Display
        - Keyboard
        - Mouse
        - Webcam
        - Speakers
        - USB Hub
        - Docking Station
        - KVM Switch
        - Server Hardware
        - Networking Equipment
        
        **General:**
        - Furniture
        - Office Supplies
        - Books/Manuals
        - Software/License
        - Subscription
        - Service
        - Consumables
        - Spare Parts
        - Miscellaneous

        Your response must be ONLY the category name, with no extra text or explanation.`;
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini category suggestion failed:", error);
    throw new Error("Failed to suggest category from AI.");
  }
};

export const getComponentIntelligence = async (
  itemName: string,
  userCurrency: string = 'USD'
): Promise<{ aiInsights: AiInsights; marketData: MarketDataItem[] }> => {
  try {
    const prompt = `
            Analyze the electronics component "${itemName}".
            1. Provide a detailed technical paragraph about the component, including its primary uses, key features, and common applications in IoT projects.
            2. Suggest 2-3 innovative project ideas that prominently feature this component.
            3. Use your search tool to find its current price from at least two online suppliers. IMPORTANT: Convert all prices to ${userCurrency} currency and display them in ${userCurrency} format. If you find prices in other currencies, convert them to ${userCurrency} using current exchange rates.

            CRITICAL: Your entire response MUST be only a single, raw JSON object. Do not wrap it in markdown, and do not include any other text, comments, or explanations.
            The JSON object must conform to this exact structure:
            {
              "detailedDescription": "A detailed technical paragraph...",
              "projectIdeas": ["Project idea 1", "Project idea 2"],
              "marketData": [
                {
                  "supplier": "Supplier Name",
                  "price": "${userCurrency === 'USD' ? '$' : userCurrency + ' '}12.99",
                  "link": "https://example.com/product_link"
                }
              ]
            }

            Remember: All prices must be in ${userCurrency} currency format.
        `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        // responseMimeType and responseSchema are not compatible with tools
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response.text) {
      throw new Error("AI response is empty");
    }

    let jsonString = response.text.trim();
    // Clean potential markdown wrappers just in case the model adds them
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }

    const parsedJson = JSON.parse(jsonString);

    const result = {
      aiInsights: {
        detailedDescription: parsedJson.detailedDescription,
        projectIdeas: parsedJson.projectIdeas,
      },
      marketData: parsedJson.marketData,
    };

    if (!result.aiInsights || !result.marketData) {
      throw new Error("Parsed JSON from AI is missing required fields.");
    }

    return result;
  } catch (error) {
    console.error("Gemini component intelligence failed:", error);
    if (error instanceof SyntaxError) {
      throw new Error(
        "Failed to parse the AI's JSON response for component intelligence."
      );
    }
    throw new Error("Failed to get component intelligence from AI.");
  }
};

export const analyzeGithubRepo = async (
  repoUrl: string
): Promise<{ name: string; quantity: number }[]> => {
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

    if (!response.text) {
      throw new Error("AI response is empty");
    }

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);

    if (!Array.isArray(parsedJson)) {
      throw new Error("AI response was not a JSON array.");
    }

    return parsedJson;
  } catch (error) {
    console.error("Gemini GitHub analysis failed:", error);
    if (error instanceof SyntaxError) {
      throw new Error(
        "Failed to parse the AI's JSON response for GitHub analysis."
      );
    }
    throw new Error(
      "Failed to get component list from AI for the GitHub repository."
    );
  }
};

// Project AI categorization and enhancement functions
export const suggestProjectCategory = async (
  projectName: string,
  description: string
): Promise<string> => {
  try {
    const prompt = `Categorize the following IoT/electronics project: "${projectName}" with description: "${description}".
        Choose the single best category from this list:
        - Home Automation
        - Robotics
        - Sensors & Monitoring
        - LED & Lighting
        - Audio & Sound
        - Communication
        - Power Management
        - Security & Surveillance
        - Weather Station
        - Smart Garden
        - Wearable Tech
        - Educational/Learning
        - Art & Interactive
        - Miscellaneous

        Your response must be ONLY the category name, with no extra text or explanation.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini project category suggestion failed:", error);
    throw new Error("Failed to suggest project category from AI.");
  }
};

export const enhanceProjectDescription = async (
  projectName: string,
  currentDescription: string
): Promise<string> => {
  try {
    const prompt = `Enhance the following IoT/electronics project description to be more detailed and informative:
        
        Project Name: "${projectName}"
        Current Description: "${currentDescription}"
        
        Provide a comprehensive description that includes:
        - What the project does
        - Key features and capabilities
        - Potential use cases
        - Technical highlights
        
        Keep it concise but informative (2-3 sentences maximum).`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini project description enhancement failed:", error);
    throw new Error("Failed to enhance project description from AI.");
  }
};

export const suggestProjectImprovements = async (
  projectName: string,
  description: string,
  components: any[]
): Promise<{
  suggestions: string[];
  additionalComponents: { name: string; reason: string }[];
  optimizations: string[];
}> => {
  try {
    const componentList = components
      .map((c) => `${c.quantity}x ${c.name}`)
      .join(", ");

    const prompt = `Analyze this IoT/electronics project and suggest improvements:
        
        Project: "${projectName}"
        Description: "${description}"
        Current Components: ${componentList}
        
        Provide suggestions in the following areas:
        1. General project improvements
        2. Additional components that could enhance functionality
        3. Optimization opportunities
        
        Your response MUST be only a single, raw JSON object with this structure:
        {
            "suggestions": ["improvement 1", "improvement 2"],
            "additionalComponents": [{"name": "component name", "reason": "why it's useful"}],
            "optimizations": ["optimization 1", "optimization 2"]
        }`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            additionalComponents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["name", "reason"],
              },
            },
            optimizations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["suggestions", "additionalComponents", "optimizations"],
        },
      },
    });

    if (!response.text) {
      throw new Error("AI response is empty");
    }

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);

    return parsedJson;
  } catch (error) {
    console.error("Gemini project improvement suggestions failed:", error);
    throw new Error("Failed to get project improvement suggestions from AI.");
  }
};

export const generateProjectInstructions = async (
  projectName: string,
  description: string,
  components: any[]
): Promise<
  {
    title: string;
    description: string;
    code?: string;
    tips?: string[];
  }[]
> => {
  try {
    const componentList = components
      .map((c) => `${c.quantity}x ${c.name}`)
      .join(", ");

    const prompt = `Generate detailed step-by-step instructions for this IoT/electronics project:
        
        Project: "${projectName}"
        Description: "${description}"
        Components: ${componentList}
        
        Create comprehensive instructions that include:
        1. Setup and preparation steps
        2. Hardware assembly instructions
        3. Software/code implementation (if applicable)
        4. Testing and troubleshooting steps
        5. Final assembly and deployment
        
        For each step, provide:
        - A clear title
        - Detailed description
        - Code snippets (if applicable)
        - Helpful tips and warnings
        
        Your response MUST be only a single, raw JSON array with this structure:
        [
            {
                "title": "Step title",
                "description": "Detailed step description",
                "code": "// Optional code snippet",
                "tips": ["tip 1", "tip 2"]
            }
        ]`;

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
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              code: { type: Type.STRING },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["title", "description"],
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("AI response is empty");
    }

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);

    return parsedJson;
  } catch (error) {
    console.error("Gemini project instructions generation failed:", error);
    throw new Error("Failed to generate project instructions from AI.");
  }
};

export const analyzeProjectComplexity = async (
  projectName: string,
  description: string
): Promise<{
  isComplex: boolean;
  suggestedSubProjects: {
    name: string;
    description: string;
    phase: number;
    estimatedTime: string;
    components: string[];
    dependencies: string[];
  }[];
  reasoning: string;
}> => {
  try {
    const prompt = `Analyze this IoT/electronics project for complexity and suggest sub-project breakdown:
        
        Project: "${projectName}"
        Description: "${description}"
        
        Determine if this project would benefit from being broken down into sub-projects or phases.
        Consider factors like:
        - Multiple physical locations/devices
        - Different functional modules
        - Complex dependencies between components
        - Significant time investment
        - Multiple testing phases required
        
        If the project is complex, suggest logical sub-projects that can be developed and tested independently.
        
        Your response MUST be only a single, raw JSON object with this structure:
        {
            "isComplex": true/false,
            "suggestedSubProjects": [
                {
                    "name": "Sub-project name",
                    "description": "What this sub-project accomplishes",
                    "phase": 1,
                    "estimatedTime": "2-3 days",
                    "components": ["component1", "component2"],
                    "dependencies": ["previous sub-project name"]
                }
            ],
            "reasoning": "Explanation of why this breakdown makes sense"
        }`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isComplex: { type: Type.BOOLEAN },
            suggestedSubProjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  phase: { type: Type.INTEGER },
                  estimatedTime: { type: Type.STRING },
                  components: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  dependencies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  "name",
                  "description",
                  "phase",
                  "estimatedTime",
                  "components",
                  "dependencies",
                ],
              },
            },
            reasoning: { type: Type.STRING },
          },
          required: ["isComplex", "suggestedSubProjects", "reasoning"],
        },
      },
    });

    if (!response.text) {
      throw new Error("AI response is empty");
    }

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);

    return parsedJson;
  } catch (error) {
    console.error("Gemini project complexity analysis failed:", error);
    throw new Error("Failed to analyze project complexity from AI.");
  }
};
