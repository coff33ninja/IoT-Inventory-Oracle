import React from "react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCurrencyFormat } from "../../hooks/useCurrencyFormat";
import {
  LightBulbIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "../icons/AnalyticsIcons";

interface BudgetOptimizationPanelProps {
  className?: string;
}

const BudgetOptimizationPanel: React.FC<BudgetOptimizationPanelProps> = ({
  className = "",
}) => {
  const { getBudgetOptimization, getSpendingForecast } = useInventory();
  const { formatCurrency } = useCurrencyFormat();

  const budgetOptimization = getBudgetOptimization();
  const spendingForecast = getSpendingForecast(30);

  const getEffortIcon = (effort: "low" | "medium" | "high") => {
    switch (effort) {
      case "low":
        return CheckCircleIcon;
      case "medium":
        return ClockIcon;
      case "high":
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const getEffortColor = (effort: "low" | "medium" | "high") => {
    switch (effort) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getImpactColor = (impact: "low" | "medium" | "high") => {
    switch (impact) {
      case "low":
        return "bg-blue-900/20 text-blue-400 border-blue-500/20";
      case "medium":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-500/20";
      case "high":
        return "bg-green-900/20 text-green-400 border-green-500/20";
      default:
        return "bg-gray-900/20 text-gray-400 border-gray-500/20";
    }
  };

  const totalPotentialSavings =
    budgetOptimization.optimizationOpportunities.reduce(
      (sum, opp) => sum + opp.potentialSavings,
      0
    );

  return (
    <div className={`budget-optimization-panel ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center">
              <LightBulbIcon className="h-8 w-8 text-yellow-500 mr-3" />
              Budget Optimization
            </h2>
            <p className="text-text-secondary">
              Identify opportunities to improve your budget efficiency
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(totalPotentialSavings)}
            </div>
            <div className="text-sm text-text-secondary">Potential Savings</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <ChartBarIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">
                Current Efficiency
              </p>
              <p className="text-2xl font-semibold text-text-primary">
                {budgetOptimization.currentEfficiency.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <LightBulbIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">
                Opportunities
              </p>
              <p className="text-2xl font-semibold text-text-primary">
                {budgetOptimization.optimizationOpportunities.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">
                Forecast Confidence
              </p>
              <p className="text-2xl font-semibold text-text-primary">
                {spendingForecast.confidence.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Opportunities */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Optimization Opportunities
        </h3>

        {budgetOptimization.optimizationOpportunities.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-text-primary font-medium">Great job!</p>
            <p className="text-text-secondary">
              No major optimization opportunities found at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetOptimization.optimizationOpportunities.map(
              (opportunity, index) => {
                const EffortIcon = getEffortIcon(opportunity.effort);
                const effortColor = getEffortColor(opportunity.effort);
                const impactColor = getImpactColor(opportunity.impact);

                return (
                  <div
                    key={index}
                    className="p-4 bg-primary rounded-lg border border-border-color">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-medium text-text-primary capitalize">
                            {opportunity.type.replace("_", " ")}
                          </h4>
                          <div className="flex items-center ml-3 space-x-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${impactColor}`}>
                              {opportunity.impact} impact
                            </span>
                            <div className="flex items-center">
                              <EffortIcon
                                className={`h-4 w-4 ${effortColor} mr-1`}
                              />
                              <span className="text-xs text-text-secondary">
                                {opportunity.effort} effort
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">
                          {opportunity.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-semibold text-green-400">
                          {formatCurrency(opportunity.potentialSavings)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          Potential savings
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-text-secondary">
                        <span>Impact: {opportunity.impact}</span>
                        <span>•</span>
                        <span>Effort: {opportunity.effort}</span>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors">
                        Learn More
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Recommended Actions */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Recommended Actions
        </h3>

        {budgetOptimization.recommendedActions.length === 0 ? (
          <p className="text-text-secondary">
            No specific actions recommended at this time.
          </p>
        ) : (
          <div className="space-y-3">
            {budgetOptimization.recommendedActions.map((action, index) => (
              <div
                key={index}
                className="flex items-start p-3 bg-green-900/10 rounded-lg border border-green-500/20">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-text-primary">{action}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending Forecast */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <ChartBarIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
          <div className="text-sm text-text-primary">
            <p className="font-medium mb-1 text-blue-300">
              30-Day Spending Forecast:
            </p>
            <p className="text-text-secondary mb-2">
              Projected spending:{" "}
              {formatCurrency(spendingForecast.projectedSpending)}
              (Confidence: {spendingForecast.confidence.toFixed(0)}%)
            </p>
            <div className="space-y-1">
              {spendingForecast.breakdown.slice(0, 3).map((category, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-text-secondary">
                    {category.category}:
                  </span>
                  <span className="text-text-primary">
                    {formatCurrency(category.projectedAmount)}
                    <span
                      className={`ml-1 ${
                        category.trend === "increasing"
                          ? "text-red-400"
                          : category.trend === "decreasing"
                          ? "text-green-400"
                          : "text-text-secondary"
                      }`}>
                      ({category.trend})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetOptimizationPanel;
