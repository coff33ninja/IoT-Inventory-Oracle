import React from "react";
import { UsageAnalytics, SpendingAnalysis } from "../../types";
import {
  CubeIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "../icons/AnalyticsIcons";

interface AnalyticsMetricsProps {
  analytics: UsageAnalytics;
  spendingAnalysis: SpendingAnalysis | null;
}

const AnalyticsMetrics: React.FC<AnalyticsMetricsProps> = ({
  analytics,
  spendingAnalysis,
}) => {
  const calculateAverageUtilization = () => {
    if (analytics.componentUtilization.length === 0) return 0;
    const total = analytics.componentUtilization.reduce(
      (sum, comp) => sum + comp.utilizationRate,
      0
    );
    return total / analytics.componentUtilization.length;
  };

  const getTopCategory = () => {
    if (analytics.categoryBreakdown.length === 0) return "N/A";
    return analytics.categoryBreakdown.reduce((prev, current) =>
      prev.totalQuantityUsed > current.totalQuantityUsed ? prev : current
    ).category;
  };

  const getTrendDirection = (trend: "increasing" | "stable" | "decreasing") => {
    switch (trend) {
      case "increasing":
        return {
          icon: TrendingUpIcon,
          color: "text-green-500",
          label: "Increasing",
        };
      case "decreasing":
        return {
          icon: TrendingDownIcon,
          color: "text-red-500",
          label: "Decreasing",
        };
      default:
        return { icon: ChartBarIcon, color: "text-gray-500", label: "Stable" };
    }
  };

  const metrics = [
    {
      title: "Total Projects",
      value: analytics.totalProjects.toString(),
      icon: CubeIcon,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      description: "Projects analyzed",
    },
    {
      title: "Average Utilization",
      value: `${calculateAverageUtilization().toFixed(1)}%`,
      icon: ChartBarIcon,
      color: "text-green-500",
      bgColor: "bg-green-50",
      description: "Component usage rate",
    },
    {
      title: "Active Components",
      value: analytics.componentUtilization.length.toString(),
      icon: CubeIcon,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      description: "Components in use",
    },
    {
      title: "Top Category",
      value: getTopCategory(),
      icon: ChartBarIcon,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      description: "Most used category",
    },
  ];

  // Add spending metrics if available
  if (spendingAnalysis) {
    metrics.push(
      {
        title: "Total Spent",
        value: `$${spendingAnalysis.totalSpent.toFixed(2)}`,
        icon: CurrencyDollarIcon,
        color: "text-yellow-500",
        bgColor: "bg-yellow-50",
        description: "Total expenditure",
      },
      {
        title: "Budget Efficiency",
        value: `${spendingAnalysis.budgetEfficiency.toFixed(1)}%`,
        icon: CurrencyDollarIcon,
        color: "text-orange-500",
        bgColor: "bg-orange-50",
        description: "Budget utilization efficiency",
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-secondary p-6 rounded-lg shadow border border-border-color">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">
                  {metric.title}
                </p>
                <p className="text-2xl font-semibold text-text-primary">
                  {metric.value}
                </p>
                <p className="text-xs text-text-secondary">
                  {metric.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trending Categories */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Category Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.categoryBreakdown.slice(0, 6).map((category, index) => {
            const trend = getTrendDirection(category.popularityTrend);
            return (
              <div
                key={`analytics-trend-${category.category}`}
                className="flex items-center justify-between p-4 bg-primary rounded-lg border border-border-color">
                <div>
                  <p className="font-medium text-text-primary">
                    {category.category}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {category.totalComponents} components
                  </p>
                  <p className="text-xs text-text-secondary">
                    Avg: ${category.averagePrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center">
                  <trend.icon className={`h-5 w-5 ${trend.color}`} />
                  <span className={`text-xs ml-1 ${trend.color}`}>
                    {trend.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spending Analysis */}
      {spendingAnalysis && (
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Spending Analysis
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending Breakdown */}
            <div>
              <h4 className="font-medium text-text-primary mb-3">
                Spending by Category
              </h4>
              <div className="space-y-2">
                {spendingAnalysis.spendingByCategory
                  .slice(0, 5)
                  .map((item, index) => (
                    <div
                      key={`analytics-spending-${item.category}`}
                      className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            index === 0
                              ? "bg-blue-500"
                              : index === 1
                              ? "bg-green-500"
                              : index === 2
                              ? "bg-yellow-500"
                              : index === 3
                              ? "bg-red-500"
                              : "bg-purple-500"
                          }`}
                        />
                        <span className="text-sm font-medium text-text-primary">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-text-primary">
                          ${item.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Budget Utilization */}
            <div>
              <h4 className="font-medium text-text-primary mb-3">
                Budget Status
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Budget Efficiency</span>
                    <span>{spendingAnalysis.budgetEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-primary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        spendingAnalysis.budgetEfficiency > 90
                          ? "bg-green-500 w-full"
                          : spendingAnalysis.budgetEfficiency > 75
                          ? "bg-yellow-500 w-4/5"
                          : spendingAnalysis.budgetEfficiency > 50
                          ? "bg-yellow-500 w-3/5"
                          : spendingAnalysis.budgetEfficiency > 25
                          ? "bg-red-500 w-2/5"
                          : "bg-red-500 w-1/5"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">
                    Recommendations:
                  </span>
                  <span className="text-sm text-text-primary">
                    {spendingAnalysis.recommendations?.length || 0} available
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {spendingAnalysis.recommendations &&
            spendingAnalysis.recommendations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border-color">
                <h4 className="font-medium text-text-primary mb-3 flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-accent mr-2" />
                  Spending Recommendations
                </h4>
                <div className="space-y-2">
                  {spendingAnalysis.recommendations
                    .slice(0, 3)
                    .map((recommendation: string, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-text-primary">
                          {recommendation}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Waste Analysis Alert */}
      {analytics.wasteAnalysis &&
        analytics.wasteAnalysis.unusedComponents > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-red-800">
                  Waste Alert: {analytics.wasteAnalysis.unusedComponents} unused
                  components
                </h4>
                <p className="text-sm text-red-700">
                  Total waste value: $
                  {analytics.wasteAnalysis.totalWasteValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AnalyticsMetrics;
