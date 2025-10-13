import React, { useState, useMemo } from "react";
import { InventoryItem, ItemStatus } from "../types";
import EnhancedInventoryTable from "./EnhancedInventoryTable";
import { useInventory } from "../contexts/InventoryContext";
import { STATUS_CONFIG } from "../constants";
import CheckoutModal from "./CheckoutModal";
import { CheckoutIcon } from "./icons/CheckoutIcon";
import ComponentDetailModal from "./ComponentDetailModal";
import { ChevronDownIcon } from "./icons/ChevronDownIcon";

interface InventoryViewProps {
  onEdit: (item: InventoryItem) => void;
  onCheckoutComplete: (
    projectName: string,
    components: { id: string; name: string; quantity: number }[]
  ) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({
  onEdit,
  onCheckoutComplete,
}) => {
  const { inventory, deleteItem, checkoutItems, addItem } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ItemStatus>(ItemStatus.HAVE);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>(
    {}
  );
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Core", "Sensors"])
  );

  const handleSort = (key: string) => {
    setSortConfig(
      (prevConfig: { key: string; direction: "asc" | "desc" } | null) => {
        if (prevConfig?.key === key) {
          if (prevConfig.direction === "asc") return { key, direction: "desc" };
          return null; // Cycle from desc to unsorted
        }
        return { key, direction: "asc" }; // Default to ascending
      }
    );
  };

