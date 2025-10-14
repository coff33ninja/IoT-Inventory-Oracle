import React, { useState, useEffect } from "react";
import { useInventory } from "../contexts/InventoryContext";
import { useCurrencyFormat } from "../hooks/useCurrencyFormat";
import { SpendingAnalysis, Project, InventoryItem } from "../types";
import BudgetOverview from "./budget/BudgetOverview";
import SpendingAnalyticsChart from "./budget/SpendingAnalyticsChart";
import CostBreakdownView from "./budget/CostBreakdownView";
import BudgetPlanningTool from "./budget/BudgetPlanningTool";
import BudgetAlerts from "./budget/BudgetAlerts";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from "./icons/AnalyticsIcons";

interface BudgetManagementDashboardProps {
  className?: string;
}

export interface BudgetFilters {
  timeframe: "7d" | "30d" | "90d" | "1y" | "all";
  categories: string[];
  projects: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const BudgetManagementDashboard: React.FC<BudgetManagementDashboardProps> = ({
  className = "",
}) => {
  const { spendingAnalysis, getSpendingInsights, projects, inventory } =
    useInventory();
  const { formatCurrency } = useCurrencyFormat();

  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "breakdown" | "planning"
  >("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BudgetFilters>({
    timeframe: "30d",
    categories: [],
    projects: [],
    dateRange: { start: null, end: null },
  });

  useEffect(() => {
    loadBudgetData();
  }, [filters.timeframe]);

  const loadBudgetData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await getSpendingInsights(filters.timeframe);
    } catch (err) {
      setError("Failed to load budget data. Please try again.");
      console.error("Budget loading error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: Partial<BudgetFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const calculateTotalProjectCosts = () => {
    return projects.reduce((total, project) => {
      const projectCost = project.components.reduce((sum, component) => {
        const inventoryItem = inventory.find(
          (item) => item.id === component.inventoryItemId
        );
        const price = inventoryItem?.purchasePrice || 0;
        return sum + price * component.quantity;
      }, 0);
      return total + projectCost;
    }, 0);
  };

  const getBudgetSummary = () => {
    const totalProjectCosts = calculateTotalProjectCosts();
    const totalSpent = spendingAnalysis?.totalSpent || 0;
    const averageProjectCost =
      projects.length > 0 ? totalProjectCosts / projects.length : 0;
    const budgetEfficiency = spendingAnalysis?.budgetEfficiency || 0;

    return {
      totalSpent,
      totalProjectCosts,
      averageProjectCost,
      budgetEfficiency,
      monthlyBudget:
        totalSpent /
        (filters.timeframe === "30d"
          ? 1
          : filters.timeframe === "90d"
          ? 3
          : 12),
      recommendationsCount: spendingAnalysis?.recommendations?.length || 0,
    };
  };

  const summary = getBudgetSummary();

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading budget data...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <BudgetOverview
              spendingAnalysis={spendingAnalysis}
              summary={summary}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
            <BudgetAlerts
              spendingAnalysis={spendingAnalysis}
              projects={projects}
              inventory={inventory}
            />
          </div>
        );

      case "analytics":
        return (
          <SpendingAnalyticsChart
            spendingAnalysis={spendingAnalysis}
            projects={projects}
            inventory={inventory}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        );

      case "breakdown":
        return (
          <CostBreakdownView
            spendingAnalysis={spendingAnalysis}
            projects={projects}
            inventory={inventory}
            filters={filters}
          />
        );

      case "planning":
        return (
          <BudgetPlanningTool
            spendingAnalysis={spendingAnalysis}
            projects={projects}
            inventory={inventory}
            onBudgetUpdate={loadBudgetData}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`budget-management-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-500 mr-3" />
              Budget Management
            </h1>
            <p className="text-text-secondary">
              Track spending, analyze costs, and plan future budgets
            </p>
          </div>
          <button
            onClick={loadBudgetData}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Refresh Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Total Spent</p>
              <p className="text-2xl font-semibold text-text-primary">
                {formatCurrency(summary.totalSpent)}
              </p>
              <p className="text-xs text-text-secondary">Last {filters.timeframe}</p>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ChartBarIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">
                Avg Project Cost
              </p>
              <p className="text-2xl font-semibold text-text-primary">
                {formatCurrency(summary.averageProjectCost)}
              </p>
              <p className="text-xs text-text-secondary">Per project</p>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <CalendarIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">
                Budget Efficiency
              </p>
              <p className="text-2xl font-semibold text-text-primary">
                {summary.budgetEfficiency.toFixed(1)}%
              </p>
              <p className="text-xs text-text-secondary">Efficiency rating</p>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">
                Recommendations
              </p>
              <p className="text-2xl font-semibold text-text-primary">
                {summary.recommendationsCount}
              </p>
              <p className="text-xs text-text-secondary">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-border-color">
          {[
            { id: "overview", label: "Overview", icon: ChartBarIcon },
            { id: "analytics", label: "Analytics", icon: ChartBarIcon },
            {
              id: "breakdown",
              label: "Cost Breakdown",
              icon: CurrencyDollarIcon,
            },
            { id: "planning", label: "Budget Planning", icon: CalendarIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-color"
              }`}>
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">{renderTabContent()}</div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
        <div className="flex items-start">
          <CurrencyDollarIcon className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
          <div className="text-sm text-text-primary">
            <p className="font-medium mb-1 text-green-300">Budget Management Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
              <li>
                Set realistic budgets based on historical spending patterns
              </li>
              <li>Review cost-saving opportunities regularly</li>
              <li>Track spending by category to identify trends</li>
              <li>Plan future projects with budget constraints in mind</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetManagementDashboard;
