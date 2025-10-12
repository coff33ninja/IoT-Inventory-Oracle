import React, { useMemo } from "react";
import { InventoryItem, Project, ItemStatus } from "../types";

interface AnalyticsDashboardProps {
  inventory: InventoryItem[];
  projects: Project[];
}

interface AnalyticsData {
  totalItems: number;
  totalValue: number;
  utilizationRate: number;
  categoryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  projectReadiness: {
    ready: number;
    partial: number;
    missing: number;
  };
  lowStockItems: InventoryItem[];
  duplicateComponents: string[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  inventory,
  projects,
}) => {
  const analytics = useMemo((): AnalyticsData => {
    // Calculate total items and estimated value
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((sum, item) => {
      const price = item.marketData?.[0]?.price?.replace(/[^0-9.]/g, "") || "0";
      return sum + parseFloat(price) * item.quantity;
    }, 0);

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    inventory.forEach((item) => {
      const category = item.category || "Uncategorized";
      categoryBreakdown[category] =
        (categoryBreakdown[category] || 0) + item.quantity;
    });

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    inventory.forEach((item) => {
      statusBreakdown[item.status] =
        (statusBreakdown[item.status] || 0) + item.quantity;
    });

    // Project readiness analysis
    let ready = 0,
      partial = 0,
      missing = 0;
    projects.forEach((project) => {
      const requiredComponents = project.components;
      const availableComponents = requiredComponents.filter((comp) => {
        const inventoryItem = inventory.find(
          (inv) =>
            inv.name.toLowerCase() === comp.name.toLowerCase() &&
            inv.status === ItemStatus.HAVE
        );
        return inventoryItem && inventoryItem.quantity >= comp.quantity;
      });

      if (availableComponents.length === requiredComponents.length) {
        ready++;
      } else if (availableComponents.length > 0) {
        partial++;
      } else {
        missing++;
      }
    });

    // Utilization rate (items in projects vs total inventory)
    const itemsInProjects = new Set();
    projects.forEach((project) => {
      project.components.forEach((comp) =>
        itemsInProjects.add(comp.name.toLowerCase())
      );
    });
    const utilizationRate =
      inventory.length > 0
        ? (itemsInProjects.size / inventory.length) * 100
        : 0;

    // Low stock items (quantity <= 2)
    const lowStockItems = inventory.filter(
      (item) => item.status === ItemStatus.HAVE && item.quantity <= 2
    );

    // Duplicate components (same name, different entries)
    const nameCount: Record<string, number> = {};
    inventory.forEach((item) => {
      const name = item.name.toLowerCase();
      nameCount[name] = (nameCount[name] || 0) + 1;
    });
    const duplicateComponents = Object.keys(nameCount).filter(
      (name) => nameCount[name] > 1
    );

    return {
      totalItems,
      totalValue,
      utilizationRate,
      categoryBreakdown,
      statusBreakdown,
      projectReadiness: { ready, partial, missing },
      lowStockItems,
      duplicateComponents,
    };
  }, [inventory, projects]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary">
        Analytics Dashboard
      </h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-secondary p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-text-secondary">
            Total Components
          </h3>
          <p className="text-2xl font-bold text-text-primary">
            {analytics.totalItems}
          </p>
        </div>
        <div className="bg-secondary p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-text-secondary">
            Estimated Value
          </h3>
          <p className="text-2xl font-bold text-text-primary">
            ${analytics.totalValue.toFixed(2)}
          </p>
        </div>
        <div className="bg-secondary p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-text-secondary">
            Utilization Rate
          </h3>
          <p className="text-2xl font-bold text-text-primary">
            {analytics.utilizationRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-secondary p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-text-secondary">
            Ready Projects
          </h3>
          <p className="text-2xl font-bold text-text-primary">
            {analytics.projectReadiness.ready}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-secondary p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Components by Category
        </h3>
        <div className="space-y-2">
          {Object.entries(analytics.categoryBreakdown).map(
            ([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-text-primary">{category}</span>
                <span className="text-text-secondary">{count} items</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Project Readiness */}
      <div className="bg-secondary p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Project Readiness
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {analytics.projectReadiness.ready}
            </div>
            <div className="text-sm text-text-secondary">Ready to Build</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {analytics.projectReadiness.partial}
            </div>
            <div className="text-sm text-text-secondary">Partially Ready</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {analytics.projectReadiness.missing}
            </div>
            <div className="text-sm text-text-secondary">
              Missing Components
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(analytics.lowStockItems.length > 0 ||
        analytics.duplicateComponents.length > 0) && (
        <div className="bg-secondary p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Alerts
          </h3>

          {analytics.lowStockItems.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                Low Stock Items
              </h4>
              <div className="space-y-1">
                {analytics.lowStockItems.map((item) => (
                  <div key={item.id} className="text-sm text-text-secondary">
                    {item.name} - Only {item.quantity} remaining
                  </div>
                ))}
              </div>
            </div>
          )}

          {analytics.duplicateComponents.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-blue-400 mb-2">
                Potential Duplicates
              </h4>
              <div className="space-y-1">
                {analytics.duplicateComponents.map((name) => (
                  <div key={name} className="text-sm text-text-secondary">
                    Multiple entries for: {name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