  const filteredInventory = useMemo(
    () =>
      inventory
        .filter(
          (item) =>
            (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              item.source?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            item.status === activeTab
        )
        .sort((a, b) => {
          if (!sortConfig) return 0;

          let valA: string | number = "";
          let valB: string | number = "";

          if (sortConfig.key === "name") {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
          } else if (sortConfig.key === "quantity") {
            valA = a.quantity;
            valB = b.quantity;
          } else if (sortConfig.key === "location") {
            valA = a.location.toLowerCase();
            valB = b.location.toLowerCase();
          } else if (sortConfig.key === "source") {
            valA = a.source?.toLowerCase() || "";
            valB = b.source?.toLowerCase() || "";
          } else {
            // Default to name sort if key is not recognized
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
          }

          if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
          if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        }),
    [inventory, searchTerm, activeTab, sortConfig]
  );

  // Fix: Refactored inventory grouping to use `reduce` for more stable type inference, resolving an issue on `items.length`.
  const groupedInventory = useMemo(() => {
    return filteredInventory.reduce(
      (groups: Record<string, InventoryItem[]>, item: InventoryItem) => {
        const category = item.category || "Uncategorized";
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(item);
        return groups;
      },
      {} as Record<string, InventoryItem[]>
    );
  }, [filteredInventory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleSelectionChange = (itemId: string, quantity: number) => {
    setSelectedItems((prev: Record<string, number>) => {
      const newSelection = { ...prev };
      if (quantity > 0) {
        newSelection[itemId] = quantity;
      } else {
        delete newSelection[itemId];
      }
      return newSelection;
    });
  };

  const handleConfirmCheckout = (purpose: string) => {
    const itemsToCheckout = Object.keys(selectedItems).map((id) => ({
      id,
      quantity: selectedItems[id],
    }));
    checkoutItems(itemsToCheckout);

    const checkedOutComponents = itemsToCheckout.map((item) => {
      const fullItem = inventory.find((i) => i.id === item.id)!;
      return { id: fullItem.id, name: fullItem.name, quantity: item.quantity };
    });

    onCheckoutComplete(purpose, checkedOutComponents);

    setSelectedItems({});
    setIsCheckoutModalOpen(false);
  };

  const handleItemClick = (item: InventoryItem) => {
    setDetailItem(item);
  };

  const handlePriceCheck = async (item: InventoryItem) => {
    try {
      const { getComponentIntelligence } = await import(
        "../services/geminiService"
      );
      const intelligence = await getComponentIntelligence(item.name);

      // This will trigger the ComponentDetailModal to show updated prices
      setDetailItem({
        ...item,
        marketData: intelligence.marketData,
        lastRefreshed: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to check prices:", error);
    }
  };

  const selectedCount = Object.keys(selectedItems).length;

  // Recommendation handlers
  const handleAcceptAlternative = async (
    itemId: string,
    alternativeId: string
  ) => {
    try {
      // Get the client-side recommendation service
      const { ClientRecommendationService } = await import(
        "../services/clientRecommendationService"
      );

      const originalItem = inventory.find((item) => item.id === itemId);
      if (!originalItem) return;

      // Get the actual alternative details from the client-side service
      const alternatives =
        ClientRecommendationService.findComponentAlternatives(
          originalItem,
          inventory
        );
      const selectedAlternative = alternatives.find(
        (alt) => alt.componentId === alternativeId
      );

      if (!selectedAlternative) {
        console.error(`Alternative ${alternativeId} not found`);
        return;
      }

      // Create the alternative component based on the recommendation data
      const alternativeComponent = {
        id: `alt-${alternativeId}-${Date.now()}`,
        name: selectedAlternative.name,
        quantity: 1,
        location: originalItem.location,
        status: ItemStatus.WANT,
        category: originalItem.category,
        description: selectedAlternative.explanation,
        createdAt: new Date().toISOString(),
        source: "recommendation",
        purchasePrice: selectedAlternative.priceComparison.alternative,
      };

      await addItem(alternativeComponent);
      console.log(
        `Added alternative ${selectedAlternative.name} for ${originalItem.name}`
      );
    } catch (error) {
      console.error("Failed to accept alternative:", error);
    }
  };

  const handleAddToWishlist = async (itemId: string, alternativeId: string) => {
    try {
      // Get the client-side recommendation service
      const { ClientRecommendationService } = await import(
        "../services/clientRecommendationService"
      );

      const originalItem = inventory.find((item) => item.id === itemId);
      if (!originalItem) return;

      // Get the actual alternative details from the client-side service
      const alternatives =
        ClientRecommendationService.findComponentAlternatives(
          originalItem,
          inventory
        );
      const selectedAlternative = alternatives.find(
        (alt) => alt.componentId === alternativeId
      );

      if (!selectedAlternative) {
        console.error(`Alternative ${alternativeId} not found`);
        return;
      }

      // Create wishlist entry with actual alternative data
      const wishlistComponent = {
        id: `wishlist-${alternativeId}-${Date.now()}`,
        name: `${selectedAlternative.name} (Wishlist)`,
        quantity: 1,
        location: "Wishlist",
        status: ItemStatus.WANT,
        category: originalItem.category,
        description: `${selectedAlternative.explanation} - Added to wishlist`,
        createdAt: new Date().toISOString(),
        source: "recommendation-wishlist",
        purchasePrice: selectedAlternative.priceComparison.alternative,
      };

      await addItem(wishlistComponent);
      console.log(`Added ${selectedAlternative.name} to wishlist`);
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
    }
  };

  const handleReorderItem = async (itemId: string) => {
    try {
      const item = inventory.find((i) => i.id === itemId);
      if (!item) return;

      // Use client-side prediction for reorder quantity
      let suggestedQuantity = Math.max(5, Math.ceil(item.quantity * 1.5));

      try {
        const { ClientRecommendationService } = await import(
          "../services/clientRecommendationService"
        );

        // Generate predictions to get better reorder quantity
        const predictions =
          ClientRecommendationService.generateStockPredictions(item);
        if (predictions.length > 0) {
          suggestedQuantity = predictions[0].quantity;
        }
      } catch (predictionError) {
        console.warn(
          "Failed to get prediction-based reorder quantity, using fallback:",
          predictionError
        );
      }

      // Create a reorder entry in the "I Need" status
      const reorderComponent = {
        id: `reorder-${itemId}-${Date.now()}`,
        name: `${item.name} (Reorder)`,
        quantity: suggestedQuantity,
        location: item.location,
        status: ItemStatus.NEED,
        category: item.category,
        description: `Reorder for ${item.name} - low stock detected (current: ${item.quantity})`,
        createdAt: new Date().toISOString(),
        source: "auto-reorder",
        purchasePrice: item.purchasePrice,
      };

      await addItem(reorderComponent);
      console.log(
        `Created reorder entry for ${item.name} (quantity: ${suggestedQuantity})`
      );
    } catch (error) {
      console.error("Failed to create reorder:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-text-primary">
          My IoT Inventory
        </h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search current tab..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
            className="w-full md:w-64 bg-secondary border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-text-secondary"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="border-b border-border-color">
        <nav
          className="-mb-px flex space-x-6 overflow-x-auto"
          aria-label="Tabs">
          {Object.values(ItemStatus).map((status) => (
            <button
              type="button"
              key={status}
              onClick={() => {
                setActiveTab(status);
                setSelectedItems({}); // Clear selection when changing tabs
                setSortConfig(null); // Reset sort when changing tabs
              }}
              className={`${
                activeTab === status
                  ? "border-accent text-accent"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500"
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>
              {STATUS_CONFIG[status].label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {Object.keys(groupedInventory).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedInventory)
              .sort(([catA], [catB]) => catA.localeCompare(catB))
              .map(([category, items], index) => (
                <div
                  key={`${category}-${index}`}
                  className="bg-secondary rounded-lg border border-border-color overflow-hidden transition-all duration-300">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full flex justify-between items-center p-4 bg-secondary hover:bg-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent"
                    {...{ "aria-expanded": expandedCategories.has(category) }}
                    aria-controls={`category-panel-${category}`}>
                    <h3 className="font-semibold text-lg text-text-primary">
                      {category}{" "}
                      <span className="text-sm font-normal text-text-secondary">
                        ({items.length})
                      </span>
                    </h3>
                    <ChevronDownIcon
                      className={`h-6 w-6 text-text-secondary transition-transform duration-300 ${
                        expandedCategories.has(category) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedCategories.has(category) && (
                    <div
                      className="p-4 border-t border-border-color"
                      id={`category-panel-${category}`}>
                      <EnhancedInventoryTable
                        items={items}
                        onEdit={onEdit}
                        onDelete={deleteItem}
                        onItemClick={handleItemClick}
                        onPriceCheck={handlePriceCheck}
                        selectable={activeTab === ItemStatus.HAVE}
                        selectedItems={selectedItems}
                        onSelectionChange={handleSelectionChange}
                        showDescriptions={true}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        showCategory={false}
                        enableRecommendations={true}
                        onAcceptAlternative={handleAcceptAlternative}
                        onAddToWishlist={handleAddToWishlist}
                        onReorderItem={handleReorderItem}
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-secondary rounded-lg">
            <h3 className="text-xl font-semibold text-text-primary">
              {searchTerm
                ? "No Results Found"
                : `No items in "${STATUS_CONFIG[activeTab].label}"`}
            </h3>
            <p className="text-text-secondary mt-2">
              {searchTerm
                ? "Try adjusting your search term."
                : `Click the '+' button to add an item.`}
            </p>
          </div>
        )}
      </div>

      {activeTab === ItemStatus.HAVE && selectedCount > 0 && (
        <button
          type="button"
          onClick={() => setIsCheckoutModalOpen(true)}
          className="fixed bottom-6 right-24 bg-highlight hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-highlight z-20 flex items-center"
          aria-label="Checkout selected items">
          <CheckoutIcon />
          <span className="ml-2 font-bold">{`Checkout ${selectedCount} Item${
            selectedCount > 1 ? "s" : ""
          }`}</span>
        </button>
      )}

      {isCheckoutModalOpen && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          onConfirm={handleConfirmCheckout}
          selectedItems={Object.entries(selectedItems).map(([id, quantity]) => {
            const item = inventory.find((i) => i.id === id);
            return { ...item!, quantity };
          })}
        />
      )}

      {detailItem && (
        <ComponentDetailModal
          item={detailItem}
          isOpen={!!detailItem}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
};

export default InventoryView;
